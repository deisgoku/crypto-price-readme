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

  // Customize state
  const [model, setModel] = useState("modern");
  const [theme, setTheme] = useState("dark");
  const [coin, setCoin] = useState(5);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/categories/list");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        toast.error("Failed to load categories from server.");
      }
    };
    fetchCategories();
  }, []);

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
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateUrl = () => {
    if (!username.trim()) {
      toast.error("Username missing.");
      return;
    }
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

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

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

        {/* STEP 1: UNLOCK */}
        {!unlocked && (
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
        )}

        {/* STEP 2: CUSTOMIZE */}
        {unlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col gap-4 mt-6"
          >
            <h2 className="subtitle text-xl mb-2">Customize Your Card</h2>

            {/* Model */}
            <div className="form-control">
              <label className="label">Model:</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="select">
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="futuristic">Futuristic</option>
              </select>
            </div>

            {/* Theme */}
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

            {/* Coin */}
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

            {/* Category */}
            <div className="form-control relative">
              <label className="label">Category:</label>
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="select flex items-center justify-between w-full"
                >
                  {selectedCategory
                    ? categories.find((c) => c.category_id === selectedCategory)?.name
                    : "-- Select Category --"}
                  {/* Chevron icon DITIADAKAN */}
                </button>

                {showCategoryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700">
                    <input
                      type="text"
                      placeholder="Search category..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="input w-full rounded-t-md"
                    />

                    <div className="max-h-60 overflow-y-auto">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => (
                          <div
                            key={cat.category_id}
                            onClick={() => {
                              setSelectedCategory(cat.category_id);
                              setShowCategoryDropdown(false);
                              setCategorySearch("");
                            }}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            {cat.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">No categories found.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <div className="form-control">
              <button onClick={generateUrl} className="button flex items-center justify-center gap-2">
                Generate URL
              </button>
            </div>

            {/* Result URL */}
            {finalUrl && (
              <div className="form-control">
                <textarea
                  value={finalUrl}
                  readOnly
                  rows={3}
                  className="textarea"
                />

                {/* Copy URL */}
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

                {/* Copy HTML */}
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
