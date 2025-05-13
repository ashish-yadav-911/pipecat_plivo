import datetime
import io
import os
import sys
import wave
from pathlib import Path

import aiofiles
from dotenv import load_dotenv
from fastapi import WebSocket
from logger import logger
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.audio.audio_buffer_processor import AudioBufferProcessor
# from pipecat.serializers.twilio import TwilioFrameSerializer
from plivo_serial import PlivoFrameSerializer

from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.network.fastapi_websocket import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)

# Import SYSTEM_PROMPT from prompt.py
try:
    from prompt import SYSTEM_PROMPT
    logger.info("Successfully imported SYSTEM_PROMPT from prompt.py")
except ImportError as e:
    logger.error(f"Failed to import SYSTEM_PROMPT: {e}")
    SYSTEM_PROMPT = None

load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")

async def save_audio(server_name: str, audio: bytes, sample_rate: int, num_channels: int):
    if len(audio) > 0:
        # Get the absolute path to the recordings directory
        current_dir = Path(__file__).resolve().parent
        recordings_dir = current_dir.parent / "recordings"
        recordings_dir.mkdir(exist_ok=True)
        
        filename = recordings_dir / f"{server_name}_recording_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
        
        with io.BytesIO() as buffer:
            with wave.open(buffer, "wb") as wf:
                wf.setsampwidth(2)
                wf.setnchannels(num_channels)
                wf.setframerate(sample_rate)
                wf.writeframes(audio)
            async with aiofiles.open(str(filename), "wb") as file:
                await file.write(buffer.getvalue())
        logger.info(f"Merged audio saved to {filename}")
    else:
        logger.info("No audio data to save")


async def run_bot(websocket_client: WebSocket, stream_sid: str, testing: bool):
    logger.info("Initializing bot with stream_sid: {}", stream_sid)
    transport = FastAPIWebsocketTransport(
        websocket=websocket_client,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
            serializer=PlivoFrameSerializer(stream_sid),
        ),
    )

    llm = OpenAILLMService(api_key=os.getenv("OPENAI_API_KEY"), 
                           model="gpt-4.1")

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"), 
                             audio_passthrough=True)

    tts = ElevenLabsTTSService(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
        voice_id=os.getenv("ELEVENLABS_VOICE_ID"),
        push_silence_after_stop=True,
    )

    # Use imported SYSTEM_PROMPT or fallback to default
    system_prompt = SYSTEM_PROMPT if SYSTEM_PROMPT else "You are a helpful assistant named Mirai. Your output will be converted to audio so don't include special characters in your answers. Respond with a short short sentence. You are developed by a company called Iffort."

    messages = [
        {
            "role": "system",
            "content": system_prompt,
        },
    ]

    context = OpenAILLMContext(messages)
    context_aggregator = llm.create_context_aggregator(context)

    # NOTE: Watch out! This will save all the conversation in memory. You can
    # pass `buffer_size` to get periodic callbacks.
    audiobuffer = AudioBufferProcessor(user_continuous_stream=not testing)

    pipeline = Pipeline(
        [
            transport.input(),  # Websocket input from client
            stt,  # Speech-To-Text
            context_aggregator.user(),
            llm,  # LLM
            tts,  # Text-To-Speech
            transport.output(),  # Websocket output to client
            audiobuffer,  # Used to buffer the audio in the pipeline
            context_aggregator.assistant(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            audio_in_sample_rate=16000,
            audio_out_sample_rate=16000,
            allow_interruptions=True,
            enable_metrics=True,
            disable_buffers=True
        ),
    )

    logger.debug("Pipeline and services initialized successfully.")

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info("Client connected: {}", client)
        try:
            # Start recording.
            await audiobuffer.start_recording()
            # Kick off the conversation.
            messages.append({"role": "system", "content": "Please introduce yourself to the user."})
            await task.queue_frames([context_aggregator.user().get_context_frame()])
        except Exception as e:
            logger.error("Error during client connection handling: {}", e)

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected: {}", client)
        try:
            await task.cancel()
        except Exception as e:
            logger.error("Error during client disconnection handling: {}", e)

    @audiobuffer.event_handler("on_audio_data")
    async def on_audio_data(buffer, audio, sample_rate, num_channels):
        logger.debug("Audio data received: sample_rate={}, num_channels={}", sample_rate, num_channels)
        try:
            server_name = f"server_{websocket_client.client.port}"
            await save_audio(server_name, audio, sample_rate, num_channels)
        except Exception as e:
            logger.error("Error while saving audio data: {}", e)

    # We use `handle_sigint=False` because `uvicorn` is controlling keyboard
    # interruptions. We use `force_gc=True` to force garbage collection after
    # the runner finishes running a task which could be useful for long running
    # applications with multiple clients connecting.
    runner = PipelineRunner(handle_sigint=False, force_gc=True)

    try:
        await runner.run(task)
        logger.info("Pipeline runner executed successfully.")
    except Exception as e:
        logger.error("Error during pipeline execution: {}", e)