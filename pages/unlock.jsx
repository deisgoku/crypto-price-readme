// pages/unlock.jsx
import { useState } from "react";
import { Toaster, toast } from "react-hot-toast";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/follow-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (data.status === "already_verified") {
        toast.success("Welcome back, already verified!");
      } else if (data.status === "newly_verified") {
        toast.success("Thank you for the follow! You're now verified.");
      } else {
        toast.error("Follow requirement not met.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative"
      style={{ backgroundImage: "url('/bg-unlock.webp')" }}
    >
      <Toaster position="top-center" />

      <div className="bg-black/60 backdrop-blur-md p-8 rounded-2xl max-w-md w-full text-center shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Card Readme Unlocker</h1>
        <p className="text-white text-sm mb-6">
          Follow us and verify your Twitter username to unlock your crypto card!
        </p>

        <input
          type="text"
          placeholder="Enter your Twitter username"
          className="w-full px-4 py-2 rounded-xl mb-4 outline-none bg-white text-black"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button
          onClick={handleUnlock}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl transition-all disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Unlock"}
        </button>

        <p className="text-xs text-gray-300 mt-6 italic">
          “Thanks for your support. You're powering the future of Web3!”
        </p>
      </div>
    </div>
  );
}
