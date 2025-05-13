import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { makeCall } from '../services/api';

const LandingPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    // Validate phone number with country code (e.g., +91XXXXXXXXXX)
    setIsValid(/^\+?[0-9]{10,15}$/.test(value));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isValid) {
      setIsLoading(true);
      setError(null);
      try {
        // Send the phone number as is, including country code if provided
        console.log('Making call to:', phoneNumber);
        await makeCall(phoneNumber);
        setSuccess(true);
        setPhoneNumber('');
        setIsValid(false);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to initiate call. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-primary text-2xl font-bold">Iffort</span>
        </div>
        <div className="space-x-6">
          <Link to="#" className="hover:underline">Pricing</Link>
          <Link to="#" className="hover:underline">Contact us</Link>
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 mt-20 text-center">
        <h1 className="text-5xl font-bold text-secondary mb-6">
          Automate Phone Calls with AI
        </h1>
        <p className="text-gray-400 text-xl mb-12 max-w-3xl mx-auto">
          Iffort helps your company build and deploy AI voice agents that acts like human and scales like machine
        </p>

        {/* CTA Box */}
        <div className="max-w-md mx-auto bg-dark p-8 rounded-lg border-2 border-primary">
          <h2 className="text-2xl font-bold mb-6">Talk to Assistant</h2>
          {success ? (
            <div className="bg-green-800 text-white p-4 rounded-md mb-4">
              Call initiated successfully! Check the dashboard for call logs.
            </div>
          ) : null}
          {error ? (
            <div className="bg-red-800 text-white p-4 rounded-md mb-4">
              {error}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center bg-white rounded-md">
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Enter your phone number (with country code)"
                className="w-full px-4 py-2 text-black focus:outline-none rounded-md"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`w-full py-3 px-6 rounded-md flex items-center justify-center space-x-2
                ${isValid && !isLoading ? 'bg-primary hover:bg-primary/90' : 'bg-dark-light cursor-not-allowed'}`}
            >
              {isLoading ? (
                <span>Initiating call...</span>
              ) : (
                <>
                  <PhoneIcon className="h-5 w-5" />
                  <span>Call Me</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LandingPage; 