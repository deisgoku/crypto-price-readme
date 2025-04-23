import { useState } from "react";
import { Loader2, X } from "lucide-react";
import Lottie from "lottie-react";
import bgLottie from "../public/bg-lottie.json";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");

  const showToast = (message) => {
    setPopupMsg(message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 4000);
  };

  const handleUnlock = async () => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      return showToast("Please enter your Twitter username first!");
    }

    setLoading(true);
    try {
      // Cek dulu apakah user sudah ada
      const check = await fetch("/api/follow-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const checkData = await check.json();

      if (check.ok && checkData.status === "already_verified") {
        setStatus("already_verified");
        return showToast("Already Verified! Welcome back.");
      }

      // Kalau belum ada, tambahkan user
      const add = await fetch("/api/add-follower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const addData = await add.json();

      if (add.ok && addData.status === "newly_verified") {
        setStatus("newly_verified");
        showToast("You're Verified! Enjoy the tools.");
      } else {
        showToast("Unexpected error occurred.");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unlock-container">
      <Lottie animationData={bgLottie} loop className="unlock-lottie-bg" />

      <div className="unlock-card">
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
        <div className="unlock-popup">
          <div className="flex-1">
            <p className="font-semibold text-green-400 text-sm">{popupMsg}</p>
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
