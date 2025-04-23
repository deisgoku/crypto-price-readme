"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!username.trim()) {
      toast.error("❗Masukin username Twitter dulu, bro.");
      return;
    }

    if (username.includes("@")) {
      toast("Cukup masukin nama aja ya, tanpa @", {
        icon: "⚠️",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }

    // Easter egg
    if (username.toLowerCase() === "deisgoku") {
      toast.success("Wah, sang founder masuk nih! Silakan langsung lewat aja, bro!");
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
        toast.success(`✅ Welcome back, @${username}! Kamu udah unlock sebelumnya.`);
      } else if (status === "newly_verified") {
        await fetch(`/api/add-follower`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        toast.success(`✨ Sip! @${username}, unlock sukses bro!`);
      } else {
        toast.error("Gagal verifikasi. Pastikan kamu udah follow ya!");
      }
    } catch (err) {
      toast.error("Ada error nih. Coba ulang lagi ya.");
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
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl glow-border text-center space-y-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-cyan-300 font-orbitron">
            Card Readme Unlocker
          </h1>
          <p className="text-sm text-gray-300">
            Follow dulu Twitter kita, abis itu masukin username kamu di bawah ya.
          </p>

          <input
            type="text"
            placeholder="Username Twitter kamu"
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
            {loading ? "Unlocking..." : "Unlock"}
          </button>

          <blockquote className="text-xs italic text-gray-400">
            “Thank you for supporting this project. You are awesome.”
          </blockquote>
        </div>
      </div>
    </div>
  );
}
