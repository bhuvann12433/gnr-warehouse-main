// src/components/InvoicePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, Camera, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchableDropdown from "./SearchableDropdown";

type CartItem = {
  id?: string;
  _id?: string;
  name: string;
  qty: number;
  unitPrice: number;
};

interface InvoicePageProps {
  cart: Record<string, CartItem>;
  updateCart: (id: string, qty: number) => void;
  clearCart: () => void;
  gstPercentage?: number;
}

const hospitalList = [
  "Amulya Nursing Home",
  "Guntur General Hospital",
  "Ramesh Hospitals",
  "Aayush Hospital",
  "NRI General Hospital",
  "Madhu Multi Speciality",
  "Madalavarapu Hospital",
];

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

function numberToWords(num: number) {
  if (num === 0) return "Zero";
  const a = [
    "", "One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
    "Seventeen","Eighteen","Nineteen"
  ];
  const b = ["","", "Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

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
  let remaining = num;
  const crore = Math.floor(remaining / 10000000);
  if (crore) {
    parts.push(threeDigit(crore) + " Crore");
    remaining = remaining % 10000000;
  }
  const lakh = Math.floor(remaining / 100000);
  if (lakh) {
    parts.push(threeDigit(lakh) + " Lakh");
    remaining = remaining % 100000;
  }
  const thousand = Math.floor(remaining / 1000);
  if (thousand) {
    parts.push(threeDigit(thousand) + " Thousand");
    remaining = remaining % 1000;
  }
  if (remaining) {
    parts.push(threeDigit(remaining));
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

  const [invoiceNo] = useState(() => `GTSAL${Date.now().toString().slice(-6)}`);
  const [invoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  const [billTo, setBillTo] = useState("Amulya Nursing Home");
  const [billAddress, setBillAddress] = useState("Guntur Rd, Barampet, NARASARAOPET, Andhra Pradesh, 522601");
  const [shipTo, setShipTo] = useState(billTo);
  const [shipAddress, setShipAddress] = useState(billAddress);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const initialHSN: Record<string, string> = {};
  Object.keys(cart).forEach((k) => (initialHSN[k] = ""));
  const [hsnMap, setHsnMap] = useState<Record<string, string>>(initialHSN);

  useEffect(() => {
    setHsnMap((prev) => {
      const copy = { ...prev };
      Object.keys(cart).forEach((id) => {
        if (!(id in copy)) copy[id] = "";
      });
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
    reader.onload = () => setLogoPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const handleSignatureUpload = (f?: File | null) => {
    if (!f) {
      setSignaturePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSignaturePreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const handlePrint = () => {
    if (!billTo.trim()) {
      if (!confirm("Bill To is empty. Print anyway?")) return;
    }
    window.print();
  };

  // ============================================================
  // ⭐ FINALIZE — SAVE INVOICE + DEDUCT STOCK + CLEAR CART
  // ============================================================
  const handleFinalize = async () => {
    if (!confirm("Finalize invoice and update stock?")) return;

    try {
      // prepare items (ensure we send the actual mongo id)
      const itemsPayload = items.map((it) => ({
        id: it.id || (it as any)._id,
        name: it.name,
        qty: it.qty,
        unitPrice: it.unitPrice,
        amount: it.unitPrice * it.qty,
      }));

      // 1) Save invoice
      const invoiceRes = await fetch(
        "https://gnr-surgicals-backend.onrender.com/api/invoice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNo,
            date: invoiceDate,
            dueDate,
            billTo,
            billAddress,
            shipTo,
            shipAddress,
            items: itemsPayload,
            subtotal,
            gst: gstTotal,
            total: grandTotal,
          }),
        }
      );

      if (!invoiceRes.ok) {
        const err = await invoiceRes.text().catch(() => "Unknown error");
        alert("Invoice save failed: " + err);
        return;
      }

      // 2) Deduct stock for each item
      for (const it of itemsPayload) {
        // PATCH equipment status endpoint
        await fetch(
          `https://gnr-surgicals-backend.onrender.com/api/equipment/${it.id}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "available",
              change: -it.qty,
            }),
          }
        );
      }

      // 3) Clear cart and navigate home
      clearCart();
      alert("Invoice saved and stock updated successfully ✔");
      navigate("/");
    } catch (err) {
      console.error("Finalize error:", err);
      alert("Error finalizing invoice");
    }
  };

  const amountInWords = `${numberToWords(Math.floor(grandTotal))} Rupees${
    grandTotal % 1 ? " and " + Math.round((grandTotal % 1) * 100) + " Paise" : ""
  }`;

  return (
    <div className="p-6">

      {/* Controls */}
      <div className="mb-4 print:hidden">
        <div className="flex items-center gap-3">

          <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded">
            Back
          </button>

          <label className="flex items-center gap-2 px-3 py-1 border rounded cursor-pointer">
            <Camera /> Upload Logo
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)} />
          </label>

          <label className="flex items-center gap-2 px-3 py-1 border rounded cursor-pointer">
            <Camera /> Upload Signature
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => handleSignatureUpload(e.target.files?.[0] || null)} />
          </label>

          <button onClick={handlePrint} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2">
            <Printer /> Print
          </button>

          <button onClick={handleFinalize} className="bg-green-600 text-white px-3 py-1 rounded ml-2">
            Finalize & Clear
          </button>

        </div>
      </div>

      {/* Invoice Layout */}
      <div className="bg-white p-6" style={{ maxWidth: 900, margin: "0 auto", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>

        {/* Header */}
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

        {/* BILL TO / SHIP TO */}
        <div className="grid grid-cols-2 gap-4 mb-4">

          <div className="border rounded p-3">
            <div className="text-xs text-blue-700 font-semibold mb-1">BILL TO</div>

            <SearchableDropdown
              list={hospitalList}
              value={billTo}
              onSelect={(val) => {
                setBillTo(val);
                setShipTo(val);
              }}
            />

            <textarea value={billAddress} onChange={(e) => setBillAddress(e.target.value)} className="w-full text-sm mt-2" />
          </div>

          <div className="border rounded p-3">
            <div className="text-xs text-blue-700 font-semibold mb-1">SHIP TO</div>
            <input value={shipTo} onChange={(e) => setShipTo(e.target.value)} className="w-full border-b mb-2" />
            <textarea value={shipAddress} onChange={(e) => setShipAddress(e.target.value)} className="w-full text-sm" />
          </div>

        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse">
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
                  const keyId = it.id || (it as any)._id || idx;
                  return (
                    <tr key={keyId}>
                      <td className="p-2 text-sm border-b">{idx + 1}</td>
                      <td className="p-2 text-sm border-b">{it.name}</td>
                      <td className="p-2 text-sm border-b">
                        <input
                          value={hsnMap[keyId] || ""}
                          onChange={(e) => setHsnMap(prev => ({ ...prev, [keyId]: e.target.value }))}
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

        {/* Subtotal */}
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

        {/* Amount in words */}
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

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          html, body { background: white; }
        }
      `}</style>

    </div>
  );
}
