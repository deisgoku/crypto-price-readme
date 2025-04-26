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

        toast.success(`Success! Welcome, @${username}`);
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
    try {
      await navigator.clipboard.writeText(unlockedUrl);
      toast.success("URL copied to clipboard!");
    } catch {
      toast.error("Failed to copy URL.");
    }
  };

  const handleCopyHtml = async () => {
    const html = `<p align="left">\n  <img src="${unlockedUrl}" />\n</p>`;
    try {
      await navigator.clipboard.writeText(html);
      toast.success("HTML snippet copied!");
    } catch {
      toast.error("Failed to copy HTML.");
    }
  };

  return (
    <div className="unlock-wrapper flex justify-center items-center min-h-screen px-4 bg-gray-900 text-white">
      <div className="unlock-card max-w-md w-full bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Unlock Card Tools</h1>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Follow{" "}
          <a
            href="https://twitter.com/Deisgoku"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
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
            className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600"
          />
        </div>

        <div className="form-group flex justify-center mb-4">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
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

        {unlockedUrl && (
          <div className="mt-6 text-center">
            <p className="text-green-400 font-semibold mb-2">Your README URL:</p>
            <code className="block bg-gray-700 text-white p-3 rounded-md text-xs break-words mb-4">
              {unlockedUrl}
            </code>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleCopyUrl}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <ClipboardCopy className="w-4 h-4" /> Copy URL
              </button>
              <button
                onClick={handleCopyHtml}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <ClipboardCopy className="w-4 h-4" /> Copy HTML
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
