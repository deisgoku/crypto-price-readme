import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Turnstile from "react-turnstile";
import CustomCard from "./custom";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const router = useRouter();
  const ref = router.query.ref;

  useEffect(() => {
    if (ref) {
      if (ref === "github") toast.success("Welcome, GitHub warrior!");
      else if (ref === "twitter") toast.success("Hello, Twitter X friends!");
      else toast.success(`Welcome from ${ref}!`);
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
        setUnlocked(true);
      } else {
        toast.error("Verification failed. Please make sure you've followed us.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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

        {!unlocked ? (
          <>
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

            <div className="form-control">
              <input
                type="text"
                placeholder="e.g. vitalikbutterin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
              />
            </div>

            <div className="form-control">
              <Turnstile
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setToken(token)}
                className="rounded-md scale-90 shadow-sm"
              />
            </div>

            <div className="form-control">
              <button
                onClick={handleUnlock}
                disabled={loading}
                className="button flex items-center justify-center gap-2 transition-all duration-300"
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
          </>
        ) : (
          <CustomCard username={username} />
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeSlide {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </motion.div>
  );
}
