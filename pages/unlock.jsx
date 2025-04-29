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
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const ref = router.query.ref;

  useEffect(() => {
    if (ref) {
      if (ref === "github") toast.success("Welcome, GitHub warrior!");
      else if (ref === "twitter") toast.success("Hello, Twitter X friends!");
      else toast.success(`Welcome from ${ref}!`);
    }
  }, [ref]);

  // Evaluate password strength for register mode
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

  const handleUnlock = async () => {
    if (!username.trim() || !password.trim()) return toast.error("Please enter username and password.");
    if (username.includes("@")) return toast.error("Don't include '@' in your username.");
    if (!token) return toast.error("Please complete the CAPTCHA first.");

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success(`Welcome, @${username}! Unlock Successful.`);
        setUnlocked(true);
      } else {
        toast.error(data.error || "Username and password wrong.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) return toast.error("Please enter username and password.");
    if (username.includes("@")) return toast.error("Don't include '@' in your username.");
    if (!token) return toast.error("Please complete the CAPTCHA first.");

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success("Registration successful!");
        setIsRegisterMode(false);
        setToken("");
        setPassword("");
      } else {
        toast.error(data.error || "Registration failed.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const renderStrengthBar = () => {
    const colors = { weak: "bg-red-500", medium: "bg-yellow-400", strong: "bg-green-500" };
    const color = colors[passwordStrength] || "";
    return passwordStrength ? (
      <div className="mt-2 w-full">
        <div className="w-full h-2 bg-gray-200 rounded">
          <div className={`${color} h-2 rounded`} style={{ width: "100%" }}></div>
        </div>
        <p className="text-sm mt-1 capitalize text-gray-600">{passwordStrength}</p>
      </div>
    ) : null;
  };

  return (
    <motion.div
      className="unlock-wrapper"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="unlock-card">
        {!unlocked ? (
          <>
            <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
              {isRegisterMode ? "Register" : "Unlock"} Card Tools
            </h1>

            <div className="form-control mb-4">
              <input
                type="text"
                placeholder="e.g. vitalikbutterin"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
              />
            </div>

            <div className="form-control relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
              />
              <div
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
              {isRegisterMode && renderStrengthBar()}
            </div>

            {/* CAPTCHA for both login and register */}
            <div className="form-control mb-4">
              <Turnstile
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setToken(token)}
                key={isRegisterMode ? "register-captcha" : "login-captcha"}
                className="rounded-md scale-90 shadow-sm"
              />
            </div>

            <div className="form-control">
              <button
                onClick={isRegisterMode ? handleRegister : handleUnlock}
                disabled={loading}
                className="button w-full flex items-center justify-center gap-2 transition-all duration-300"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />{isRegisterMode ? "Registering..." : "Unlocking..."}</>
                ) : isRegisterMode ? (
                  "Register"
                ) : (
                  "Unlock"
                )}
              </button>
            </div>

            <p className="text-sm text-center mt-4">
              {isRegisterMode ? "Already have an account?" : "New user?"}{" "}
              <span
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setToken("");
                  setPassword("");
                  setShowPassword(false);
                }}
                className="text-blue-500 underline cursor-pointer"
              >
                {isRegisterMode ? "Unlock here" : "Register here"}
              </span>
            </p>
          </>
        ) : (
          <CustomCard username={username} />
        )}
      </div>
    </motion.div>
  );
}
