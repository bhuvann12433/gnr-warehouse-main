import React from "react";
import { Equipment } from "../types/Equipment";

interface Props {
  items: Equipment[];
}

const ExhaustedPage: React.FC<Props> = ({ items }) => {
  // ⭐ Filter zero OR negative available stock
  const exhaustedItems = items.filter(
    (item) => Number(item.statusCounts.available) <= 0
  );

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Exhausted Items</h1>

      {exhaustedItems.length === 0 ? (
        <p className="text-gray-500">No exhausted items found.</p>
      ) : (
        <ul className="space-y-3">
          {exhaustedItems.map((item) => (
            <li
              key={item._id}
              className="p-4 border rounded-md bg-red-50 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">{item.category}</p>

                {/* Show available number if it's negative */}
                {Number(item.statusCounts.available) < 0 && (
                  <p className="text-xs text-red-700">
                    Stock level: {item.statusCounts.available}
                  </p>
                )}
              </div>

              <span className="text-red-600 font-bold">OUT OF STOCK</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExhaustedPage;
