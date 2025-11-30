// backend/routes/invoices.js
import express from "express";
import Invoice from "../models/Invoice.js";
import Equipment from "../models/Equipment.js";

const router = express.Router();

// =====================================================
// ⭐ FINALIZE INVOICE + DEDUCT STOCK
// =====================================================
router.post("/", async (req, res) => {
  try {
    const {
      invoiceNo,
      date,
      dueDate,
      billTo,
      billAddress,
      shipTo,
      shipAddress,
      items,
      subtotal,
      gst,
      total
    } = req.body;

    // 1️⃣ SAVE INVOICE
    const invoice = await Invoice.create({
      invoiceNo,
      date,
      dueDate,
      billTo,
      billAddress,
      shipTo,
      shipAddress,
      items,
      subtotal,
      gst,
      total
    });

    // 2️⃣ DEDUCT STOCK FROM EACH EQUIPMENT ITEM
    for (let it of items) {
      await Equipment.findByIdAndUpdate(
        it.id,
        {
          $inc: {
            quantity: -it.qty,
            "statusCounts.available": -it.qty
          }
        },
        { new: true }
      );
    }

    return res.json({
      success: true,
      message: "Invoice saved & stock updated.",
      invoice
    });

  } catch (err) {
    console.error("INVOICE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// GET last invoices
// =====================================================
router.get("/", async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(limit);
  res.json(invoices);
});

export default router;
