'use client';
import { useState } from 'react';
import Lottie from 'lottie-react';
import bgAnimation from '../public/bg-lottie.json'; // pastikan file ini ada ya

export default function UnlockPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '', success: false });

  const handleUnlock = async () => {
    if (!username.trim()) {
      return setPopup({
        show: true,
        message: 'Please enter your Twitter username',
        success: false,
      });
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/follow-check?username=${username.trim()}`);
      const data = await res.json();

      if (res.ok && data?.following) {
        setPopup({
          show: true,
          message: data?.newUser
            ? 'Welcome! Feature unlocked for the first time.'
            : 'Welcome back! You already unlocked this before.',
          success: true,
        });
      } else {
        setPopup({
          show: true,
          message: 'You must follow our Twitter to unlock.',
          success: false,
        });
      }
    } catch (err) {
      setPopup({
        show: true,
        message: 'Something went wrong. Please try again!',
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Lottie Background */}
      <div className="absolute inset-0 opacity-30 z-0 pointer-events-none">
        <Lottie animationData={bgAnimation} loop autoplay />
      </div>

      {/* Popup */}
      {popup.show && (
        <div
          className={`absolute top-6 z-20 px-6 py-4 rounded-xl shadow-xl transition-all duration-300
          ${popup.success ? 'bg-green-600' : 'bg-red-600'} text-white`}
        >
          <p className="mb-1">{popup.message}</p>
          <button
            onClick={() => setPopup({ show: false, message: '', success: false })}
            className="text-sm underline hover:text-gray-300"
          >
            Close
          </button>
        </div>
      )}

      {/* Konten */}
      <div className="relative z-10 text-center text-white px-4 max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg mb-3">
          Card README Unlocker
        </h1>
        <p className="text-gray-200 mb-6">
          Welcome! Follow our Twitter to unlock exclusive GitHub README features.
        </p>

        <input
          type="text"
          placeholder="Enter your Twitter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="px-4 py-2 rounded-md text-black mb-4 w-full"
        />

        <button
          onClick={handleUnlock}
          className={`w-full bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Unlock'}
        </button>

        <p className="mt-6 text-sm italic text-gray-300">
          “We appreciate your support – you're helping us grow.”
        </p>
      </div>
    </div>
  );
}
