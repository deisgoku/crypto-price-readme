'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function UnlockPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
      return toast.error('Enter a valid Twitter username.');
    }

    if (username.toLowerCase() === 'asu') {
      return toast('Easter egg found. Stay classy.', { icon: '🥚' });
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/follow-check?username=${username}`);
      const data = await res.json();

      if (data.success) {
        toast.success('Unlocked successfully!');
      } else {
        toast.error('Follow first, then try again.');
      }
    } catch (err) {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/bg-unlock.webp')" }}
    >
      <div className="max-w-md w-full glass-box p-6 text-white">
        <motion.h1
          className="text-3xl font-bold mb-4 text-center text-glow"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Card Readme Unlocker
        </motion.h1>

        <p className="text-center mb-6 text-sm text-gray-300">
          Please follow our Twitter account, then enter your username below to unlock.
        </p>

        <div className="flex gap-2 items-center mb-4">
          <input
            className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            type="text"
            placeholder="Twitter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-md font-semibold text-sm"
            onClick={handleUnlock}
            disabled={loading}
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>

        <p className="text-xs text-center italic text-gray-400">
          “Thank you for supporting this project. You are awesome.”
        </p>
      </div>
    </div>
  );
}
