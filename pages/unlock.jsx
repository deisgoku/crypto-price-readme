'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnlockPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!username.trim()) {
      toast.error('Please enter your Twitter username.');
      return;
    }

    setLoading(true);
    try {
      const checkRes = await fetch('/api/follow-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const { status } = await checkRes.json();

      if (status === 'already_verified') {
        toast.success(`Welcome back, @${username}! You already unlocked it.`);
      } else if (status === 'newly_verified') {
        await fetch('/api/add-follower', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        toast.success(`Welcome, @${username}! Unlock successful.`);
      } else {
        toast.error("Verification failed. Please make sure you've followed us.");
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-black text-white bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-unlock.webp')" }}
    >
      <div className="absolute inset-0 bg-black/70 z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl glow-border fade-in text-center space-y-6"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-2xl font-bold text-cyan-300"
          >
            Card Readme Unlocker
          </motion.h1>

          <p className="text-sm text-gray-300">
            Please follow our Twitter account, then enter your username below to unlock.
          </p>

          <input
            type="text"
            placeholder="Your Twitter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-white/10 border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400"
          />

          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>

          <blockquote className="text-xs italic text-gray-400">
            “Thank you for supporting this project. You are awesome.”
          </blockquote>
        </motion.div>
      </div>
    </div>
  );
}
