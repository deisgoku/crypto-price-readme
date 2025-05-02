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
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 300));
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

  const startDragging = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging(true);
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            position: "fixed",
            left: minimized ? 10 : dragging ? position.x : "50%",
            top: minimized ? "auto" : dragging ? position.y : "50%",
            bottom: minimized ? 10 : "auto",
            translateX: minimized || dragging ? 0 : "-50%",
            translateY: minimized || dragging ? 0 : "-50%",
            width: minimized ? 250 : maximized ? "100vw" : "100%",
            height: minimized ? "auto" : maximized ? "100vh" : "auto",
            maxWidth: maximized ? "100vw" : "500px",
            padding: minimized ? "0.25rem 0.5rem" : "1.5rem",
            zIndex: 9999,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* content here */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
