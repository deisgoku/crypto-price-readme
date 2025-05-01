import Select from "react-select";
import { themes } from "../lib/settings/theme";

const themeOptions = Object.keys(themes).map((key) => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

export default function ThemeDropdown({ onSelectTheme }) {
  return (
    <div className="form-control">
      <label className="label">Theme:</label>
      <Select
        options={themeOptions}
        onChange={(selected) => onSelectTheme(selected?.value)}
        placeholder="Select a theme..."
        isClearable
        className="react-select-container"
        classNamePrefix="react-select"
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        menuPlacement="top"
        styles={{
          control: (base, state) => ({
            ...base,
            borderWidth: 1,
            borderColor: state.isFocused ? "#00bfff" : "#ccc",
            boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 191, 255, 0.3)" : "none",
            borderRadius: "0.5rem",
            backgroundColor: "white",
            color: "black",
            '&:hover': { borderColor: "#00bfff" },
          }),
          menu: (base) => ({
            ...base,
            border: "2px solid #00bfff",
            borderRadius: "0.5rem",
            backgroundColor: "white",
            padding: "0.5rem 0",
            animation: "fadeSlide 0.3s ease",
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          option: (base, { isFocused, isSelected }) => ({
            ...base,
            backgroundColor: isSelected ? "#00bfff" : isFocused ? "#e0f7ff" : "white",
            color: isSelected ? "white" : "black",
            cursor: "pointer",
            padding: "10px 15px",
          }),
        }}
      />
    </div>
  );
}
