import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PreviewPopup({ url, onClose }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // Dragging logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
      setPosition((prev) => ({
        x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 200)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100)),
      }));
    };
    const handleMouseUp = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, dragOffset]);

  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(true);
  };

  // Dynamic style logic
  const getStyle = () => {
    if (maximized) {
      return {
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        padding: "1rem",
      };
    } else if (minimized) {
      return {
        left: 20,
        top: window.innerHeight - 60,
        width: "180px",
        height: "40px",
        padding: "0.25rem 0.5rem",
      };
    } else {
      return {
        left: position.x,
        top: position.y,
        width: "500px",
        height: "auto",
        padding: "1rem",
      };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="popup-overlay fixed top-0 left-0 w-full h-full z-[9998]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="popup-window fixed bg-[#0f172a] text-white rounded-lg shadow-xl z-[9999]"
          onMouseDown={handleMouseDown}
          style={getStyle()}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div
            className="popup-header cursor-move flex justify-between items-center font-semibold border-b pb-1 mb-2"
            onMouseDown={handleMouseDown}
          >
            <span>Card Preview</span>
            <div className="flex gap-2">
              <button className="popup-minimize" onClick={() => { setMinimized(true); setMaximized(false); }}>—</button>
              <button className="popup-maximize" onClick={() => { setMaximized(!maximized); setMinimized(false); }}>▢</button>
              <button className="popup-close" onClick={onClose}>&times;</button>
            </div>
          </div>

          {!minimized && (
            <div style={{ maxHeight: "75vh", overflow: "auto" }}>
              <img src={url} alt="Preview" className="w-full rounded-md" />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
