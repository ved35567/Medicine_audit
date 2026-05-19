import MedicineAudit from "@/models/MedicineAudit";
import mongoose from "mongoose";
import ExcelJS from "exceljs";

const authCookieName = "dashboardAuth";

const validateAuth = (request) =>
  request.cookies.get(authCookieName)?.value === "true";

export async function GET(request) {
  try {
    if (!validateAuth(request)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { searchParams } = new URL(request.url);
    const mmu_name = searchParams.get("mmu_name");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
      return new Response(
        JSON.stringify({
          message:
            "Please provide both start and end dates to generate the report.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Parse dates avoiding timezone shift issues
    const [sY, sM, sD] = startDateStr.split("-");
    const startDate = new Date(sY, sM - 1, sD);

    const [eY, eM, eD] = endDateStr.split("-");
    const endDate = new Date(eY, eM - 1, eD);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({
          message:
            "The provided dates are invalid. Please check the date format and try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (startDate > endDate) {
      return new Response(
        JSON.stringify({
          message:
            "The start date cannot be later than the end date. Please provide a valid date range.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Build query to check BOTH the database creation time
    // AND the exact audit_date (whether it is saved as String or Date object)
    const query = {
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { audit_date: { $gte: startDateStr, $lte: endDateStr } },
        { audit_date: { $gte: startDate, $lte: endDate } },
      ],
    };

    if (mmu_name && mmu_name.trim() !== "") {
      query.mmu_name = mmu_name;
    }

    // Fetch audits for the period
    const audits = await MedicineAudit.find(query).sort({ createdAt: -1 });

    if (!audits || audits.length === 0) {
      return new Response(
        JSON.stringify({
          message:
            "We couldn't find any audit records for the selected date range and MMU. Please try adjusting your filters.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Detailed Audit Data
    const auditSheet = workbook.addWorksheet("Audit Details");
    auditSheet.columns = [
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

    // Style header
    const headerRow = auditSheet.getRow(1);
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

    // Add audit data
    let rowIndex = 2;
    audits.forEach((audit, auditIndex) => {
      const auditDate = new Date(audit.audit_date).toLocaleDateString("en-IN");
      const submittedDate = new Date(audit.createdAt).toLocaleString("en-IN");

      if (audit.medicines && audit.medicines.length > 0) {
        audit.medicines.forEach((medicine) => {
          const row = auditSheet.getRow(rowIndex);
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

    auditSheet.views = [
      { state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" },
    ];

    // Sheet 2: Summary Statistics
    const summarySheet = workbook.addWorksheet("Summary");
    const mmuSet = new Set(audits.map((a) => a.mmu_name));
    let totalMedicines = 0;
    const medicineBreakdown = {};

    audits.forEach((audit) => {
      audit.medicines.forEach((medicine) => {
        if (medicine.physical_quantity > 0) {
          totalMedicines += medicine.physical_quantity;
          if (!medicineBreakdown[medicine.medicine_name]) {
            medicineBreakdown[medicine.medicine_name] = 0;
          }
          medicineBreakdown[medicine.medicine_name] +=
            medicine.physical_quantity;
        }
      });
    });

    summarySheet.getCell("A1").value = "Date Range Audit Summary";
    summarySheet.getCell("A1").font = {
      bold: true,
      size: 16,
      color: { argb: "1E293B" },
    };
    summarySheet.getCell("A2").value =
      `Period: ${startDateStr} to ${endDateStr}`;
    summarySheet.getCell("A2").font = { bold: true, size: 12 };

    let statRow = 4;
    if (mmu_name) {
      summarySheet.getCell("A3").value = `MMU Name: ${mmu_name}`;
      summarySheet.getCell("A3").font = { bold: true, size: 12 };
      statRow = 5;
    }

    const stats = [
      ["Total Audits Completed", audits.length],
      ["Total MMU Audited", mmuSet.size],
      ["Total Medicines Filled (Qty)", totalMedicines],
      [
        "Average Medicines per Audit",
        (totalMedicines / audits.length).toFixed(2),
      ],
    ];

    stats.forEach(([label, value]) => {
      summarySheet.getCell(`A${statRow}`).value = label;
      summarySheet.getCell(`A${statRow}`).font = { bold: true };
      summarySheet.getCell(`B${statRow}`).value = value;
      summarySheet.getCell(`B${statRow}`).font = {
        size: 12,
        color: { argb: "1E293B" },
      };
      statRow++;
    });

    summarySheet.columns = [{ width: 30 }, { width: 15 }];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `medicine_audit_${startDateStr}_to_${endDateStr}.xlsx`;

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating date range Excel:", error);
    return new Response(
      JSON.stringify({
        message:
          "Oops! Something went wrong while generating your Excel file. Please try again later or contact support if the problem persists.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
