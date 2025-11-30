import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true },
    date: { type: String, required: true },
    dueDate: { type: String, required: true },

    billTo: String,
    billAddress: String,
    shipTo: String,
    shipAddress: String,

    items: [
      {
        id: String,
        name: String,
        qty: Number,
        unitPrice: Number,
        amount: Number
      }
    ],

    subtotal: Number,
    gst: Number,
    total: Number
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", InvoiceSchema);
