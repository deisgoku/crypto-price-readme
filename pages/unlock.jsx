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
  const [unlocked, setUnlocked] = useState(false);
  const [finalUrl, setFinalUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const [model, setModel] = useState("modern");
  const [theme, setTheme] = useState("dark");
  const [coin, setCoin] = useState(5);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const router = useRouter();
  const ref = router.query.ref;

  useEffect(() => {
    if (ref) {
      const source = {
        github: "GitHub warrior",
        twitter: "Twitter X friends",
      }[ref] || ref;
      toast.success(`Welcome, ${source}!`);
    }
  }, [ref]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/categories/list");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        toast.error("Failed to load categories.");
      }
    };
    fetchCategories();
  }, []);

  const handleUnlock = async () => {
    if (!username.trim()) return toast.error("Please enter your Twitter username.");
    if (username.includes("@")) return toast.error("Don't include '@' in your username.");
    if (!token) return toast.error("Please complete the CAPTCHA first.");

    setLoading(true);
    try {
      const checkRes = await fetch("/api/follow-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, token }),
      });

      if (!checkRes.ok) throw new Error("Follow check failed.");

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
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const generateUrl = () => {
    if (!username.trim()) return toast.error("Username missing.");
    const url = `https://crypto-price-on.vercel.app/card?user=${username}&model=${model}&theme=${theme}&coin=${coin}${selectedCategory ? `&category=${selectedCategory}` : ""}`;
    setFinalUrl(url);
  };

  const handleCopyUrl = async () => {
    if (!finalUrl) return;
    try {
      await navigator.clipboard.writeText(finalUrl);
      toast.success("URL copied!");
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    } catch {
      toast.error("Failed to copy URL.");
    }
  };

  const handleCopyHtml = async () => {
    if (!finalUrl) return;
    const html = `<p align="left">\n  <img src="${finalUrl}" />\n</p>`;
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
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col gap-4 mt-6"
          >
            <h2 className="subtitle text-xl mb-2">Customize Your Card</h2>

            <div className="form-control">
              <label className="label">Model:</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="select">
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="futuristic">Futuristic</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">Theme:</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="select">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="dracula">Dracula</option>
                <option value="tokyonight">Tokyonight</option>
                <option value="ayu">Ayu</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">Coin Amount:</label>
              <input
                type="number"
                min={1}
                value={coin}
                onChange={(e) => setCoin(Number(e.target.value))}
                className="input"
              />
            </div>

            <div className="form-control">
              <label className="label">Category:</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="select">
                <option value="">-- Select Category --</option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option>Loading categories...</option>
                )}
              </select>
            </div>

            <div className="form-control">
              <button onClick={generateUrl} className="button flex items-center justify-center gap-2">
                Generate URL
              </button>
            </div>

            {finalUrl && (
              <div className="form-control">
                <textarea
                  value={finalUrl}
                  readOnly
                  rows={3}
                  className="textarea"
                />

                <motion.button
                  onClick={handleCopyUrl}
                  whileTap={{ scale: 0.95 }}
                  className="button flex items-center gap-2 justify-center px-3 py-2 mt-2"
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

                <motion.button
                  onClick={handleCopyHtml}
                  whileTap={{ scale: 0.95 }}
                  className="button flex items-center gap-2 justify-center px-3 py-2 mt-2"
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
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
