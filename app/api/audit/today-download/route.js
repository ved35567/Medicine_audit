import ExcelJS from "exceljs";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";
import mongoose from "mongoose";
import MedicineAudit from "@/models/MedicineAudit";
import StockImport from "@/models/MedicineStockItem";
import { formatDateOnly } from "@/lib/dateUtils";

const authCookieName = "dashboardAuth";

const validateAuth = (request) =>
  request.cookies.get(authCookieName)?.value === "true";

const getTodayIstRange = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const dateParts = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const dateKey = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const start = new Date(`${dateKey}T00:00:00+05:30`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const monthStart = new Date(
    `${dateParts.year}-${dateParts.month}-01T00:00:00+05:30`,
  );

  return { dateKey, start, end, monthStart };
};

const sanitizeFilenamePart = (value) =>
  String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "");

const sanitizeWorksheetName = (name, fallback, usedNames) => {
  const base =
    String(name || fallback)
      .replace(/[\[\]:*?/\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 25) || fallback;

  let sheetName = base;
  let index = 2;

  while (usedNames.has(sheetName)) {
    const suffix = ` ${index}`;
    sheetName = `${base.substring(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }

  usedNames.add(sheetName);
  return sheetName;
};

const thinBorder = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const setMergedCell = (sheet, range, value, options = {}) => {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.value = value || "";
  cell.font = options.font || {};
  cell.alignment = {
    horizontal: options.horizontal || "center",
    vertical: "middle",
    wrapText: true,
  };
  if (options.fill) {
    cell.fill = options.fill;
  }
};

const setHeaderCell = (sheet, cellAddress, value, options = {}) => {
  const cell = sheet.getCell(cellAddress);
  cell.value = value || "";
  cell.font = options.font || {};
  cell.alignment = {
    horizontal: options.horizontal || "left",
    vertical: "middle",
    wrapText: false,
  };
};

const applyTableCellStyle = (cell, horizontal = "left", wrapText = true) => {
  cell.font = { name: "Calibri", size: 10 };
  cell.border = thinBorder;
  cell.alignment = {
    horizontal,
    vertical: "middle",
    wrapText,
  };
};

const addLogo = (workbook, sheet) => {
  const logoPath = path.join(process.cwd(), "public", "logo.png");

  if (!fs.existsSync(logoPath)) {
    return;
  }

  const logoId = workbook.addImage({
    filename: logoPath,
    extension: "png",
  });

  sheet.addImage(logoId, {
    tl: { col: 0.1, row: 0.15 },
    ext: { width: 208, height: 60 },
  });
};

export async function GET(request) {
  try {
    if (!validateAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { searchParams } = new URL(request.url);
    const mmuName = searchParams.get("mmu_name");
    const { dateKey, start, end, monthStart } = getTodayIstRange();

    const query = {
      createdAt: {
        $gte: start,
        $lt: end,
      },
    };

    if (mmuName && mmuName.trim() !== "") {
      query.mmu_name = mmuName.trim();
    }

    const audits = await MedicineAudit.find(query)
      .sort({ createdAt: -1 })
      .lean();

    if (!audits.length) {
      return NextResponse.json(
        {
          error: mmuName
            ? `No audits found today for ${mmuName}`
            : "No audits found for today",
        },
        { status: 404 },
      );
    }

    // Monthly Auditor Logic
    const monthlyCount = await MedicineAudit.countDocuments({
      createdAt: {
        $gte: monthStart,
      },
    });

    const seniorAuditor =
      monthlyCount > 60
        ? {
            name: "Dr. Abhishek Khandelwal",
            designation: "(Senior Medical Auditor)",
          }
        : {
            name: "Major Rakesh Sharma",
            designation: "(Retd. Medical Officer Indian Army)",
          };

    const workbook = new ExcelJS.Workbook();
    const usedSheetNames = new Set();

    for (const audit of audits) {
      const sheet = workbook.addWorksheet(
        sanitizeWorksheetName(audit.mmu_name, "Audit", usedSheetNames),
      );

      addLogo(workbook, sheet);
      const stockImport = await StockImport.findOne({
        audit_id: audit._id,
      }).lean();

      const stockMap = new Map(
        (stockImport?.medicines || []).map((item) => [
          item.drug_code?.trim().toUpperCase(),
          item.application_stock,
        ]),
      );

      // Calculate medicine name column width based on actual data
      const _medForWidth = Array.isArray(audit.medicines)
        ? audit.medicines
        : [];
      const _maxMedLen = _medForWidth.reduce(
        (max, m) => Math.max(max, (m?.medicine_name || "").length),
        "Medicine Name".length,
      );
      const colCWidth = Math.min(
        Math.max(Math.ceil(_maxMedLen * 0.85), 22),
        52,
      );

      sheet.columns = [
        { width: 8 }, // A: Sr No
        { width: 10 }, // B: Drug Code
        { width: colCWidth }, // C: Medicine Name (fit to content)
        { width: 16 }, // D: Application Stock (A)
        { width: 16 }, // E: Physical Qty (B)
        { width: 13 }, // F: Difference (A-B)
        { width: 11 }, // G: Expired Qty
        { width: 13 }, // H: Remark/Input
      ];
      sheet.properties.defaultRowHeight = 22;
      sheet.pageSetup = {
        paperSize: 9,
        orientation: "Portrait",
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

      // Header
      sheet.getRow(1).height = 18;
      sheet.getRow(2).height = 18;
      sheet.getRow(3).height = 18;

      setMergedCell(sheet, "C2:D3", "MMU TPA Project", {
        font: { bold: true, size: 14 },
      });

      setMergedCell(sheet, "A4:D4", "MMSSY-CHHATTISGARH", {
        font: { bold: true, size: 14 },
      });
      setHeaderCell(sheet, "E4", "MMU NO.", { font: { bold: true } });
      setMergedCell(sheet, "F4:H4", audit.mmu_name, {
        font: { bold: true },
        horizontal: "left",
      });

      setMergedCell(
        sheet,
        "A5:D5",
        "CHECK LIST OF ESSENTIAL DRUG LIST IN THE MMU",
        {
          font: { bold: true, size: 12 },
        },
      );
      setHeaderCell(sheet, "E5", "Vehicle REG. NO.", { font: { bold: true } });
      setMergedCell(sheet, "F5:H5", audit.vehicle_reg_number, {
        horizontal: "left",
      });

      setHeaderCell(sheet, "A6", "TOWN", { font: { bold: true } });
      setMergedCell(sheet, "B6:D6", audit.town, { horizontal: "center" });
      setHeaderCell(sheet, "E6", "MMU - APM", { font: { bold: true } });
      setMergedCell(sheet, "F6:H6", audit.apm_name, { horizontal: "left" });

      setHeaderCell(sheet, "A7", "SPA", { font: { bold: true } });
      setMergedCell(sheet, "B7:D7", audit.vendor_name);
      setHeaderCell(sheet, "E7", "Nodal Officer", { font: { bold: true } });
      setMergedCell(sheet, "F7:H7", audit.nodal_officer_name, {
        horizontal: "left",
      });

      setHeaderCell(sheet, "A8", "DATE", { font: { bold: true } });
      setMergedCell(
        sheet,
        "B8:D8",
        new Date(audit.audit_date).toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      );
      setHeaderCell(sheet, "E8", "MMU Doctor", { font: { bold: true } });
      setMergedCell(sheet, "F8:H8", audit.mmu_doctor_name, {
        horizontal: "left",
      });

      setHeaderCell(sheet, "E9", "MMU Pharmacist", { font: { bold: true } });
      setMergedCell(sheet, "F9:H9", audit.mmu_pharmacist_name, {
        horizontal: "left",
      });

      [4, 5, 6, 7, 8, 9].forEach((headerDetailRow) => {
        sheet.getRow(headerDetailRow).height = 18;
      });

      // Apply full outer border to rows 4-9 (columns 1-8)
      for (let r = 4; r <= 9; r++) {
        for (let c = 1; c <= 8; c++) {
          const cell = sheet.getCell(r, c);
          cell.border = thinBorder;
        }
      }

      // Table Header
      const headerRow = 10;

      const headers = [
        "Sr No",
        "Drug Code",
        "Medicine Name",
        "Application Stock (A)",
        "Physical Qty (B)",
        "Difference (A-B)",
        "Expired Qty",
        "Remark/Input",
      ];

      headers.forEach((h, i) => {
        const cell = sheet.getCell(headerRow, i + 1);

        cell.value = h;

        cell.font = {
          bold: true,
          size: 10,
        };

        // No fill for header cells (default white background)

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: false,
        };
        cell.border = thinBorder;
      });

      const firstMedicineRow = headerRow + 1;
      const medicines = Array.isArray(audit.medicines) ? audit.medicines : [];
      const totalMedicineRows = Math.max(medicines.length, 170);

      for (let index = 0; index < totalMedicineRows; index++) {
        const row = firstMedicineRow + index;
        const medicine = medicines[index];

        sheet.getCell(`A${row}`).value = index + 1;
        sheet.getCell(`B${row}`).value = medicine?.drug_code || "";
        sheet.getCell(`C${row}`).value = medicine?.medicine_name || "";

        sheet.getCell(`D${row}`).value =
          stockMap.get(medicine?.drug_code?.trim().toUpperCase()) ?? "";
        // Auto Filled
        sheet.getCell(`E${row}`).value = medicine?.physical_quantity ?? "";
 // Difference
        sheet.getCell(`F${row}`).value = {
          formula: `IF(AND(D${row}="",E${row}=""),"",IF(D${row}="",0,D${row})-IF(E${row}="",0,E${row}))`,
        };

        // Expired Qty
        sheet.getCell(`G${row}`).value = "";

         // Remark
        sheet.getCell(`H${row}`).value = {
          formula: `IFERROR(IF(OR(F${row}="",F${row}=0),"",IF(F${row}>0,"Shortage","Excess")),"")`,
        };

        applyTableCellStyle(sheet.getCell(`A${row}`), "center");
        applyTableCellStyle(sheet.getCell(`B${row}`), "left");
        applyTableCellStyle(sheet.getCell(`C${row}`), "left");
        applyTableCellStyle(sheet.getCell(`D${row}`), "center", false);
        applyTableCellStyle(sheet.getCell(`E${row}`), "center", false);
        applyTableCellStyle(sheet.getCell(`F${row}`), "center");
        applyTableCellStyle(sheet.getCell(`G${row}`), "center");
        applyTableCellStyle(sheet.getCell(`H${row}`), "center");
      }

      const tableEndRow = firstMedicineRow + totalMedicineRows - 1;
      // No frozen panes; keep default view
      sheet.autoFilter = {
        from: { row: headerRow, column: 1 },
        to: { row: tableEndRow, column: 8 },
      };
      // Apply outer border to the top section (rows 1-3, columns 1-8) – left and right borders
      for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 8; c++) {
          const cell = sheet.getCell(r, c);
          cell.border = {
            left: c === 1 ? { style: "thin" } : {},
            right: c === 8 ? { style: "thin" } : {},
            ...(r === 1 && { top: { style: "thin" } }),
            ...(r === 3 && { bottom: { style: "thin" } }),
          };
        }
      }

      // Footer
      let row = tableEndRow + 3;

      sheet.getCell(`C${row + 2}`).value = `Dr.${audit.auditor_name}`;
      sheet.getCell(`C${row + 2}`).alignment = { horizontal: "center" };
      sheet.getCell(`C${row + 2}`).font = {
        name: "Calibri",
        size: 11,
        bold: true,
      };
      sheet.getCell(`C${row + 2}`).alignment = { horizontal: "center" };

      sheet.mergeCells(`F${row}:H${row}`);
      sheet.getCell(`F${row}`).value = "Reviewed & Approved By";
      sheet.getCell(`F${row}`).font = {
        name: "Calibri",
        size: 10,
        bold: false,
      };
      sheet.getCell(`F${row}`).alignment = { horizontal: "center" };

      row++; // after 'Reviewed & Approved By' row
      row++; // blank row before auditor details

      sheet.mergeCells(`F${row}:H${row}`);
      sheet.getCell(`F${row}`).value = seniorAuditor.name;
      sheet.getCell(`F${row}`).font = {
        name: "Calibri",
        size: 11,
        bold: true,
      };
      sheet.getCell(`F${row}`).alignment = { horizontal: "center" };

      row++;

      sheet.mergeCells(`A${row}:D${row}`);
      sheet.getCell(`A${row}`).value = "(Medical Auditor)";
      sheet.getCell(`A${row}`).font = {
        name: "Calibri",
        size: 10,
        bold: false,
      };
      sheet.getCell(`A${row}`).alignment = { horizontal: "center" };

      sheet.mergeCells(`F${row}:H${row}`);
      sheet.getCell(`F${row}`).value = seniorAuditor.designation;
      sheet.getCell(`F${row}`).font = {
        name: "Calibri",
        size: 10,
        bold: false,
      };
      sheet.getCell(`F${row}`).alignment = {
        horizontal: "center",
        wrapText: true,
      };

      sheet.pageSetup.printArea = `A1:H${row}`;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filenameParts = [
      "medicine_audit",
      mmuName ? sanitizeFilenamePart(mmuName) : "all_mmus",
      dateKey,
    ].filter(Boolean);
    const filename = `${filenameParts.join("_")}.xlsx`;

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Audit-Count": String(audits.length),
        "X-Report-Date": formatDateOnly(start),
      },
    });
  } catch (error) {
    console.error("Error generating today audit report:", error);

    return NextResponse.json(
      {
        error: "Failed to generate report",
      },
      {
        status: 500,
      },
    );
  }
}
