// pages/custom.jsx

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import Select from "react-select";
import { ClipboardCopy, CheckCircle, Eye } from "lucide-react";
import ThemeDropdown from "./ThemeDropdown";
import ModelDropdown from "./ModelDropdown";
import PreviewPopup from "./preview";

export default function CustomCard({ username }) {
  const [model, setModel] = useState("modern");
  const [theme, setTheme] = useState("dark");
  const [coin, setCoin] = useState(5);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/categories/list");
        const data = await res.json();
        setCategories(data);
      } catch {
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
    if (!username.trim()) return toast.error("Username missing.");
    const url = `https://crypto-price-on.vercel.app/cards?user=${username}&model=${model}&theme=${theme}&coin=${coin}${selectedCategory ? `&category=${selectedCategory}` : ""}`;
    setFinalUrl(url);
  };

  const handleCopy = async (type) => {
    if (!finalUrl) return;
    const text = type === "url" ? finalUrl : `<p align="left">\n  <img src="${finalUrl}" />\n</p>`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type === "url" ? "URL" : "HTML"} copied!`);
      type === "url" ? setCopiedUrl(true) : setCopiedHtml(true);
      setTimeout(() => type === "url" ? setCopiedUrl(false) : setCopiedHtml(false), 1500);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full flex flex-col gap-4 mt-6">
        <h2 className="subtitle text-xl mb-2">Customize Your Card</h2>

        <div className="form-control"><label className="label">Model:</label><ModelDropdown onSelectModel={setModel} /></div>
        <div className="form-control"><label className="label">Theme:</label><ThemeDropdown onSelectTheme={setTheme} /></div>

        <div className="form-control">
          <label className="label">Coin Amount:</label>
          <input
            type="number"
            min={1}
            value={coin}
            onChange={(e) => setCoin(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
            placeholder="Enter Coin Amount"
            className="input border-2 rounded-lg p-2 bg-white text-black"
            style={{ borderColor: "#00bfff" }}
          />
        </div>

        <div className="form-control">
          <label className="label">Category:</label>
          <Select
            options={categories.map((cat) => ({ value: cat.category_id, label: cat.name }))}
            onChange={(selected) => setSelectedCategory(selected?.value || "")}
            placeholder="Select a category..."
            isClearable
            classNamePrefix="react-select"
            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            menuPosition="fixed"
            menuPlacement="top"
            styles={{
              control: (base, state) => ({
                ...base,
                borderWidth: 1,
                borderColor: state.isFocused ? "#00bfff" : "#ccc",
                boxShadow: state.isFocused ? "0 0 0 2px rgba(0,191,255,0.3)" : "none",
                borderRadius: "0.5rem",
                backgroundColor: "white",
                color: "black",
                "&:hover": { borderColor: "#00bfff" },
              }),
              menu: (base) => ({ ...base, border: "2px solid #00bfff", borderRadius: "0.5rem", backgroundColor: "white", padding: "0.5rem 0" }),
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

        <div className="form-control">
          <button onClick={generateUrl} className="button">Generate URL</button>
        </div>

        {finalUrl && (
          <div className="form-control">
            <textarea value={finalUrl} readOnly rows={3} className="textarea" />

            <motion.button onClick={() => setShowPreview(true)} whileTap={{ scale: 0.95 }} className="button flex items-center gap-2 mt-2">
              <Eye className="w-4 h-4 text-blue-400" /><span>Preview</span>
            </motion.button>

            <motion.button onClick={() => handleCopy("url")} whileTap={{ scale: 0.95 }} className="button flex items-center gap-2 mt-2">
              {copiedUrl ? <><CheckCircle className="w-4 h-4 text-green-500" /><span>Copied!</span></> : <><ClipboardCopy className="w-4 h-4" /><span>Copy URL</span></>}
            </motion.button>

            <motion.button onClick={() => handleCopy("html")} whileTap={{ scale: 0.95 }} className="button flex items-center gap-2 mt-2">
              {copiedHtml ? <><CheckCircle className="w-4 h-4 text-green-500" /><span>Copied!</span></> : <><ClipboardCopy className="w-4 h-4" /><span>Copy HTML</span></>}
            </motion.button>
          </div>
        )}
      </motion.div>

      {showPreview && <PreviewPopup url={finalUrl} onClose={() => setShowPreview(false)} />}
    </>
  );
}
