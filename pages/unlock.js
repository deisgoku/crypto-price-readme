import { useState } from "react";
import Lottie from "lottie-react";
import animationData from "@/public/bg-lottie.json"; // Ganti dengan path lottie kamu nanti
import { X } from "lucide-react";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleUnlock = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/add-follower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setStatus(data.status);
        setShowPopup(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center px-4">
      <Lottie animationData={animationData} className="absolute inset-0 z-0 opacity-10" loop autoPlay />

      <div className="relative z-10 bg-[#161b22] p-6 md:p-8 rounded-2xl shadow-lg text-white max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Card Readme Unlocker</h1>
        <p className="text-base text-gray-300 mb-1">Welcome, guys!</p>
        <p className="text-sm text-gray-400 mb-2 flex justify-center items-center gap-1">
          Make sure you’ve followed me on
          <img src="/x-icon.svg" alt="X" className="w-5 h-5 inline-block" />
        </p>
        <a href="https://x.com/Deisgoku" target="_blank" className="text-blue-400 underline text-sm block mb-4">
          Visit: x.com/Deisgoku
        </a>

        <blockquote className="italic text-sm text-gray-400 mb-6">
          "In Web3, showing appreciation isn't just kindness—it's how we grow together. Following each other keeps the connection alive and the contribution flowing."
        </blockquote>

        <label className="text-sm mb-1 block text-left">Enter your Twitter username</label>
        <input
          type="text"
          className="w-full p-2 rounded-lg bg-[#0d1117] border border-gray-600 text-white placeholder-gray-500 mb-4"
          placeholder="e.g. vitalikbuterin"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          onClick={handleUnlock}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 transition font-semibold py-2 rounded-lg text-white flex justify-center items-center"
        >
          {loading ? (
            <span className="flex gap-1 items-center">
              Unlocking
              <span className="animate-pulse">.</span>
              <span className="animate-pulse delay-150">.</span>
              <span className="animate-pulse delay-300">.</span>
            </span>
          ) : (
            "Unlock"
          )}
        </button>

        {showPopup && (
          <div className="absolute top-4 right-4 bg-[#22272e] border border-green-500 text-green-400 px-4 py-3 rounded-lg shadow-lg max-w-xs w-full z-20">
            <div className="flex justify-between items-start">
              <div className="text-sm font-medium">You're Verified! <span className="text-lg">👌</span></div>
              <button onClick={() => setShowPopup(false)}>
                <X className="w-4 h-4 text-green-300" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
