import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { getCallLogs } from '../services/api';

const Dashboard = () => {
  const [calls, setCalls] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch call logs from backend
    const fetchCalls = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCallLogs();
        setCalls(data);
      } catch (error) {
        console.error('Error fetching calls:', error);
        setError('Failed to load call logs. Please try again later.');
        // Fallback to mock data for development
        const mockCalls = [
          {
            id: 1,
            phoneNumber: '+1 9876543210',
            duration: '2:30',
            status: 'Completed',
            timestamp: '2024-04-16 10:30 AM',
            recordingUrl: '/recordings/sample1.wav'
          },
          {
            id: 2,
            phoneNumber: '+1 8765432109',
            duration: '1:45',
            status: 'In Progress',
            timestamp: '2024-04-16 11:15 AM',
            recordingUrl: '/recordings/sample2.wav'
          }
        ];
        setCalls(mockCalls);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalls();
  }, []);

  const handlePlayPause = (recordingUrl) => {
    if (!recordingUrl) {
      console.error('No recording URL provided');
      return;
    }

    // Construct the full URL if it's a relative path
    const fullUrl = recordingUrl.startsWith('http') 
      ? recordingUrl 
      : `${process.env.REACT_APP_API_URL}${recordingUrl}`;
    
    console.log('Playing recording from:', fullUrl);

    if (currentAudio && currentAudio.src.includes(recordingUrl)) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (currentAudio) {
        currentAudio.pause();
      }
      const audio = new Audio(fullUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('error', (e) => {
        console.error('Error playing audio:', e);
        setError('Failed to play recording. The file may not exist.');
      });
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play recording. The file may not exist.');
      });
      setCurrentAudio(audio);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-black px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-primary text-2xl font-bold">HoomanLabs</Link>
          <Link to="/" className="text-white hover:underline">Back to Home</Link>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Call Logs Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recording
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No call logs found
                    </td>
                  </tr>
                ) : (
                  calls.map((call) => (
                    <tr key={call.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${call.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {call.recordingUrl ? (
                          <button
                            onClick={() => handlePlayPause(call.recordingUrl)}
                            className="text-primary hover:text-primary/80 focus:outline-none"
                          >
                            {isPlaying && currentAudio?.src.includes(call.recordingUrl) ? (
                              <PauseIcon className="h-6 w-6" />
                            ) : (
                              <PlayIcon className="h-6 w-6" />
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400">No recording</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard; 