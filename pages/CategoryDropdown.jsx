import { useState } from "react";

export default function CategoryDropdown({ categories = [], onSelectCategory }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (categoryId) => {
    onSelectCategory(categoryId);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left w-full">
      <button
        onClick={() => setOpen(!open)}
        className="button w-full flex justify-center items-center px-4 py-2"
      >
        {open ? "Close Categories" : "Select Category"}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-md bg-white shadow-lg border p-2 max-h-60 overflow-y-auto">
          <input
            type="text"
            placeholder="Search category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input mb-2 w-full"
          />

          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => handleSelect(cat.category_id)}
                className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
              >
                {cat.name}
              </button>
            ))
          ) : (
            <p className="text-gray-500 text-sm px-2">No categories found.</p>
          )}
        </div>
      )}
    </div>
  );
}
