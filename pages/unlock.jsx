import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { Loader2, ClipboardCopy } from "lucide-react";
import { motion } from "framer-motion";
import Turnstile from "react-turnstile";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [unlockedUrl, setUnlockedUrl] = useState("");

  const router = useRouter();
  const ref = router.query.ref;

  useEffect(() => {
    if (ref === "github") {
      toast.success("Welcome, GitHub warrior!");
    } else if (ref === "twitter") {
      toast.success("Hello, Twitter X friends!");
    } else if (ref) {
      toast.success(`Welcome from ${ref}!`);
    }
  }, [ref]);

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
    <motion.div
      className="flex items-center justify-center min-h-screen p-6"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="bg-black/90 p-8 rounded-2xl max-w-md w-full text-center shadow-lg">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
          Unlock Card Tools
        </h1>

        <p className="text-white mt-4">
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

        <form className="flex flex-col gap-4 w-full max-w-xs mx-auto mt-6">
          <input
            type="text"
            placeholder="e.g. vitalikbutterin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-blue-400 text-black text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300 transition"
          />

          <div className="bg-gray-800 p-2 rounded-md">
            <Turnstile
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setToken(token)}
              className="scale-90"
            />
          </div>

          <button
            type="button"
            onClick={handleUnlock}
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center gap-2"
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
        </form>

        {unlockedUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex flex-col items-center mt-6"
          >
            <p className="text-white mb-2">Your Card URL:</p>

            <textarea
              value={unlockedUrl}
              readOnly
              rows={3}
              className="w-full max-w-xs mx-auto px-4 py-2 rounded-md border border-blue-400 text-black text-sm resize-none focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300 transition"
            />

            <button
              onClick={handleCopyUrl}
              className="w-full max-w-xs mt-3 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center gap-2"
            >
              <ClipboardCopy className="w-4 h-4" />
              Copy URL
            </button>

            <button
              onClick={handleCopyHtml}
              className="w-full max-w-xs mt-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center gap-2"
            >
              <ClipboardCopy className="w-4 h-4" />
              Copy HTML
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
