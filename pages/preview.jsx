import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PreviewPopup({ url, onClose }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 250));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100));
      setPosition({ x: newX, y: newY });
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
    setDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMinimize = () => {
    setMinimized(true);
    setMaximized(false);
  };

  const handleMaximize = () => {
    setMinimized(false);
    setMaximized(true);
  };

  return (
    <div className="popup-overlay">
      <AnimatePresence>
        <motion.div
          className="popup-window"
          onMouseDown={handleMouseDown}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            left: minimized ? 10 : position.x,
            top: minimized ? 'auto' : position.y,
            bottom: minimized ? 10 : 'auto',
            position: 'fixed',
            width: minimized ? 250 : (maximized ? "100vw" : undefined),
            height: minimized ? "auto" : (maximized ? "100vh" : undefined),
            maxWidth: maximized ? "100vw" : "500px",
            padding: minimized ? "0.25rem 0.5rem" : "1.5rem",
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ 
            duration: 0.4,
            ease: "easeInOut",
            type: "spring",
            damping: 20,
            stiffness: 150,
          }}
        >
          <div className="popup-header" onMouseDown={handleMouseDown}>
            Card Preview
            <span className="popup-minimize" onClick={handleMinimize}>—</span>
            <span className="popup-maximize" onClick={handleMaximize}>▢</span>
            <span className="popup-close" onClick={onClose}>&times;</span>
          </div>

          {!minimized && (
            <div style={{ maxHeight: "70vh", overflow: "auto" }}>
              <img src={url} alt="Preview" className="w-full rounded-md" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
