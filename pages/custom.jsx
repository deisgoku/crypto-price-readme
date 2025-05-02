import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import Select from "react-select";
import { ClipboardCopy, CheckCircle, Eye } from "lucide-react";
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
  const [showPreview, setShowPreview] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

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

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  const handleMouseDown = (e) => {
    setDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  const generateUrl = () => {
    if (!username.trim()) {
      toast.error("Username missing.");
      return;
    }

    const url = `https://crypto-price-on.vercel.app/cards?user=${username}&model=${model}&theme=${theme}&coin=${coin}${
      selectedCategory ? `&category=${selectedCategory}` : ""
    }`;

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

  const handlePreview = () => {
    if (finalUrl) setShowPreview(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-col gap-4 mt-6"
      >
        <h2 className="subtitle text-xl mb-2">Customize Your Card</h2>

        <div className="form-control">
          <label className="label">Model:</label>
          <ModelDropdown onSelectModel={setModel} />
        </div>

        <div className="form-control">
          <label className="label">Theme:</label>
          <ThemeDropdown onSelectTheme={setTheme} />
        </div>

        <div className="form-control">
          <label className="label">Coin Amount:</label>
          <input
            type="number"
            min={1}
            value={coin}
            onChange={(e) => {
              const value = e.target.value;
              setCoin(value === "" || value === "0" ? "" : parseInt(value, 10));
            }}
            placeholder="Enter Coin Amount"
            className="input border-2 rounded-lg p-2 bg-white text-black"
            style={{ borderColor: "#00bfff" }}
          />
        </div>

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
                "&:hover": { borderColor: "#00bfff" },
              }),
              menu: (base) => ({
                ...base,
                border: "2px solid #00bfff",
                borderRadius: "0.5rem",
                backgroundColor: "white",
                padding: "0.5rem 0",
              }),
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              option: (base, { isFocused, isSelected }) => ({
                ...base,
                backgroundColor: isSelected
                  ? "#00bfff"
                  : isFocused
                  ? "#e0f7ff"
                  : "white",
                color: isSelected ? "white" : "black",
                cursor: "pointer",
                padding: "10px 15px",
              }),
            }}
          />
        </div>

        <div className="form-control">
          <button onClick={generateUrl} className="button flex items-center justify-center gap-2">
            Generate URL
          </button>
        </div>

        {finalUrl && (
          <div className="form-control">
            <textarea value={finalUrl} readOnly rows={3} className="textarea" />

            <motion.button
              onClick={handlePreview}
              whileTap={{ scale: 0.95 }}
              className="button flex items-center gap-2 justify-center px-3 py-2 mt-2"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Preview</span>
            </motion.button>

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

      {showPreview && (
        <div className="popup-overlay">
          <div
            className="popup-window"
            onMouseDown={handleMouseDown}
            style={{
              left: position.x,
              top: position.y,
              width: maximized ? "100vw" : undefined,
              height: maximized ? "100vh" : undefined,
              maxWidth: maximized ? "100vw" : "500px",
              minWidth: minimized ? "250px" : "300px",
              padding: minimized ? "0.5rem" : "1.5rem",
              boxSizing: "border-box",
            }}
          >
            <div className="popup-header flex justify-between items-center mb-2" onMouseDown={handleMouseDown}>
              <span className="font-semibold text-white">Card Preview</span>
              <div className="flex gap-2 text-white text-sm">
                <button onClick={() => setMinimized((v) => !v)} title="Minimize">
                  {minimized ? "▢" : "—"}
                </button>
                <button onClick={() => setMaximized((v) => !v)} title="Maximize">
                  {maximized ? "🗗" : "🗖"}
                </button>
                <button onClick={() => setShowPreview(false)} title="Close">
                  &times;
                </button>
              </div>
            </div>
            {!minimized && (
              <div style={{ maxHeight: "70vh", overflow: "auto" }}>
                <img src={finalUrl} alt="Preview" className="w-full rounded-md" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
