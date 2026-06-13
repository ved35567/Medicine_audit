import mongoose from "mongoose";

const stockItemSchema = new mongoose.Schema(
  {
    drug_code: {
      type: String,
      required: true,
      trim: true,
    },

    application_stock: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const stockImportSchema = new mongoose.Schema(
  {
    audit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineAudit",
      required: true,
      unique: true,
    },

    medicines: {
      type: [stockItemSchema],
      required: true,
      validate: {
        validator: (items) =>
          Array.isArray(items) && items.length > 0,
        message:
          "At least one medicine item is required.",
      },
    },
  },
  { timestamps: true }
);

const StockImport =
  mongoose.models.StockImport ||
  mongoose.model("StockImport", stockImportSchema);

export default StockImport;