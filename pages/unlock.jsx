import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { Loader2, ClipboardCopy, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Turnstile from "react-turnstile";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [unlockedUrl, setUnlockedUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

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
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
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
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 1500);
    } catch {
      toast.error("Failed to copy HTML.");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cube Background (z-0) */}
      <div className="cube absolute inset-0 z-0"></div>

      {/* Particles Background (z-10) */}
      <div className="particles absolute inset-0 z-10">
        {[...Array(10)].map((_, i) => (
          <span key={i}></span>
        ))}
      </div>

      {/* Main Content Unlock (z-20) */}
      <motion.div
        className="unlock-wrapper relative z-20 flex items-center justify-center min-h-screen"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="unlock-card bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-md max-w-md w-full">
          <h1 className="title text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient text-center">
            Unlock Card Tools
          </h1>

          <p className="subtitle mt-4 text-center text-gray-300">
            Follow{" "}
            <a
              href="https://twitter.com/Deisgoku"
              target="_blank"
              rel="noopener noreferrer"
              className="link text-blue-400 underline"
            >
              @Deisgoku
            </a>{" "}
            and enter your Twitter username below:
          </p>

          {/* Input Username */}
          <div className="form-control mt-6">
            <input
              type="text"
              placeholder="e.g. vitalikbutterin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full rounded-md p-2 bg-black/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* CAPTCHA */}
          <div className="form-control mt-4">
            <Turnstile
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setToken(token)}
              className="rounded-md scale-90 shadow-sm"
            />
          </div>

          {/* Unlock Button */}
          <div className="form-control mt-4">
            <button
              onClick={handleUnlock}
              disabled={loading || unlockedUrl !== ""}
              className={`button w-full flex items-center justify-center gap-2 rounded-md p-2 bg-blue-500 hover:bg-blue-600 transition-all ${
                unlockedUrl !== "" ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Unlocking...
                </>
              ) : unlockedUrl !== "" ? (
                <>
                  <span className="text-xl animate-fade">🚫</span>
                  <span> Unlock</span>
                </>
              ) : (
                "Unlock"
              )}
            </button>
          </div>

          {/* Card URL Result */}
          {unlockedUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full flex flex-col items-center mt-6"
            >
              <p className="subtitle mb-2 text-gray-300">Your Card URL:</p>

              <textarea
                value={unlockedUrl}
                readOnly
                rows={3}
                className="textarea w-full rounded-md p-2 bg-black/20 text-white mb-4"
              />

              {/* Copy URL */}
              <motion.button
                onClick={handleCopyUrl}
                whileTap={{ scale: 0.95 }}
                className="button flex items-center gap-2 justify-center w-full px-3 py-2 mb-2 bg-green-500 hover:bg-green-600 rounded-md transition-all"
              >
                {copiedUrl ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span> Copied!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-4 h-4 text-white" />
                    <span> Copy URL</span>
                  </>
                )}
              </motion.button>

              {/* Copy HTML */}
              <motion.button
                onClick={handleCopyHtml}
                whileTap={{ scale: 0.95 }}
                className="button flex items-center gap-2 justify-center w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 rounded-md transition-all"
              >
                {copiedHtml ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span> Copied!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-4 h-4 text-white" />
                    <span> Copy HTML</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
