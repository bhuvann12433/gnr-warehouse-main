import React from "react";
import { EquipmentStats } from "../types/Equipment";
import { formatCurrencyINR } from "../utils/formatters";

interface Props {
  stats: EquipmentStats;
}

const CategoryOverview: React.FC<Props> = ({ stats }) => {
  return (
    <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 border">
      <p className="text-lg font-medium mb-4">Category Overview</p>

      {Object.entries(stats.categoryTotals).map(([category, totals]: any) => (
        <div
          key={category}
          className="flex justify-between border-b last:border-b-0 py-2 text-sm"
        >
          <span>
            {category} ({totals.count} types, {totals.units} units)
          </span>

          <span className="font-semibold">
            {formatCurrencyINR(totals.cost)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CategoryOverview;
