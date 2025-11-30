import React from "react";
import { formatCurrencyINR } from "../utils/formatters";

interface LatestTransactionsProps {
  recentInvoices: any[];
}

const LatestTransactions: React.FC<LatestTransactionsProps> = ({ recentInvoices }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Latest Transactions</h3>
        <small className="text-sm text-gray-500">Most recent invoices</small>
      </div>

      {recentInvoices.length === 0 ? (
        <div className="text-sm text-gray-500 p-4">
          No recent invoices
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="pb-2">Date</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Txn No</th>
              <th className="pb-2">Party Name</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {recentInvoices.map((inv: any, i: number) => (
              <tr key={inv._id || i} className="border-t">
                <td className="py-2">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                <td className="py-2">Sales Invoice</td>
                <td className="py-2">{inv.invoiceNo}</td>
                <td className="py-2">{inv.billTo}</td>
                <td className="py-2 text-right">
                  {formatCurrencyINR(inv.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LatestTransactions;
