import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import MedicineAudit from "@/models/MedicineAudit";
import StockImport from "@/models/MedicineStockItem";

const authCookieName = "dashboardAuth";

const validateAuth = (request) =>
  request.cookies.get(authCookieName)?.value === "true";

const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const capitalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());

const buildMedicineRichText = (medicines) => {
  const richText = [];
  medicines.forEach((entry, index) => {
    const colonIdx = entry.lastIndexOf(":");
    const name = entry.substring(0, colonIdx + 1);
    const qty = entry.substring(colonIdx + 1);
    richText.push({ text: name, font: { name: "Calibri", size: 10 } });
    richText.push({ text: qty, font: { name: "Calibri", size: 10, bold: true } });
    if (index < medicines.length - 1) {
      richText.push({ text: ", ", font: { name: "Calibri", size: 10 } });
    }
  });
  return { richText };
};

const thinBorder = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const applyCellStyle = (cell, horizontal = "center", wrapText = false, vertical = "middle") => {
  cell.font = { name: "Calibri", size: 10 };
  cell.border = thinBorder;
  cell.alignment = {
    horizontal,
    vertical,
    wrapText,
  };
};

export async function GET(request) {
  try {
    if (!validateAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mmuName = searchParams.get("mmu_name");
    const selectedDate = searchParams.get("date");
    const status = String(searchParams.get("status") || "")
      .trim()
      .toLowerCase();

    if (!mmuName || !mmuName.trim()) {
      return NextResponse.json(
        { error: "MMU Name is required" },
        { status: 400 },
      );
    }

    if (!selectedDate || !isValidDateString(selectedDate)) {
      return NextResponse.json(
        { error: "A valid date in YYYY-MM-DD format is required" },
        { status: 400 },
      );
    }

    if (!["excess", "shortage"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be either excess or shortage" },
        { status: 400 },
      );
    }
    if (!mongoose.connections[0]?.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const start = new Date(`${selectedDate}T00:00:00+05:30`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const query = {
      mmu_name: mmuName.trim(),
      $or: [
        { createdAt: { $gte: start, $lt: end } },
        { audit_date: { $gte: start, $lt: end } },
      ],
    };

    const audits = await MedicineAudit.find(query)
      .sort({ createdAt: -1 })
      .lean();

    if (!audits.length) {
      return NextResponse.json(
        {
          error: `No audits found for ${mmuName} on ${selectedDate}`,
        },
        { status: 404 },
      );
    }

    const auditIds = audits.map((audit) => audit._id);
    const stockImports = await StockImport.find({
      audit_id: { $in: auditIds },
    }).lean();

    const stockByAuditId = new Map(
      stockImports.map((stockImport) => [
        String(stockImport.audit_id),
        stockImport,
      ]),
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Excess Shortage");

    worksheet.columns = [
      { header: "S. No.", key: "sno", width: 10 },
      { header: "MMU No.", key: "mmu_no", width: 22 },
      { header: "Excess/ Shortage", key: "status", width: 18 },
      {
        header: "Medicine Name & Quantity",
        key: "medicine_details",
        width: 62,
      },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    for (let col = 1; col <= 4; col++) {
      const hCell = headerRow.getCell(col);
      hCell.border = thinBorder;
      hCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1E293B" },
      };
    }
    worksheet.pageSetup = {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.35,
        bottom: 0.35,
        header: 0.2,
        footer: 0.2,
      },
    };

    worksheet.views = [
      { state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" },
    ];

    let rowIndex = 2;
    let serialNo = 1;
    const statusLabel = capitalize(status);

    for (const audit of audits) {
      const stockImport = stockByAuditId.get(String(audit._id));

      const stockMap = new Map(
        (stockImport?.medicines || []).map((item) => [
          normalizeCode(item.drug_code),
          Number(item.application_stock || 0),
        ]),
      );

      const matchingMedicines = [];
      const medicines = Array.isArray(audit.medicines) ? audit.medicines : [];

      for (const medicine of medicines) {
        const applicationStock = Number(
          stockMap.get(normalizeCode(medicine.drug_code)) ?? 0,
        );

        const physicalStock = Number(medicine.physical_quantity || 0);

        let computedStatus = "";

        if (physicalStock > applicationStock) {
          computedStatus = "excess";
        } else if (physicalStock < applicationStock) {
          computedStatus = "shortage";
        } else {
          computedStatus = "equal";
        }

        if (computedStatus !== status) {
          continue;
        }

        const difference = applicationStock - physicalStock;

        if (Math.abs(difference) >= 50) {
          matchingMedicines.push(`${medicine.medicine_name}:${Math.abs(difference)}`);
        }
      } // end for (const medicine of medicines)

      if (!matchingMedicines.length) {
        continue;
      }

      const row = worksheet.getRow(rowIndex);

      row.values = {
        sno: serialNo,
        mmu_no: audit.mmu_name,
        status: statusLabel,
      };

      // Set medicine names with bold quantity using rich text
      row.getCell(4).value = buildMedicineRichText(matchingMedicines);

      row.height = Math.max(24, matchingMedicines.length * 4);

      applyCellStyle(row.getCell(1), "center", false, "middle");
      applyCellStyle(row.getCell(2), "center", false, "middle");
      applyCellStyle(row.getCell(3), "center", false, "middle");
      applyCellStyle(row.getCell(4), "left", true, "top");

      if (serialNo % 2 === 0) {
        for (let col = 1; col <= 4; col++) {
          row.getCell(col).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: "F8FAFC",
            },
          };
        }
      }

      rowIndex++;
      serialNo++;
    } // end for (const audit of audits)

    if (serialNo === 1) {
      return NextResponse.json(
        {
          error: `No ${statusLabel.toLowerCase()} medicines found for ${mmuName} on ${selectedDate}`,
        },
        { status: 404 },
      );
    }

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rowIndex - 1, column: 4 },
    };
    const filename = `medicine_${statusLabel.toLowerCase()}_${mmuName
      .trim()
      .replace(/[^\w.-]+/g, "_")}_${selectedDate}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition": `attachment; filename="${filename}"`,

        "Cache-Control": "no-store",

        "Content-Length": Buffer.byteLength(Buffer.from(buffer)).toString(),
      },
    });
  } catch (error) {
    console.error("Error generating excess/shortage Excel:", error);
    return NextResponse.json(
      { error: "Failed to generate excess/shortage report" },
      { status: 500 },
    );
  }
}
