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
        toast.success(`You're verified! Welcome back, @${username}.`);
      } else if (status === "newly_verified") {
        toast.success(`You're verified! Welcome aboard, @${username}.`);
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
    <div className="unlock-page">
      <div className="unlock-card">
        <h1 className="text-3xl font-bold mb-4">Unlock Web3 Tools</h1>
        <p className="mb-6 text-sm">
          Follow{" "}
          <a
            href="https://twitter.com/Deisgoku"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline"
          >
            @Deisgoku
          </a>{" "}
          and enter your Twitter username below:
        </p>

        <input
          type="text"
          placeholder="@yourhandle"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="unlock-input mb-4"
        />

        <button
          onClick={handleUnlock}
          disabled={loading}
          className="unlock-button"
        >
          {loading ? (
            <Loader2 className="animate-spin h-5 w-5 mx-auto" />
          ) : (
            "Unlock"
          )}
        </button>
      </div>
    </div>
  );
}
