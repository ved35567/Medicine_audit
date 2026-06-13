import mongoose from "mongoose";

const medicineAuditItemSchema = new mongoose.Schema(
  {
    drug_code: {
      type: String,
      required: true,
      trim: true,
    },
    medicine_name: {
      type: String,
      required: true,
      trim: true,
    },
    physical_quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const medicineAuditSchema = new mongoose.Schema(
  {
    audit_date: {
      type: Date,
      required: true,
    },
    mmu_name: {
      type: String,
      required: true,
      trim: true,
    },
    auditor_name:{
      type: String,
      required: true,
      trim: true,
    }
,
    town: {
      type: String,
      required: true,
      trim: true,
    },

    vehicle_reg_number: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    apm_name: {
      type: String,
      required: true,
      trim: true,
    },
    nodal_officer_name: {
      type: String,
      required: true,
      trim: true,
    },
    mmu_doctor_name: {
      type: String,
      required: true,
      trim: true,
    },
    mmu_pharmacist_name: {
      type: String,
      required: true,
      trim: true,
    },
    vendor_name: {
      type: String,
      required: true,
      trim: true,
    },
    phase: {
      type: String,
      required: true,
      trim: true,
    },
    

    medicines: {
      type: [medicineAuditItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one medicine item is required.",
      },
    },
  },
  { timestamps: true }
);

const MedicineAudit =
  mongoose.models.MedicineAudit ||
  mongoose.model("MedicineAudit", medicineAuditSchema);

export default MedicineAudit;
