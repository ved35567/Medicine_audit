import mongoose from "mongoose";
import MedicineAudit from "@/models/MedicineAudit";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Parse the incoming JSON data from the form
    const data = await request.json();

    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Create a new audit record
    const newAudit = new MedicineAudit({
      audit_date: data.audit_date,
      mmu_name: data.mmu_name,
      town:data.town,
      vehicle_reg_number: data.vehicle_reg_number,
      apm_name: data.apm_name,
      nodal_officer_name: data.nodal_officer_name,
      mmu_doctor_name: data.mmu_doctor_name,
      mmu_pharmacist_name: data.mmu_pharmacist_name,
      vendor_name: data.vendor_name,
      phase: data.phase,
      auditor_name: data.auditor_name,
      medicines: data.medicines, // contains drug_code, medicine_name, and physical_quantity
    });

    // Save to the database
    await newAudit.save();

    // Return success response to frontend
    return NextResponse.json(
      { success: true, message: "Audit data submitted successfully!" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error submitting audit:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to submit audit data",
      },
      { status: 500 },
    );
  }
}
