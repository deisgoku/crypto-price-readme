// pages/unlock.js

import { useState } from "react";
import Head from "next/head";

export default function Unlock() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    try {
      await fetch("/api/add-follower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Unlock Card Access</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Unlock Your Card</h1>
          <p className="mb-2">
            Visit my X profile first:{" "}
            <a
              href="https://x.com/Deisgoku"
              target="_blank"
              className="text-blue-400 underline"
            >
              @Deisgoku
            </a>
          </p>
          <p className="mb-6 text-sm">
            Please make sure you already followed{" "}
            <strong>@Deisgoku</strong> on Twitter.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Your Twitter username"
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Unlocking..." : "Unlock"}
              </button>
            </form>
          ) : (
            <div className="bg-green-600 p-4 rounded text-white mt-4">
              Thank you for following! You can now use the card.
            </div>
          )}

          <blockquote className="mt-10 text-sm italic text-gray-400">
            “Appreciation in Web3 creations is essential for staying connected
            and valuing one another.”
          </blockquote>
        </div>
      </div>
    </>
  );
}
