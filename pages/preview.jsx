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
      if (!dragging || minimized || maximized) return;
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
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
  }, [dragging, dragOffset, minimized, maximized]);

  const handleMouseDown = (e) => {
    if (minimized || maximized) return;
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

  const restore = () => {
    setMinimized(false);
    setMaximized(false);
  };

  return (
    <div className="popup-overlay">
      <AnimatePresence>
        <motion.div
          key="popup"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            position: "fixed",
            left: minimized ? 20 : position.x,
            top: minimized ? "auto" : position.y,
            bottom: minimized ? 20 : "auto",
            translateX: minimized ? 0 : 0,
            translateY: minimized ? 0 : 0,
            width: minimized ? 250 : maximized ? "100vw" : 500,
            height: minimized ? "auto" : maximized ? "100vh" : "auto",
            zIndex: 9999,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="popup-window bg-[#0a192f] text-white shadow-lg rounded-lg overflow-hidden"
          onMouseDown={handleMouseDown}
          style={{ boxSizing: "border-box", padding: minimized ? "0.25rem 0.5rem" : "1rem" }}
        >
          <div
            className="popup-header cursor-move flex justify-between items-center font-semibold mb-2"
            onMouseDown={handleMouseDown}
          >
            <span>Card Preview</span>
            <div className="flex gap-2 text-xl">
              {minimized ? (
                <span onClick={restore} className="cursor-pointer">▢</span>
              ) : (
                <>
                  <span onClick={handleMinimize} className="cursor-pointer">—</span>
                  <span onClick={handleMaximize} className="cursor-pointer">▢</span>
                </>
              )}
              <span onClick={onClose} className="cursor-pointer">&times;</span>
            </div>
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
