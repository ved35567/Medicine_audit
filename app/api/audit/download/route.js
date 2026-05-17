import MedicineAudit from "@/models/MedicineAudit";
import mongoose from "mongoose";
import ExcelJS from "exceljs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mmu_name = searchParams.get("mmu_name");

    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Base query
    const query = {};
    if (mmu_name && mmu_name.trim() !== "") {
      query.mmu_name = mmu_name;
    }

    // Fetch all audit records
    const audits = await MedicineAudit.find(query).sort({ createdAt: -1 });

    if (!audits || audits.length === 0) {
      return new Response(JSON.stringify({ message: "No data found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Medicine Audit");

    // Define columns
    worksheet.columns = [
      { header: "S.No", key: "sno", width: 8 },
      { header: "Audit Date", key: "audit_date", width: 15 },
      { header: "Submitted At", key: "submitted_at", width: 20 },
      { header: "MMU Name", key: "mmu_name", width: 20 },
      { header: "Vehicle Reg", key: "vehicle_reg_number", width: 15 },
      { header: "APM Name", key: "apm_name", width: 18 },
      { header: "Nodal Officer", key: "nodal_officer_name", width: 18 },
      { header: "Doctor Name", key: "mmu_doctor_name", width: 18 },
      { header: "Pharmacist Name", key: "mmu_pharmacist_name", width: 18 },
      { header: "Vendor Name", key: "vendor_name", width: 18 },
      { header: "Phase", key: "phase", width: 12 },
      { header: "Drug Code", key: "drug_code", width: 12 },
      { header: "Medicine Name", key: "medicine_name", width: 25 },
      { header: "Physical Quantity", key: "physical_quantity", width: 15 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1E293B" },
    };
    headerRow.alignment = {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    };

    // Add data rows
    let rowIndex = 2;
    audits.forEach((audit, auditIndex) => {
      const auditDate = new Date(audit.audit_date).toLocaleDateString("en-IN");
      const submittedDate = new Date(audit.createdAt).toLocaleString("en-IN");

      if (audit.medicines && audit.medicines.length > 0) {
        audit.medicines.forEach((medicine) => {
          const row = worksheet.getRow(rowIndex);
          row.values = {
            sno: auditIndex + 1,
            audit_date: auditDate,
            submitted_at: submittedDate,
            mmu_name: audit.mmu_name,
            vehicle_reg_number: audit.vehicle_reg_number,
            apm_name: audit.apm_name,
            nodal_officer_name: audit.nodal_officer_name,
            mmu_doctor_name: audit.mmu_doctor_name,
            mmu_pharmacist_name: audit.mmu_pharmacist_name,
            vendor_name: audit.vendor_name,
            phase: audit.phase,
            drug_code: medicine.drug_code,
            medicine_name: medicine.medicine_name,
            physical_quantity: medicine.physical_quantity,
          };

          // Style data rows
          row.alignment = { horizontal: "center", vertical: "center" };
          row.borders = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          // Alternate row colors for better readability
          if (auditIndex % 2 === 0) {
            row.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F1F5F9" },
            };
          }

          rowIndex++;
        });
      }
    });

    // Freeze header row
    worksheet.views = [
      { state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" },
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return Excel file
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="medicine_audit_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return new Response("Error generating Excel file", { status: 500 });
  }
}
