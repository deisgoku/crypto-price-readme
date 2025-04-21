import { useState } from "react";
import { Loader2, X } from "lucide-react";
import Lottie from "lottie-react";
import bgLottie from "../public/bg-lottie.json";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleUnlock = async () => {
    if (!username.trim()) {
      return alert("Please enter your Twitter username first!");
    }

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
      } else {
        alert("Unexpected error occurred. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-950 text-white overflow-hidden px-4">
      <Lottie
        animationData={bgLottie}
        loop
        className="absolute inset-0 w-full h-full opacity-10 z-0"
      />

      <div className="relative z-10 bg-gray-900 bg-opacity-80 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center">Card Readme Unlocker</h1>
        <p className="text-center text-sm mb-4 text-gray-300">Welcome guys,</p>

        <p className="text-center text-sm mb-6 text-gray-400">
          Make sure you’ve followed me on X{" "}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023.svg"
            alt="X Logo"
            className="inline-block h-4 mx-1"
          />
          —{" "}
          <a
            href="https://x.com/Deisgoku"
            className="underline text-blue-400 hover:text-blue-300"
            target="_blank"
          >
            Visit x.com/Deisgoku
          </a>
        </p>

        <label className="block text-sm text-gray-300 mb-1">
          Enter your Twitter username:
        </label>
        <input
          type="text"
          placeholder="e.g. vitalikbuterin"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white mb-4"
        />

        <button
          onClick={handleUnlock}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-md font-semibold flex justify-center items-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Unlocking..." : "Unlock"}
        </button>

        <p className="text-xs text-center text-gray-500 mt-6 italic">
          "In the world of Web3, appreciating others’ work is a way of saying thank you.
          Following helps us stay connected and build together."
        </p>
      </div>

      {showPopup && (
        <div className="absolute top-4 right-4 bg-gray-800 border border-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-start gap-3 z-20 max-w-xs">
          <div>
            <p className="font-semibold text-green-400 text-sm">
              {status === "newly_verified" && "You're Verified!"}
              {status === "already_verified" && "Already Verified!"}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Thanks for connecting, enjoy the tools!
            </p>
          </div>
          <button
            onClick={() => setShowPopup(false)}
            className="text-gray-400 hover:text-white ml-auto"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
