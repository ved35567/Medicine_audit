import MedicineAudit from "@/models/MedicineAudit";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import { formatToIST, formatDateOnly } from "@/lib/dateUtils";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mmu = searchParams.get("mmu");
    const start = searchParams.get("start"); // YYYY-MM-DD
    const end = searchParams.get("end"); // YYYY-MM-DD

    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    let startDate, endDate;
    if (start) {
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
    }
    if (end) {
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    }

    const query = {};
    if (startDate && endDate)
      query.createdAt = { $gte: startDate, $lte: endDate };
    else if (startDate) query.createdAt = { $gte: startDate };
    else if (endDate) query.createdAt = { $lte: endDate };

    if (mmu) query.mmu_name = mmu;

    const audits = await MedicineAudit.find(query).sort({ createdAt: -1 });

    if (!audits || audits.length === 0) {
      return new Response("No data found for the selected criteria", {
        status: 404,
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Medicine Report");

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
      { header: "Medicine Name", key: "medicine_name", width: 30 },
      { header: "Physical Quantity", key: "physical_quantity", width: 15 },
    ];

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

    let rowIndex = 2;
    audits.forEach((audit, auditIndex) => {
      const auditDate = formatDateOnly(audit.audit_date);
      const submittedDate = formatToIST(audit.createdAt);

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

          row.alignment = { horizontal: "center", vertical: "center" };
          row.borders = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if (rowIndex % 2 === 0) {
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

    worksheet.views = [
      { state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const filenameParts = ["medicine_report"];
    if (mmu) filenameParts.push(mmu.replace(/\s+/g, "_"));
    if (start) filenameParts.push(start);
    if (end) filenameParts.push(end);
    const filename = `${filenameParts.join("_")}.xlsx`;

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating medicine report:", error);
    return new Response("Error generating report", { status: 500 });
  }
}
