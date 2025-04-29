import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(Date.now());
  const [passwordStrength, setPasswordStrength] = useState("");

  const router = useRouter();
  const ref = router.query.ref;

  useEffect(() => {
    if (ref) {
      if (ref === "github") toast.success("Welcome, GitHub warrior!");
      else if (ref === "twitter") toast.success("Welcome, Twitter X friends!");
      else toast.success(`Welcome from ${ref}!`);
    }
  }, [ref]);

  const handleModeSwitch = () => {
    setIsRegisterMode(!isRegisterMode);
    setToken("");
    setCaptchaKey(Date.now());
    setPasswordStrength("");
  };

  const handleSubmit = async (mode) => {
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
    const endpoint = mode === "register" ? "/api/register" : "/api/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        if (mode === "register") {
          toast.success("Registration successful! You can now unlock.");
          setIsRegisterMode(false);
          setCaptchaKey(Date.now());
          setPassword("");
          setToken("");
        } else {
          toast.success(`Welcome, @${username}! Unlock Successful.`);
          setUnlocked(true);
        }
      } else {
        toast.error(data.error || "Action failed. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRegisterMode && password) {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      const mediumRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
      if (strongRegex.test(password)) setPasswordStrength("strong");
      else if (mediumRegex.test(password)) setPasswordStrength("medium");
      else setPasswordStrength("weak");
    } else {
      setPasswordStrength("");
    }
  }, [password, isRegisterMode]);

  const strengthVisual = {
    weak: { label: "Weak", level: 1, color: "bg-red-500" },
    medium: { label: "Medium", level: 2, color: "bg-yellow-400" },
    strong: { label: "Strong", level: 3, color: "bg-green-500" },
  };

  const visual = strengthVisual[passwordStrength] || {};

  return (
    <motion.div
      className="unlock-wrapper"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="unlock-card">
        <h1 className="title text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient text-center">
          {isRegisterMode ? "Register Account" : "Unlock Card Tools"}
        </h1>

        {!unlocked ? (
          <>
            <p className="subtitle mt-4 text-center">
              Follow{" "}
              <a
                href="https://twitter.com/Deisgoku"
                target="_blank"
                rel="noopener noreferrer"
                className="link text-blue-500 underline"
              >
                @Deisgoku
              </a>{" "}
              and {isRegisterMode ? "create" : "enter"} your Twitter username and password below:
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
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="inputpwd w-full px-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-toggle absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isRegisterMode && passwordStrength && (
              <div className="mt-2">
                <p className={`text-sm font-medium ${visual.color}`}>
                  {visual.label}
                </p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className={`h-1.5 flex-1 rounded border border-white/20 transition-all ${
                        i <= visual.level ? visual.color : "bg-white/10"
                      }`}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="form-control">
              <Turnstile
                key={captchaKey}
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setToken(token)}
                className="rounded-md shadow-sm scale-90"
              />
            </div>

            <div className="form-control flex flex-col gap-2">
              <button
                onClick={() => handleSubmit(isRegisterMode ? "register" : "login")}
                disabled={loading}
                className="button flex items-center justify-center gap-2 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isRegisterMode ? "Registering..." : "Unlocking..."}
                  </>
                ) : isRegisterMode ? (
                  "Register"
                ) : (
                  "Unlock"
                )}
              </button>

              <button
                onClick={handleModeSwitch}
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
    </motion.div>
  );
}
