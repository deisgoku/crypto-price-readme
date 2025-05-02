import { useState, useEffect } from "react";

export default function PreviewPopup({ url, onClose }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
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
  }, [dragging, dragOffset]);

  const handleMouseDown = (e) => {
    setDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  
  const handleMinimize = () => setMinimized(true);
  const handleMaximize = () => {
    setMinimized(false);
    setMaximized(true);
  };

  return (
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
        <div className="popup-header" onMouseDown={handleMouseDown}>
          Card Preview
          <span className="popup-minimize" onClick={() => setMinimized(true)}>—</span>
          <span className="popup-maximize" onClick={() => { setMinimized(false); setMaximized(true); }}>▢</span>
          <span className="popup-close" onClick={onClose}>&times;</span>
        </div>
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          <img src={url} alt="Preview" className="w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
