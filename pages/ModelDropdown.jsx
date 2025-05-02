import { useEffect, useState } from "react";

export default function ModelDropdown({ onSelectModel }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [models, setModels] = useState([]);

  useEffect(() => {
    fetch("/cards?handler=modelList")
      .then((res) => res.json())
      .then((data) => setModels(data))
      .catch(() => setModels([]));
  }, []);

  const filteredModels = models.filter((model) =>
    model.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (modelKey) => {
    onSelectModel(modelKey);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left w-full">
      <button
        onClick={() => setOpen(!open)}
        className="button w-full flex justify-center items-center px-4 py-2"
      >
        {open ? "Close Models" : "Select Model"}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-md bg-white shadow-lg border p-2 max-h-60 overflow-y-auto">
          <input
            type="text"
            placeholder="Search model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input mb-2 w-full"
          />

          {filteredModels.length > 0 ? (
            filteredModels.map((model) => (
              <button
                key={model.value}
                onClick={() => handleSelect(model.value)}
                className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
              >
                {model.label}
              </button>
            ))
          ) : (
            <p className="text-gray-500 text-sm px-2">No models found.</p>
          )}
        </div>
      )}
    </div>
  );
}
