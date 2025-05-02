import { useEffect, useState } from "react";
import Select from "react-select";
import { toast } from "react-hot-toast";

export default function ModelDropdown({ onSelectModel, defaultValue = "modern" }) {
  const [models, setModels] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/cards?handler=modelList"); 
        const data = await res.json();
        if (Array.isArray(data)) {
          const options = data.map((m) => ({ value: m, label: capitalize(m) }));
          setModels(options);
          const defaultOpt = options.find((opt) => opt.value === defaultValue);
          setSelected(defaultOpt || options[0]);
          onSelectModel(defaultOpt?.value || options[0]?.value);
        } else {
          toast.error("Invalid model list.");
        }
      } catch (err) {
        toast.error("Failed to fetch model list.");
      }
    };

    fetchModels();
  }, []);

  const handleChange = (selectedOption) => {
    setSelected(selectedOption);
    onSelectModel(selectedOption.value);
  };

  return (
    <Select
      options={models}
      value={selected}
      onChange={handleChange}
      placeholder="Select a model..."
      className="react-select-container"
      classNamePrefix="react-select"
      menuPortalTarget={typeof window !== "undefined" ? document.body : null}
      menuPosition="fixed"
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
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
