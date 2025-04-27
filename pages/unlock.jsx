
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { Loader2, ClipboardCopy } from "lucide-react";
import { motion } from "framer-motion"; // <-- Motion ada
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

        <div className="form-group mx-auto w-full mx-w-[300px] flex items-center justify-center">
          <input
            type="text"
            placeholder="e.g. vitalikbutterin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input w-full"
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md mx-auto mt-6 text-center"
          >
            <p className="subtitle mb-2">Your Card URL:</p>

            <textarea
              value={unlockedUrl}
              readOnly
              rows={3}
              className="w-full max-w-md p-2 bg-white text-black rounded-md border-[#00ccff] text-xs break-words overflow-x-auto resize-none text-center"
            />

            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={handleCopyUrl}
                className="button flex items-center gap-2 px-3 py-2 hover:bg-gray-200"
              >
                <ClipboardCopy className="w-4 h-4" />
                Copy URL
              </button>

              <button
                onClick={handleCopyHtml}
                className="button flex mt-4 items-center gap-4 px-3 py-2 hover:bg-gray-200"
              >
                <ClipboardCopy className="w-4 h-4" />
                Copy HTML
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
