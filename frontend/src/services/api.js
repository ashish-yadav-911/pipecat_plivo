import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const makeCall = async (phoneNumber) => {
  try {
    // Send the phone number as is, including country code if provided
    console.log(`Making API call to ${API_BASE_URL}/start-call`);
    const response = await api.post(`/start-call`);
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API error:', error.response || error);
    throw error;
  }
};

export const getCallLogs = async () => {
  try {
    console.log(`Fetching call logs from ${API_BASE_URL}/calls`);
    const response = await api.get('/calls');
    console.log('Call logs response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API error:', error.response || error);
    throw error;
  }
};

export const getRecording = async (recordingId) => {
  try {
    console.log(`Fetching recording ${recordingId} from ${API_BASE_URL}/recordings/${recordingId}`);
    const response = await api.get(`/recordings/${recordingId}`);
    console.log('Recording response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API error:', error.response || error);
    throw error;
  }
}; 