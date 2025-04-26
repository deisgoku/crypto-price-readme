"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

export default function UnlockPage() {
  const [username, setUsername] = useState("");

  const handleUnlock = () => {
    if (!username.trim()) {
      toast.error("Please enter your Twitter username.");
      return;
    }

    if (username.includes("@")) {
      toast.error("Don't include '@' in your username.");
      return;
    }

    toast.success(`Welcome, @${username}! Unlock successful.`);
    // Lanjut ke API logic di sini
  };

  return (
    <div className="unlock-wrapper">
      
      <h1 className="title text-3xl font-bold mb-6">Unlock Web3 Tools</h1>

      {/* Card */}
      <div className="unlock-card">
        <p className="subtitle text-sm mb-4">
          Follow{" "}
          <a
            href="https://twitter.com/Deisgoku"
            target="_blank"
            rel="noopener noreferrer"
            className="link text-cyan-300 underline hover:text-cyan-400"
          >
            @Deisgoku
          </a>{" "}
          on Twitter and enter your username below:
        </p>

        <input
          type="text"
          placeholder="yourhandle"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
        />

        <button onClick={handleUnlock} className="button mt-4">
          Unlock
        </button>
      </div>
    </div>
  );
}
