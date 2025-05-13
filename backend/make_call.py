#!/usr/bin/env python3
import argparse
import os
import sys
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

def make_call(phone_number, server_url=None):
    """
    Make an outbound call to the specified phone number.
    
    Args:
        phone_number (str): The phone number to call (with or without + prefix)
        server_url (str, optional): The URL of the server. Defaults to localhost:8765.
    
    Returns:
        dict: The response from the server
    """
    if server_url is None:
        server_url = "http://localhost:8765"
    
    # Ensure the server URL doesn't end with a slash
    server_url = server_url.rstrip("/")
    
    # Make the request
    try:
        response = requests.post(f"{server_url}/call/{phone_number}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error making call: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Make an outbound call using the Pipecat Twilio Agent")
    parser.add_argument("phone_number", help="The phone number to call (with or without + prefix)")
    parser.add_argument("-u", "--url", help="The URL of the server (default: http://localhost:8765)")
    
    args = parser.parse_args()
    
    # Get the server URL from environment or use the default
    server_url = args.url or os.getenv("SERVER_URL", "http://localhost:8765")
    
    # Make the call
    result = make_call(args.phone_number, server_url)
    
    if result:
        print(f"Call initiated successfully! Call SID: {result.get('call_sid')}")
    else:
        print("Failed to initiate call.")
        sys.exit(1)

if __name__ == "__main__":
    main() 