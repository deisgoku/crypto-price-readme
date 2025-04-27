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
    <motion.div
      className="unlock-wrapper"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="unlock-card">
        <h1 className="title text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
          Unlock Card Tools
        </h1>

        <p className="subtitle mt-4">
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

        {/* INPUT USERNAME */}
        <div className="form-control">
          <input
            type="text"
            placeholder="e.g. vitalikbutterin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
          />
        </div>

        {/* CAPTCHA */}
        <div className="form-control">
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token) => setToken(token)}
            className="rounded-md scale-90 shadow-sm"
          />
        </div>

        {/* BUTTON UNLOCK */}
        <div className="form-control">
          <button
            onClick={handleUnlock}
            disabled={loading || unlockedUrl !== ""}
            className={`button flex items-center justify-center gap-2 transition-all duration-300 ${unlockedUrl !== "" ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Unlocking...
              </>
            ) : unlockedUrl !== "" ? (
              <>
                <span className="text-xl animate-fade">🚫</span>
                <span>Unlock</span>
              </>
            ) : (
              "Unlock"
            )}
          </button>
        </div>

        {/* CARD URL RESULT */}
        {unlockedUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex flex-col items-center mt-6"
          >
            <p className="subtitle mb-2">Your Card URL:</p>

            <div className="form-control">
              <textarea
                value={unlockedUrl}
                readOnly
                rows={3}
                className="textarea"
              />

              {/* BUTTON COPY URL */}
              <motion.button
                onClick={handleCopyUrl}
                whileTap={{ scale: 0.95 }}
                className="button flex items-center gap-2 justify-center px-3 py-2"
              >
                {copiedUrl ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-4 h-4" />
                    <span>Copy URL</span>
                  </>
                )}
              </motion.button>

              {/* BUTTON COPY HTML */}
              <motion.button
                onClick={handleCopyHtml}
                whileTap={{ scale: 0.95 }}
                className="button flex items-center gap-2 justify-center px-3 py-2"
              >
                {copiedHtml ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-4 h-4" />
                    <span>Copy HTML</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
