import { motion } from "framer-motion";
import { useEffect } from "react";

export default function PreviewPopup({ imageUrl, popupState, setPopupState, onClose }) {
  const { position, minimized, maximized, dragOffset, dragging, prevSize } = popupState;

  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupState((prev) => ({
      ...prev,
      dragging: true,
      dragOffset: { x: e.clientX - rect.left, y: e.clientY - rect.top },
    }));
  };

  const handleMouseMove = (e) => {
    if (!dragging || minimized || maximized) return;
    setPopupState((prev) => ({
      ...prev,
      position: {
        x: e.clientX - prev.dragOffset.x,
        y: e.clientY - prev.dragOffset.y,
      },
    }));
  };

  const handleMouseUp = () => {
    setPopupState((prev) => ({ ...prev, dragging: false }));
  };

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

  const toggleMaximize = () => {
    setPopupState((prev) => {
      if (!prev.maximized) {
        return {
          ...prev,
          maximized: true,
          minimized: false,
          prevSize: {
            position: prev.position,
            width: prev.width || "500px",
            height: prev.height || "auto",
          },
        };
      } else {
        return {
          ...prev,
          maximized: false,
          minimized: false,
          position: prev.prevSize?.position || { x: 100, y: 100 },
        };
      }
    });
  };

  const handleMinimize = () => {
    setPopupState((prev) => ({
      ...prev,
      minimized: true,
      maximized: false,
      prevSize: {
        position: prev.position,
        width: prev.width || "500px",
        height: prev.height || "auto",
      },
      position: { x: 16, y: window.innerHeight - 64 },
    }));
  };

  const handleRestore = () => {
    setPopupState((prev) => ({
      ...prev,
      minimized: false,
      maximized: false,
      position: prev.prevSize?.position || { x: 100, y: 100 },
    }));
  };

  const dynamicStyle = {
    left: position.x,
    top: position.y,
    width: minimized
      ? "200px"
      : maximized
      ? "100vw"
      : prevSize?.width || "500px",
    height: minimized
      ? "40px"
      : maximized
      ? "100vh"
      : prevSize?.height || "auto",
    padding: "0",
    position: "fixed",
    zIndex: 9999,
    overflow: "hidden",
    borderRadius: "8px",
    background: "#fff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  };

  return (
    <div className="popup-overlay">
      <motion.div
        className="popup-window"
        onMouseDown={handleMouseDown}
        style={dynamicStyle}
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: minimized ? 40 : 0 }}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
      >
        <div
          className="popup-header"
          onMouseDown={handleMouseDown}
          style={{
            height: "40px",
            backgroundColor: "#222",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 0.5rem",
            fontSize: "0.9rem",
            cursor: "move",
          }}
        >
          <span>{minimized ? "Card" : "Card Preview"}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {minimized ? (
              <span style={{ cursor: "pointer" }} onClick={handleRestore}>▴</span>
            ) : (
              <span style={{ cursor: "pointer" }} onClick={handleMinimize}>—</span>
            )}
            <span style={{ cursor: "pointer" }} onClick={toggleMaximize}>▢</span>
            <span style={{ cursor: "pointer" }} onClick={onClose}>&times;</span>
          </div>
        </div>

        {!minimized && (
          <div style={{ padding: "1rem", maxHeight: "70vh", overflow: "auto" }}>
            <img src={imageUrl} alt="Preview" className="w-full rounded-md" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
