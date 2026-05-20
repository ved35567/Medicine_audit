import MedicineAudit from "@/models/MedicineAudit";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import { formatToIST, formatDateOnly } from "@/lib/dateUtils";

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
    const month = searchParams.get("month"); // YYYY-MM format
    const year = searchParams.get("year"); // YYYY format
    const mmu_name = searchParams.get("mmu_name"); // MMU Filter

    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    let startDate, endDate;

    if (month) {
      // Specific month
      const [y, m] = month.split("-");
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 1);
    } else if (year) {
      // Entire year
      startDate = new Date(year, 0, 1);
      endDate = new Date(year + 1, 0, 1);
    } else {
      // Current month
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }

    // Base query
    const query = {
      createdAt: { $gte: startDate, $lt: endDate },
    };

    if (mmu_name && mmu_name.trim() !== "") {
      query.mmu_name = mmu_name;
    }

    // Fetch audits for the period
    const audits = await MedicineAudit.find(query).sort({ createdAt: -1 });

    if (!audits || audits.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No data found for the selected period and MMU",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
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
      const auditDate = formatDateOnly(audit.audit_date);
      const submittedDate = formatToIST(audit.createdAt);

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

          row.alignment = {
            horizontal: "center",
            vertical: "center",
          };
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

    // Calculate statistics
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

    // Summary header
    summarySheet.getCell("A1").value = "Monthly Audit Summary";
    summarySheet.getCell("A1").font = {
      bold: true,
      size: 16,
      color: { argb: "1E293B" },
    };

    // Period
    const periodText = month
      ? `Month: ${new Date(month + "-01").toLocaleString("en-IN", {
          month: "long",
          year: "numeric",
        })}`
      : year
        ? `Year: ${year}`
        : `Month: ${new Date().toLocaleString("en-IN", {
            month: "long",
            year: "numeric",
          })}`;

    summarySheet.getCell("A2").value = periodText;
    summarySheet.getCell("A2").font = { bold: true, size: 12 };

    // Statistics
    let statRow = 4;
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

    // Medicine breakdown
    summarySheet.getCell(`A${statRow + 2}`).value = "Medicine Breakdown";
    summarySheet.getCell(`A${statRow + 2}`).font = { bold: true, size: 12 };

    const breakdownHeaders = [
      summarySheet.getCell(`A${statRow + 3}`),
      summarySheet.getCell(`B${statRow + 3}`),
    ];
    breakdownHeaders.forEach((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "475569" },
      };
    });

    summarySheet.getCell(`A${statRow + 3}`).value = "Medicine Name";
    summarySheet.getCell(`B${statRow + 3}`).value = "Total Qty";

    let medicineRow = statRow + 4;
    Object.entries(medicineBreakdown)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, qty]) => {
        summarySheet.getCell(`A${medicineRow}`).value = name;
        summarySheet.getCell(`B${medicineRow}`).value = qty;
        if (medicineRow % 2 === 0) {
          summarySheet.getCell(`A${medicineRow}`).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F1F5F9" },
          };
          summarySheet.getCell(`B${medicineRow}`).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F1F5F9" },
          };
        }
        medicineRow++;
      });

    summarySheet.columns = [{ width: 30 }, { width: 15 }];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create filename
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = month
      ? `medicine_audit_${month}.xlsx`
      : year
        ? `medicine_audit_${year}.xlsx`
        : `medicine_audit_${dateStr}.xlsx`;

    // Return Excel file
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating monthly Excel:", error);
    return new Response("Error generating Excel file", { status: 500 });
  }
}
