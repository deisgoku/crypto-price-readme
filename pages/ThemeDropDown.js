import { useState } from "react";
import { themeNames } from "../lib/settings/model/theme"; // sesuaikan path

export default function ThemeDropdown({ onSelectTheme }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredThemes = themeNames.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (themeName) => {
    onSelectTheme(themeName);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left w-full">
      <button
        onClick={() => setOpen(!open)}
        className="button w-full flex justify-center items-center px-4 py-2"
      >
        {open ? "Close Themes" : "Select Theme"}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-md bg-white shadow-lg border p-2 max-h-60 overflow-y-auto">
          <input
            type="text"
            placeholder="Search theme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input mb-2 w-full"
          />

          {filteredThemes.length > 0 ? (
            filteredThemes.map((name) => (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded capitalize"
              >
                {name}
              </button>
            ))
          ) : (
            <p className="text-gray-500 text-sm px-2">No themes found.</p>
          )}
        </div>
      )}
    </div>
  );
}
