'use client';
import { useState } from 'react';
import Lottie from 'lottie-react';
import bgAnim from '../public/bg-lottie.json'; // pastikan path ini benar
import '../styles/globals.css'; // jika pakai global style

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
      const res = await fetch('/api/follow-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.status === 'newly_verified') {
          setPopup({
            show: true,
            message: 'Thanks for following! Feature unlocked.',
            success: true,
          });
        } else if (data.status === 'already_verified') {
          setPopup({
            show: true,
            message: 'Welcome back! You already unlocked this before.',
            success: true,
          });
        } else {
          setPopup({
            show: true,
            message: 'Something went wrong. Please try again.',
            success: false,
          });
        }
      } else {
        setPopup({
          show: true,
          message: data.error || 'Error during unlock process.',
          success: false,
        });
      }
    } catch (err) {
      setPopup({
        show: true,
        message: 'Unexpected error occurred!',
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Background Lottie */}
      <div className="absolute inset-0 -z-10 opacity-60">
        <Lottie animationData={bgAnim} loop autoplay />
      </div>

      {/* Popup Notification */}
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

      {/* Konten Utama */}
      <div className="relative z-10 text-center text-white px-4">
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
          className="px-4 py-2 rounded-md text-black mb-4 w-full max-w-xs"
        />

        <br />
        <button
          onClick={handleUnlock}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold"
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
