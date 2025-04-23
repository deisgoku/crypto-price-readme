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
      const res = await fetch(`/api/follow-check?username=${username}`);
      const { isFollowing } = await res.json();

      if (isFollowing) {
        await fetch(`/api/add-follower?username=${username}`);
        toast.success("Verified! Unlock successful.");
      } else {
        toast.error("Follow first before unlocking.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/bg-unlock.webp')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-70 z-0" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-8 text-white text-center space-y-6">
          <h1 className="text-2xl font-bold">Card Readme Unlocker</h1>
          <p className="text-sm text-gray-200">
            Please follow our Twitter account, then enter your username below to unlock.
          </p>

          <input
            type="text"
            placeholder="Your Twitter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-white/20 border-none focus:ring-2 focus:ring-blue-500 placeholder-white text-white"
          />

          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Unlocking..." : "Unlock"}
          </button>

          <blockquote className="text-xs italic text-gray-300">
            “Thank you for supporting this project. You are awesome.”
          </blockquote>
        </div>
      </div>
    </div>
  );
}
