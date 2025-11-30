import React, { useState } from "react";

interface Props {
  list: string[];
  value: string;
  onSelect: (value: string) => void;
}

export default function SearchableDropdown({ list, value, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = list.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Display Selected */}
      <input
        value={value}
        readOnly
        onClick={() => setOpen(!open)}
        placeholder="Select hospital..."
        className="w-full border p-2 rounded cursor-pointer"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute bg-white border rounded w-full mt-1 max-h-40 overflow-y-auto shadow z-50">
          <input
            className="w-full p-2 border-b outline-none"
            placeholder="Type to search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.length === 0 ? (
            <div className="p-2 text-gray-500 text-sm">No results found</div>
          ) : (
            filtered.map((name) => (
              <div
                key={name}
                className="p-2 hover:bg-blue-100 cursor-pointer"
                onClick={() => {
                  onSelect(name);
                  setSearch("");
                  setOpen(false);
                }}
              >
                {name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
