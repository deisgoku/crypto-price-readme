"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!username.trim()) {
      toast.error("Please enter your Twitter username.");
      return;
    }

    setLoading(true);
    try {
      // Check if already followed
      const checkRes = await fetch(`/api/follow-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const { status } = await checkRes.json();

      if (status === "already_verified") {
        toast.success(`Welcome back, @${username}! You already unlocked it.`);
      } else if (status === "newly_verified") {
        // Save to Redis
        await fetch(`/api/add-follower`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        toast.success(`Welcome, @${username}! Unlock successful.`);
      } else {
        toast.error("Verification failed. Please make sure you've followed us.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/bg-unlock.webp')" }}
    >
      <div className="bg-black/60 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl text-white font-semibold mb-4">Card Readme Unlocker</h1>
        <p className="text-white mb-6">
          Please follow our Twitter account, then enter your username below to unlock.
        </p>
        <div className="space-y-6">
          <input
            type="text"
            placeholder="Your Twitter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-white/10 border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400 shadow-lg"
          />
          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Unlocking..." : "Unlock"}
          </button>
        </div>
        <blockquote className="text-xs italic text-gray-400 mt-4">
          “Thank you for supporting this project. You are awesome.”
        </blockquote>
      </div>
    </div>
  );
}
