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
        } else {
          toast.success(`Welcome, @${username}! Unlock Successful.`);
          setUnlocked(true);
        }
      } else {
        toast.error(data.error || "Action failed. Please try again.");
      }
    } catch {
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
    weak: { label: "Weak", level: 1, color: "strength-weak" },
    medium: { label: "Medium", level: 2, color: "strength-medium" },
    strong: { label: "Strong", level: 3, color: "strength-strong" },
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
        {/* Title */}
        <h1 className="title text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
          {isRegisterMode ? "Register Account" : "Unlock Card Tools"}
        </h1>

        {/* Main Form */}
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
              and {isRegisterMode ? "create" : "enter"} your Twitter username and password below:
            </p>

            {/* Username */}
            <div className="form-control mt-2">
              <input
                type="text"
                placeholder="e.g. vitalikbutterin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
              />
            </div>

            {/* Password */}
            <div className="pwdcontrol relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="inputpwd pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eye-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Strength Meter */}
            {isRegisterMode && passwordStrength && (
              <div className="password-strength-box">
                <div className="strength-bar-wrapper">
                  <div className={`strength-bar-fill strength-${passwordStrength}`} />
                </div>
                <span className="password-strength-label">{visual.label}</span>
              </div>
            )}

            {/* CAPTCHA */}
            <div className="form-control mt-4">
              <Turnstile
                key={captchaKey}
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setToken(token)}
                className="rounded-md shadow-sm"
              />
            </div>

            {/* Submit + Switch */}
            <div className="form-control flex flex-col gap-2 mt-4">
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
                ) : isRegisterMode ? "Register" : "Unlock"}
              </button>

              <a
                onClick={handleModeSwitch}
                className="link text-sm text-blue-500 underline cursor-pointer text-center"
              >
                {isRegisterMode
                  ? "Already have an account? Unlock here"
                  : "New user? Register here"}
              </a>
            </div>
          </>
        ) : (
          <CustomCard username={username} />
        )}
      </div>
    </motion.div>
  );
}
