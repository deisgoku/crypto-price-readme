import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, ClipboardCopy } from "lucide-react";
import Turnstile from "react-turnstile";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [unlockedUrl, setUnlockedUrl] = useState("");

  const handleUnlock = async () => {
    if (!username.trim()) {
      toast.error("Please enter your Twitter username.");
      return;
    }

    if (username.includes("@")) {
      toast.error("Don't include '@' in your username.");
      return;
    }

    if (!token) {
      toast.error("Please complete the CAPTCHA first.");
      return;
    }

    setLoading(true);

    try {
      const checkRes = await fetch("/api/follow-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, token }),
      });

      const { status } = await checkRes.json();

      if (status === "already_verified" || status === "newly_verified") {
        if (status === "newly_verified") {
          await fetch("/api/add-follower", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });
        }

        toast.success(`Welcome, @${username}! Unlock Successful.`);
        const url = `https://crypto-price-on.vercel.app/api/card?user=${username}&model=modern&theme=dark&coin=5&category=layer-1`;
        setUnlockedUrl(url);
      } else {
        toast.error("Verification failed. Please make sure you've followed us.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!unlockedUrl) return;
    try {
      await navigator.clipboard.writeText(unlockedUrl);
      toast.success("URL copied!");
    } catch {
      toast.error("Failed to copy URL.");
    }
  };

  const handleCopyHtml = async () => {
    if (!unlockedUrl) return;
    const html = `<p align="left">\n  <img src="${unlockedUrl}" />\n</p>`;
    try {
      await navigator.clipboard.writeText(html);
      toast.success("HTML snippet copied!");
    } catch {
      toast.error("Failed to copy HTML.");
    }
  };

  return (
    <div className="unlock-wrapper p-4">
      <div className="unlock-card bg-white p-6 rounded-xl shadow-lg max-w-md mx-auto">
        <h1 className="title text-2xl font-bold text-center mb-4">Unlock Card Tools</h1>

        <p className="subtitle text-center text-gray-600 mb-6">
          Follow{" "}
          <a
            href="https://twitter.com/Deisgoku"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            @Deisgoku
          </a>{" "}
          and enter your Twitter username below:
        </p>

        <div className="form-group mb-4">
          <input
            type="text"
            placeholder="e.g. vitalikbutterin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input w-full p-3 rounded-md bg-gray-100 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="form-group flex justify-center my-4">
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token) => setToken(token)}
            className="rounded-md scale-90 shadow-sm"
          />
        </div>

        <div className="form-group">
          <button
            onClick={handleUnlock}
            disabled={loading}
            className="button w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-md flex items-center justify-center gap-2 transition active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Unlocking...
              </>
            ) : (
              "Unlock"
            )}
          </button>
        </div>

        {/* Jika URL sudah didapat */}
        {unlockedUrl && (
          <div className="form-group mt-6 text-center">
            <p className="subtitle text-gray-700 font-semibold mb-2">Your Card URL:</p>

            {/* Kotak putih untuk URL */}
            <div className="bg-gray-100 text-gray-800 text-sm p-4 rounded-md break-words w-full max-w-full overflow-x-auto">
              {unlockedUrl}
            </div>

            {/* Tombol copy dengan jarak */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
              <button
                onClick={handleCopyUrl}
                className="button flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition active:scale-95"
              >
                <ClipboardCopy className="w-5 h-5" />
                Copy URL
              </button>
              <button
                onClick={handleCopyHtml}
                className="button flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition active:scale-95"
              >
                <ClipboardCopy className="w-5 h-5" />
                Copy HTML
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
