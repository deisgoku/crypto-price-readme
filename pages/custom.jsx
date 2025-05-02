/* styles/global.css atau di _app.css */
.popup-overlay {
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
}
.popup-window {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  pointer-events: auto;
  user-select: none;
}
.popup-header {
  background: #00bfff;
  color: white;
  padding: 8px 12px;
  font-weight: bold;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.popup-close,
.popup-minimize,
.popup-maximize {
  margin-left: 10px;
  cursor: pointer;
  font-weight: bold;
}
