import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PreviewPopup({ url, onClose }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [size, setSize] = useState({ width: 400, height: 300 });
  const resizingRef = useRef(false);

  const safeHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const safeWidth = typeof window !== "undefined" ? window.innerWidth : 600;

  const updatePosition = (clientX, clientY) => {
    setPosition({
      x: Math.max(0, Math.min(clientX - dragOffset.x, safeWidth - size.width)),
      y: Math.max(20, Math.min(clientY - dragOffset.y, safeHeight - 100)),
    });
  };

  useEffect(() => {
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      if (resizingRef.current) {
        setSize({
          width: Math.max(300, clientX - position.x),
          height: Math.max(200, clientY - position.y),
        });
      } else if (dragging) {
        updatePosition(clientX, clientY);
      }
    };

    const handleUp = () => {
      setDragging(false);
      resizingRef.current = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragging, dragOffset, position, size]);

  const handleDragStart = (e) => {
    const isTouch = e.touches?.length === 1;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
    setDragging(true);
    e.stopPropagation();
  };

  const getStyle = () => {
    if (maximized) {
      return {
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        padding: "1rem",
        boxSizing: "border-box",
      };
    } else if (minimized) {
      return {
        left: 20,
        top: safeHeight - 60,
        width: 250,
        height: 40,
        padding: "0.5rem",
        boxSizing: "border-box",
      };
    } else {
      return {
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        padding: "1rem",
        boxSizing: "border-box",
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
          style={getStyle()}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div
            className="popup-header cursor-move flex justify-between items-center font-semibold border-b pb-1 mb-2 select-none"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            style={{ touchAction: "none" }}
          >
            <span>Card Preview</span>
            <div className="flex gap-2">
              <button onClick={() => { setMinimized(true); setMaximized(false); }}>—</button>
              <button onClick={() => { setMaximized(!maximized); setMinimized(false); }}>▢</button>
              <button onClick={onClose}>&times;</button>
            </div>
          </div>

          {!minimized && (
            <div style={{ height: "calc(100% - 50px)", overflow: "auto" }}>
              <img src={url} alt="Preview" className="w-full rounded-md" />
            </div>
          )}

          {/* Resize handle */}
          {!minimized && !maximized && (
            <div
              className="absolute bottom-1 right-1 w-4 h-4 bg-white/30 rounded-sm cursor-se-resize z-[10000]"
              onMouseDown={(e) => { e.stopPropagation(); resizingRef.current = true; }}
              onTouchStart={(e) => { e.stopPropagation(); resizingRef.current = true; }}
              style={{ touchAction: "none" }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
