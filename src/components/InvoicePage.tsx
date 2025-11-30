// src/components/InvoicePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, Camera, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchableDropdown from "./SearchableDropdown";

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

  const [invoiceNo, setInvoiceNo] = useState(() => `GTSAL${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [dueDate, setDueDate] = useState(() => {
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
      const itemsPayload = items.map((it) => ({
        id: it.id || (it as any)._id,   // ⭐ FIX APPLIED
        name: it.name,
        qty: it.qty,
        unitPrice: it.unitPrice,
        amount: it.unitPrice * it.qty,
      }));

      await fetch("https://gnr-surgicals-backend.onrender.com/api/invoice", {
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
      });

      clearCart();
      navigate("/");

    } catch (err) {
      alert("Error finalizing invoice");
      console.error(err);
    }
  };

  const amountInWords = `${numberToWords(Math.floor(grandTotal))} Rupees${
    grandTotal % 1 ? " and " + Math.round((grandTotal % 1) * 100) + " Paise" : ""
  }`;

  return (
    <div className="p-6">
      {/* Entire UI untouched */}
      {/* … (UI code continues exactly same as your version) */}
    </div>
  );
}
