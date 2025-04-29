import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Turnstile from "react-turnstile";
import CustomCard from "./custom";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

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
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter username and password.");
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
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.status === "success") {
        toast.success(`Welcome, @${username}! Unlock Successful.`);
        setUnlocked(true);
      } else {
        toast.error(loginData.error || "Login failed. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter username and password.");
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
      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const registerData = await registerRes.json();

      if (registerRes.ok && registerData.status === "success") {
        toast.success("Registration successful! You can now unlock.");
        setIsRegisterMode(false); // Balik ke unlock mode
      } else {
        toast.error(registerData.error || "Registration failed.");
      }
    } catch (error) {
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
              and enter your Twitter username and password below:
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
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <div className="form-control flex flex-col gap-2">
              <button
                onClick={isRegisterMode ? handleRegister : handleUnlock}
                disabled={loading}
                className="button flex items-center justify-center gap-2 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isRegisterMode ? "Registering..." : "Unlocking..."}
                  </>
                ) : (
                  isRegisterMode ? "Register" : "Unlock"
                )}
              </button>

              <button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-sm text-blue-500 underline"
              >
                {isRegisterMode
                  ? "Already have an account? Unlock here"
                  : "New user? Register here"}
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
