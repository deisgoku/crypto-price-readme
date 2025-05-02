import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import Select from "react-select";
import { ClipboardCopy, CheckCircle } from "lucide-react";
import ThemeDropdown from "./ThemeDropdown";
import ModelDropdown from "./ModelDropdown";

export default function CustomCard({ username }) {
  const [model, setModel] = useState("modern");
  const [theme, setTheme] = useState("dark");
  const [coin, setCoin] = useState(5);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

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

    window.history.pushState(null, "", window.location.href);

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = () => {
      window.location.replace("/unlock");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const generateUrl = () => {
    if (!username.trim()) {
      toast.error("Username missing.");
      return;
    }
    const url = `https://crypto-price-on.vercel.app/cards?user=${username}&model=${model}&theme=${theme}&coin=${coin}${selectedCategory ? `&category=${selectedCategory}` : ""}`;
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col gap-4 mt-6"
    >
      <h2 className="subtitle text-xl mb-2">Customize Your Card</h2>

      {/* Model */}
      <div className="form-control">
        <label className="label">Model:</label>
        <ModelDropdown onSelectModel={(name) => setModel(name)} />
      </div>

      {/* Theme */}
      <div className="form-control">
        <label className="label">Theme:</label>
        <ThemeDropdown onSelectTheme={(name) => setTheme(name)} />
      </div>

      {/* Coin */}
      <div className="form-control">
        <label className="label">Coin Amount:</label>
        <input
          type="number"
          min={1}
          value={coin}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || value === "0") {
              setCoin("");
            } else {
              setCoin(parseInt(value, 10));
            }
          }}
          placeholder="Enter Coin Amount"
          className="input border-2 rounded-lg p-2 bg-white text-black"
          style={{ borderColor: "#00bfff" }}
        />
      </div>

      {/* Category */}
      <div className="form-control">
        <label className="label">Category:</label>
        <Select
          options={categories.map((cat) => ({
            value: cat.category_id,
            label: cat.name,
          }))}
          onChange={(selected) => setSelectedCategory(selected?.value || "")}
          placeholder="Select a category..."
          isClearable
          className="react-select-container"
          classNamePrefix="react-select"
          menuPortalTarget={typeof window !== "undefined" ? document.body : null}
          menuPosition="fixed"
          menuPlacement="top"
          styles={{
            control: (base, state) => ({
              ...base,
              borderWidth: 1,
              borderColor: state.isFocused ? "#00bfff" : "#ccc",
              boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 191, 255, 0.3)" : "none",
              borderRadius: "0.5rem",
              backgroundColor: "white",
              color: "black",
              '&:hover': { borderColor: "#00bfff" },
            }),
            menu: (base) => ({
              ...base,
              border: "2px solid #00bfff",
              borderRadius: "0.5rem",
              backgroundColor: "white",
              padding: "0.5rem 0",
              animation: "fadeSlide 0.3s ease",
            }),
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            option: (base, { isFocused, isSelected }) => ({
              ...base,
              backgroundColor: isSelected ? "#00bfff" : isFocused ? "#e0f7ff" : "white",
              color: isSelected ? "white" : "black",
              cursor: "pointer",
              padding: "10px 15px",
            }),
          }}
        />
      </div>

      {/* Generate Button */}
      <div className="form-control">
        <button onClick={generateUrl} className="button flex items-center justify-center gap-2">
          Generate URL
        </button>
      </div>

      {/* Result */}
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
  );
}
