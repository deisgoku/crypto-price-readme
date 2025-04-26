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
    <div className="unlock-wrapper">
      <div className="unlock-card">
        <h1 className="title">Unlock Card Tools</h1>

        <p className="subtitle">
          Follow{" "}
          <a
            href="https://twitter.com/Deisgoku"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            @Deisgoku
          </a>{" "}
          and enter your Twitter username below:
        </p>

        <div className="form-group">
          <input
            type="text"
            placeholder="e.g. vitalikbutterin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
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
            className="button flex items-center justify-center gap-2"
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
          <div className="form-group mt-6 text-center">
            <p className="subtitle">Your README URL:</p>
            <code className="block my-2 p-2 bg-gray-100 rounded break-all text-xs">
              {unlockedUrl}
            </code>
            <div className="flex justify-center gap-4 mt-2">
              <button
                onClick={handleCopyUrl}
                className="button flex items-center gap-2 px-3 py-2"
              >
                <ClipboardCopy className="w-4 h-4" />
                Copy URL
              </button>
              <button
                onClick={handleCopyHtml}
                className="button flex items-center gap-2 px-3 py-2"
              >
                <ClipboardCopy className="w-4 h-4" />
                Copy HTML
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
