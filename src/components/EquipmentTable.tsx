import React from "react";
import {
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import { Equipment } from "../types/Equipment";

interface EquipmentTableProps {
  equipment: Equipment[];
  onEdit: (item: Equipment) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (
    id: string,
    status: "available" | "in_use" | "maintenance",
    change: number
  ) => void;

  // NEW PROPS FOR CART
  addToCart: (item: Equipment) => void;
  removeFromCart: (id: string) => void;

  loading: boolean;
}

const EquipmentTable: React.FC<EquipmentTableProps> = ({
  equipment,
  onEdit,
  onDelete,
  addToCart,
  removeFromCart,
  loading,
}) => {
  // Format functions
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (statusCounts: Equipment["statusCounts"]) => {
    const total =
      statusCounts.available +
      statusCounts.in_use +
      statusCounts.maintenance;

    const availablePercentage =
      total > 0 ? (statusCounts.available / total) * 100 : 0;

    if (availablePercentage >= 80) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Excellent
        </span>
      );
    } else if (availablePercentage >= 60) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Good
        </span>
      );
    } else if (availablePercentage >= 30) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Low
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Critical
        </span>
      );
    }
  };

  const StatusDisplay: React.FC<{
    item: Equipment;
    status: "available" | "in_use" | "maintenance";
    icon: React.ComponentType<any>;
    colorClass: string;
  }> = ({ item, status, icon: Icon, colorClass }) => {
    const count = item.statusCounts[status];

    return (
      <div className="flex items-center space-x-2">
        <div
          className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium border ${
            colorClass === "green"
              ? "border-green-100 bg-green-50"
              : colorClass === "orange"
              ? "border-orange-100 bg-orange-50"
              : "border-red-100 bg-red-50"
          }`}
        >
          <Icon
            className={`h-4 w-4 mr-2 ${
              colorClass === "green"
                ? "text-green-600"
                : colorClass === "orange"
                ? "text-orange-600"
                : "text-red-600"
            }`}
          />
          <span className="text-sm font-medium text-gray-800">{count}</span>
        </div>
      </div>
    );
  };

  // Loading UI
  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading equipment...</p>
        </div>
      </div>
    );
  }

  // Empty UI
  if (equipment.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6 text-center">
          <p className="text-gray-500">
            No equipment found matching your criteria.
          </p>
        </div>
      </div>
    );
  }

  // MAIN TABLE
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipment Details
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity & Cost
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status Distribution
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Add / Remove
              </th>

              <th className="px-6 py-3"></th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {equipment.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                {/* Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.name}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                        {item.notes}
                      </div>
                    )}
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                </td>

                {/* Quantity + Cost */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div>{formatNumber(item.quantity)} units</div>
                    <div className="text-gray-500">
                      {formatCurrency(item.costPerUnit)} each
                    </div>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(item.totalCost)} total
                    </div>
                  </div>
                </td>

                {/* Status distribution */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    {getStatusBadge(item.statusCounts)}
                    <div className="space-y-2 mt-2">
                      <StatusDisplay
                        item={item}
                        status="available"
                        icon={CheckCircle}
                        colorClass="green"
                      />
                      <StatusDisplay
                        item={item}
                        status="in_use"
                        icon={AlertTriangle}
                        colorClass="orange"
                      />
                      <StatusDisplay
                        item={item}
                        status="maintenance"
                        icon={Wrench}
                        colorClass="red"
                      />
                    </div>
                  </div>
                </td>

                {/* ⭐ ADD / REMOVE CART BUTTONS ⭐ */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">

                    {/* - Remove */}
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="px-4 py-1 bg-red-500 text-white rounded-md text-xl font-bold hover:bg-red-600"
                    >
                      –
                    </button>

                    {/* Qty */}
                    <span className="font-semibold text-lg">
                      {item.statusCounts.available}
                    </span>

                    {/* + Add */}
                    <button
                      onClick={() => addToCart(item)}
                      className="px-4 py-1 bg-green-600 text-white rounded-md text-xl font-bold hover:bg-green-700"
                    >
                      +
                    </button>
                  </div>
                </td>

                {/* Actions (Edit/Delete) */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Edit equipment"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onDelete(item._id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Delete equipment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EquipmentTable;
