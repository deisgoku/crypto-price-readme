'use client';

import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2, Unlock } from 'lucide-react';

export default function UnlockPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!username) {
      toast.error('Please enter a Twitter username!');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/follow-check?username=${username}`);
      const data = await res.json();

      if (data.following) {
        toast.success('You are verified. Unlocking card...');
      } else {
        toast.error('You must follow @deisgoku to unlock!');
      }
    } catch (error) {
      toast.error('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center text-center container fade-in">
      <Toaster />

      <div className="bg-black bg-opacity-50 p-6 rounded-2xl glow-border shadow-xl max-w-lg w-full">
        <h1 className="text-3xl sm:text-4xl font-semibold mb-3 text-white">Card Readme Unlocker</h1>
        <p className="text-light mb-6">
          Follow <a href="https://twitter.com/deisgoku" className="underline text-cyan-400" target="_blank">@deisgoku</a> on Twitter to unlock access to your crypto card readme.
        </p>

        <input
          type="text"
          placeholder="Enter your Twitter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 rounded-md bg-gray-900 border border-cyan-400 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        <button
          onClick={handleUnlock}
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-md btn btn-primary transition-all"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          {loading ? 'Verifying...' : 'Unlock'}
        </button>

        <p className="text-xs mt-6 text-light italic">
          “Appreciate the effort, honor the process.”
        </p>
      </div>
    </main>
  );
}
