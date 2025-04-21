'use client';
import { useState } from 'react';
import PlanetBackground from '../components/PlanetBackground';
import toast from 'react-hot-toast';

export default function UnlockPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!username) return toast.error('Please enter your Twitter username');
    setLoading(true);
    try {
      const res = await fetch(`/api/follow-check?username=${username}`);
      const data = await res.json();
      if (data.following) {
        toast.success('Thanks for following! Feature unlocked.');
      } else {
        toast.error('You must follow our Twitter to unlock.');
      }
    } catch (err) {
      toast.error('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
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

      {/* Background 3D */}
      <PlanetBackground />
    </div>
  );
}
