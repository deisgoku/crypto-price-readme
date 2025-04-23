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
    <div className="unlock-wrapper">
  {/* Header */}
  <div className="header-section">
    <h1 className="text-2xl font-bold">Welcome</h1>
    <p className="text-sm">Unlocker Card</p>
    <p className="text-xs text-cyan-200 mt-2">
      Please follow our Twitter account and input your username below
    </p>
  </div>

  {/* Card untuk form input + button */}
  <div className="card">
    <div className="form-container">
      <label htmlFor="username" className="text-sm text-left">Twitter Username</label>
      <input
        type="text"
        id="username"
        placeholder="@yourhandle"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleUnlock} disabled={loading}>
        {loading ? "Unlocking..." : "Unlock"}
      </button>
    </div>
  </div>

  {/* Footer */}
  <footer>
    “Thank you for supporting this project. You are awesome.”
  </footer>
</div>
  );
}
