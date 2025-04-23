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
      const checkRes = await fetch(`/api/follow-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const { status } = await checkRes.json();

      if (status === "already_verified") {
        toast.success(`Welcome back, @${username}! You already unlocked it.`);
      } else if (status === "newly_verified") {
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
    <div className="min-h-screen flex flex-col justify-center items-center text-white px-4 py-8">
      {/* HEADER */}
      <div className="text-center mt-6">
        <h1 className="text-4xl font-bold mb-2">Welcome</h1>
        <h2 className="text-xl font-semibold">Unlocker Card</h2>
      </div>

      {/* FORM BOX */}
      <div className="w-full max-w-md bg-black/70 border border-cyan-500 rounded-xl shadow-2xl p-8 mt-10 backdrop-blur-md">
        <p className="text-sm mb-4">Input your Twitter Username</p>
        <input
          type="text"
          placeholder="@yourusername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-4 rounded-md bg-white/10 border border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400"
        />
        <button
          onClick={handleUnlock}
          disabled={loading}
          className="w-full px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Unlocking..." : "Unlock"}
        </button>
      </div>

      {/* FOOTER */}
      <footer className="text-xs text-gray-400 mt-10 text-center">
        “Thank you for supporting this project. You are awesome.”
      </footer>
    </div>
  );
}
