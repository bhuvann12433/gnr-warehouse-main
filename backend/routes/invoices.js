import express from "express";
import Invoice from "../models/Invoice.js";

const router = express.Router();

// CREATE invoice
router.post("/", async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET last invoices
router.get("/", async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(limit);
  res.json(invoices);
});

export default router;
