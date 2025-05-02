import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PreviewPopup({ url, onClose }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 200 });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
      setPosition({
        x: Math.min(Math.max(0, e.clientX - dragOffset.x), window.innerWidth - 100),
        y: Math.min(Math.max(0, e.clientY - dragOffset.y), window.innerHeight - 50),
      });
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

  const popupStyles = {
    left: maximized ? 0 : minimized ? 20 : position.x,
    top: maximized ? 0 : minimized ? window.innerHeight - 60 : position.y,
    width: maximized ? "100vw" : minimized ? "200px" : "500px",
    height: maximized ? "100vh" : "auto",
    padding: minimized ? "0.3rem 0.5rem" : "1.5rem",
    zIndex: 9999,
  };

  return (
    <AnimatePresence>
      <motion.div
        className="popup-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="popup-window"
          onMouseDown={handleMouseDown}
          style={popupStyles}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="popup-header" onMouseDown={handleMouseDown}>
            Card Preview
            <button className="popup-minimize" onClick={() => {
              setMinimized(true);
              setMaximized(false);
            }}>—</button>
            <button className="popup-maximize" onClick={() => {
              setMinimized(false);
              setMaximized(!maximized);
            }}>▢</button>
            <button className="popup-close" onClick={onClose}>&times;</button>
          </div>

          {!minimized && (
            <div style={{ maxHeight: "70vh", overflow: "auto" }}>
              <img src={url} alt="Preview" className="w-full rounded-md" />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
