import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PreviewPopup({ url, onClose }) {
  const popupRef = useRef(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [size, setSize] = useState({ width: 400, height: "auto" });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // Dragging
  useEffect(() => {
    const handleMove = (e) => {
      const clientX = e.touches?.[0]?.clientX ?? e.clientX;
      const clientY = e.touches?.[0]?.clientY ?? e.clientY;
      if (dragging) {
        setPosition({
          x: Math.max(0, Math.min(clientX - dragOffset.x, window.innerWidth - 300)),
          y: Math.max(20, Math.min(clientY - dragOffset.y, window.innerHeight - 100)),
        });
      } else if (resizing && popupRef.current) {
        const rect = popupRef.current.getBoundingClientRect();
        const newWidth = Math.max(300, clientX - rect.left);
        const newHeight = Math.max(200, clientY - rect.top);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const stop = () => {
      setDragging(false);
      setResizing(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", stop);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", stop);
    };
  }, [dragging, dragOffset, resizing]);

  const startDrag = (e) => {
    const isTouch = e.type === "touchstart";
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
    setDragging(true);
    e.stopPropagation();
  };

  const startResize = (e) => {
    setResizing(true);
    e.stopPropagation();
    e.preventDefault();
  };

  const getStyle = () => {
    if (maximized) {
      return {
        left: 0,
        height: "100vh",
        maxWidth: "100vw",
        minWidth: "300px",
        padding: "1rem",
        boxSizing: "border-box",
      };
    } else if (minimized) {
      return {
        left: 20,
        top: window.innerHeight - 60,
        width: "250px",
        height: "40px",
        padding: "0.5rem",
        boxSizing: "border-box",
      };
    } else {
      return {
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        maxWidth: "500px",
        minWidth: "300px",
        padding: "1.5rem",
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
          ref={popupRef}
          className="popup-window fixed bg-[#0f172a] text-white rounded-lg shadow-xl z-[9999]"
          style={getStyle()}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div
            className="popup-header cursor-move flex justify-between items-center font-semibold border-b pb-1 mb-2 select-none"
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            style={{ touchAction: "none" }}
          >
            <span>Card Preview</span>
            <div className="flex gap-2">
              <button className="popup-minimize" onClick={() => { setMinimized(true); setMaximized(false); }}>—</button>
              <button className="popup-maximize" onClick={() => { setMaximized(!maximized); setMinimized(false); }}>▢</button>
              <button className="popup-close" onClick={onClose}>&times;</button>
            </div>
          </div>

          {!minimized && (
            <div style={{ maxHeight: "70vh", overflow: "auto" }}>
              <img src={url} alt="Preview" className="w-full rounded-md" />
            </div>
          )}

          {!maximized && !minimized && (
            <div
              className="resize-handle absolute bottom-1 right-1 w-4 h-4 cursor-se-resize z-[9999]"
              onMouseDown={startResize}
              onTouchStart={startResize}
              style={{ touchAction: "none" }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
