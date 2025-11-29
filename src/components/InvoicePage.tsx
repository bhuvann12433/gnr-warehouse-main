// src/components/InvoicePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, Camera, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type CartItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
};

interface InvoicePageProps {
  cart: Record<string, CartItem>;
  updateCart: (id: string, qty: number) => void;
  clearCart: () => void;
  gstPercentage?: number; // total GST percent (default 5)
}

const defaultBankDetails = {
  name: "GNR SURGICALS",
  ifsc: "HDFC0001034",
  account: "50200021977447",
  bank: "HDFC Bank, NARSARAOPETA, ANDHRA PRADESH",
};

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(n || 0);
}

/* Convert number to words - supports up to crores. Indian grouping. */
function numberToWords(num: number) {
  if (num === 0) return "Zero";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function twoDigit(n: number) {
    if (n < 20) return a[n];
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return b[tens] + (ones ? " " + a[ones] : "");
  }

  function threeDigit(n: number) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return (hundred ? a[hundred] + " Hundred" + (rest ? " " : "") : "") + (rest ? twoDigit(rest) : "");
  }

  const parts: string[] = [];
  const crore = Math.floor(num / 10000000);
  if (crore) {
    parts.push(threeDigit(crore) + " Crore");
    num = num % 10000000;
  }
  const lakh = Math.floor(num / 100000);
  if (lakh) {
    parts.push(threeDigit(lakh) + " Lakh");
    num = num % 100000;
  }
  const thousand = Math.floor(num / 1000);
  if (thousand) {
    parts.push(threeDigit(thousand) + " Thousand");
    num = num % 1000;
  }
  if (num) {
    parts.push(threeDigit(num));
  }
  return parts.join(" ");
}

export default function InvoicePage({
  cart,
  updateCart,
  clearCart,
  gstPercentage = 5,
}: InvoicePageProps) {
  const navigate = useNavigate();

  // Invoice metadata
  const [invoiceNo, setInvoiceNo] = useState(() => `GTSAL${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  // Hospital / ship details
  const [billTo, setBillTo] = useState("AMULYA NURSING HOME");
  const [billAddress, setBillAddress] = useState("Guntur Rd, Barampet, NARASARAOPET, Andhra Pradesh, 522601");
  const [shipTo, setShipTo] = useState(billTo);
  const [shipAddress, setShipAddress] = useState(billAddress);

  // Upload logo & signature
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  // HSN codes map and editable per-item data
  const initialHSN: Record<string, string> = {};
  Object.keys(cart).forEach((k) => {
    initialHSN[k] = ""; // user can add
  });
  const [hsnMap, setHsnMap] = useState<Record<string, string>>(initialHSN);

  // Regenerate hsnMap when cart changes (preserve existing entries)
  useEffect(() => {
    setHsnMap((prev) => {
      const copy = { ...prev };
      Object.keys(cart).forEach((id) => {
        if (!(id in copy)) copy[id] = "";
      });
      // remove keys not in cart
      Object.keys(copy).forEach((k) => {
        if (!cart[k]) delete copy[k];
      });
      return copy;
    });
  }, [cart]);

  const items = useMemo(() => Object.values(cart), [cart]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (it.unitPrice || 0) * (it.qty || 0), 0),
    [items]
  );

  const gstTotal = (subtotal * gstPercentage) / 100;
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;
  const grandTotal = subtotal + gstTotal;

  const handleLogoUpload = (f?: File | null) => {
    if (!f) {
      setLogoPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(String(reader.result));
    };
    reader.readAsDataURL(f);
  };

  const handleSignatureUpload = (f?: File | null) => {
    if (!f) {
      setSignaturePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSignaturePreview(String(reader.result));
    };
    reader.readAsDataURL(f);
  };

  const handlePrint = () => {
    // Minimal validation
    if (!billTo.trim()) {
      if (!confirm("Bill To is empty. Print anyway?")) return;
    }
    window.print();
  };

  const handleFinalize = () => {
    // Optionally post invoice to server here
    if (confirm("Finalize invoice and clear cart?")) {
      // You might want to send invoice object to server here
      clearCart();
      navigate("/");
    }
  };

  const amountInWords = `${numberToWords(Math.floor(grandTotal))} Rupees${grandTotal % 1 ? " and " + Math.round((grandTotal % 1) * 100) + " Paise" : ""}`;

  // small helpers
  const onHSNChange = (id: string, value: string) => {
    setHsnMap((prev) => ({ ...prev, [id]: value }));
  };

  // print styles: hide controls
  return (
    <div className="p-6">
      {/* Controls - hidden in print */}
      <div className="mb-4 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded">Back</button>

          <label className="flex items-center gap-2 px-3 py-1 border rounded cursor-pointer">
            <Camera /> Upload Logo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
            />
          </label>

          <label className="flex items-center gap-2 px-3 py-1 border rounded cursor-pointer">
            <Camera /> Upload Signature
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSignatureUpload(e.target.files?.[0] || null)}
            />
          </label>

          <button onClick={handlePrint} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2">
            <Printer /> Print
          </button>

          <button onClick={handleFinalize} className="bg-green-600 text-white px-3 py-1 rounded ml-2">
            Finalize & Clear
          </button>
        </div>
      </div>

      {/* Invoice layout */}
      <div className="bg-white p-6" style={{ maxWidth: 900, margin: "0 auto", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
        {/* Header: left company, right invoice details */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4 items-start">
            <div style={{ width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #eee" }}>
              {logoPreview ? (
                <img src={logoPreview} alt="logo" style={{ maxWidth: "100%", maxHeight: "100%" }} />
              ) : (
                <div className="text-xs text-gray-500 text-center px-2">GNR SURGICALS Logo</div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-blue-700">GNR SURGICALS</h2>
              <div className="text-sm text-gray-700 leading-tight">
                10-4-70 ANNAPURANAMMA <br />
                HOSPITAL LINE PALANADU ROAD, <br />
                NARASARAOPET, Andhra Pradesh, 522601<br />
                GSTIN : 37BDBPG4519D1ZY<br />
                Mobile : 9704063929<br />
                Email : gnrsurgicals@gmail.com
              </div>
            </div>
          </div>

          <div style={{ minWidth: 260, textAlign: "right" }}>
            <div className="inline-block bg-gray-100 px-3 py-2 rounded mb-2 text-xs text-gray-700">TAX INVOICE</div>

            <div className="text-sm text-gray-700">
              <div className="flex justify-between"><span>Invoice No.</span><strong>{invoiceNo}</strong></div>
              <div className="flex justify-between"><span>Invoice Date</span><strong>{invoiceDate}</strong></div>
              <div className="flex justify-between"><span>Due Date</span><strong>{dueDate}</strong></div>
            </div>
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border rounded p-3">
            <div className="text-xs text-blue-700 font-semibold mb-1">BILL TO</div>
            <input value={billTo} onChange={(e) => setBillTo(e.target.value)} className="w-full border-b mb-2" />
            <textarea value={billAddress} onChange={(e) => setBillAddress(e.target.value)} className="w-full text-sm" />
          </div>

          <div className="border rounded p-3">
            <div className="text-xs text-blue-700 font-semibold mb-1">SHIP TO</div>
            <input value={shipTo} onChange={(e) => setShipTo(e.target.value)} className="w-full border-b mb-2" />
            <textarea value={shipAddress} onChange={(e) => setShipAddress(e.target.value)} className="w-full text-sm" />
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: "#e6f0fb" }}>
                <th className="p-2 text-left text-sm border-b">S.NO.</th>
                <th className="p-2 text-left text-sm border-b">ITEMS</th>
                <th className="p-2 text-left text-sm border-b">HSN</th>
                <th className="p-2 text-right text-sm border-b">QTY</th>
                <th className="p-2 text-right text-sm border-b">RATE</th>
                <th className="p-2 text-right text-sm border-b">TAX</th>
                <th className="p-2 text-right text-sm border-b">AMOUNT</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">Cart is empty</td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const lineTaxable = (it.unitPrice || 0) * (it.qty || 0);
                  const lineTax = (lineTaxable * gstPercentage) / 100;
                  return (
                    <tr key={it.id}>
                      <td className="p-2 text-sm border-b">{idx + 1}</td>
                      <td className="p-2 text-sm border-b">{it.name}</td>
                      <td className="p-2 text-sm border-b">
                        <input
                          value={hsnMap[it.id] || ""}
                          onChange={(e) => onHSNChange(it.id, e.target.value)}
                          placeholder="HSN"
                          className="border-b text-sm"
                        />
                      </td>
                      <td className="p-2 text-sm border-b text-right">{it.qty}</td>
                      <td className="p-2 text-sm border-b text-right">{formatINR(it.unitPrice)}</td>
                      <td className="p-2 text-sm border-b text-right">{formatINR(lineTax)}</td>
                      <td className="p-2 text-sm border-b text-right">{formatINR(lineTaxable + lineTax)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Subtotal and GST split */}
        <div className="flex justify-between items-start gap-6">
          <div style={{ width: "55%" }}>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <h4 className="font-semibold mb-2">TERMS AND CONDITIONS</h4>
              <p className="text-sm">BED HEAD panel powder coating purpose</p>

              <div className="mt-4 text-sm">
                <h4 className="font-semibold">BANK DETAILS</h4>
                <div>Name: {defaultBankDetails.name}</div>
                <div>IFSC Code: {defaultBankDetails.ifsc}</div>
                <div>Account No: {defaultBankDetails.account}</div>
                <div>Bank: {defaultBankDetails.bank}</div>
              </div>
            </div>
          </div>

          <div style={{ width: "45%" }}>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1">Taxable Amount</td>
                  <td className="text-right">{formatINR(subtotal)}</td>
                </tr>
                <tr>
                  <td className="py-1">CGST @ {gstPercentage / 2}%</td>
                  <td className="text-right">{formatINR(cgst)}</td>
                </tr>
                <tr>
                  <td className="py-1">SGST @ {gstPercentage / 2}%</td>
                  <td className="text-right">{formatINR(sgst)}</td>
                </tr>
                <tr style={{ borderTop: "1px solid #ddd" }}>
                  <td className="py-2 font-bold">Total Amount</td>
                  <td className="text-right font-bold">{formatINR(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Amount in words and signature */}
        <div className="flex justify-between items-end mt-6">
          <div>
            <div className="text-sm font-semibold mb-1">Amount (in words)</div>
            <div className="text-sm">{amountInWords}</div>
          </div>

          <div className="text-right">
            <div className="text-sm mb-3">Authorised Signature for GNR SURGICALS</div>
            {signaturePreview ? (
              <img src={signaturePreview} style={{ width: 140, height: 80, objectFit: "contain" }} alt="signature" />
            ) : (
              <div style={{ width: 140, height: 80, border: "1px dashed #ddd" }} />
            )}
          </div>
        </div>
      </div>

      {/* Print-only small note */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          /* Ensure invoice prints with white background */
          html, body { background: white; }
        }
      `}</style>
    </div>
  );
}
