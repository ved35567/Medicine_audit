import mongoose from "mongoose";
import { NextResponse } from "next/server";
import MedicineAudit from "@/models/MedicineAudit";
import { isUpdateAdminAuthenticated } from "@/lib/update-admin-auth";

async function connectDatabase() {
  if (!mongoose.connections[0].readyState) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

const serializeAudit = (audit) => ({
  ...audit,
  _id: String(audit._id),
  audit_date: audit.audit_date ? new Date(audit.audit_date).toISOString() : null,
  createdAt: audit.createdAt ? new Date(audit.createdAt).toISOString() : null,
  updatedAt: audit.updatedAt ? new Date(audit.updatedAt).toISOString() : null,
});

const getAuditDateRange = (dateValue) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return null;
  const start = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

export async function GET(request) {
  if (!isUpdateAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDatabase();
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id");

    if (id) {
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid audit id" }, { status: 400 });
      }

      const audit = await MedicineAudit.findById(id).lean();
      if (!audit) {
        return NextResponse.json({ error: "Audit not found" }, { status: 404 });
      }

      return NextResponse.json({ audit: serializeAudit(audit) });
    }

    const selectedDate = searchParams.get("audit_date");
    const range = selectedDate ? getAuditDateRange(selectedDate) : null;
    if (selectedDate && !range) {
      return NextResponse.json({ error: "Invalid audit date" }, { status: 400 });
    }

    const audits = await MedicineAudit.find(
      range ? { audit_date: { $gte: range.start, $lt: range.end } } : {},
    )
      .select("mmu_name audit_date auditor_name town updatedAt")
      .sort({ audit_date: -1, updatedAt: -1 })
      .limit(150)
      .lean();

    return NextResponse.json({ audits: audits.map(serializeAudit) });
  } catch (error) {
    console.error("Error loading audits for update:", error);
    return NextResponse.json(
      { error: "Unable to load audit details" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  if (!isUpdateAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...data } = await request.json();
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid audit id" }, { status: 400 });
    }

    const allowedFields = [
      "audit_date",
      "mmu_name",
      "town",
      "vehicle_reg_number",
      "apm_name",
      "nodal_officer_name",
      "mmu_doctor_name",
      "mmu_pharmacist_name",
      "vendor_name",
      "phase",
      "auditor_name",
      "medicines",
    ];
    const update = Object.fromEntries(
      allowedFields
        .filter((field) => Object.hasOwn(data, field))
        .map((field) => [field, data[field]]),
    );

    if (Object.keys(update).length !== allowedFields.length) {
      return NextResponse.json(
        { error: "Please provide the complete audit form before updating." },
        { status: 400 },
      );
    }

    await connectDatabase();
    const audit = await MedicineAudit.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Audit details updated successfully.",
      audit: serializeAudit(audit),
    });
  } catch (error) {
    console.error("Error updating audit:", error);
    return NextResponse.json(
      { error: error.message || "Unable to update audit details" },
      { status: 400 },
    );
  }
}
