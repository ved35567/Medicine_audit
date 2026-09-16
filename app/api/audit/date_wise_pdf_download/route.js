import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { NextResponse } from "next/server";

import MedicineAudit from "@/models/MedicineAudit";
import StockImport from "@/models/MedicineStockItem";
import { formatDateOnly } from "@/lib/dateUtils";

const authCookieName = "dashboardAuth";

// ============================================================
// AUTH
// ============================================================

const validateAuth = (request) =>
  request.cookies.get(authCookieName)?.value === "true";

// ============================================================
// FILE NAME
// ============================================================

const sanitizeFilenamePart = (value) =>
  String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "");

// ============================================================
// A4 PAGE
// ============================================================

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 24;
const MARGIN_RIGHT = 24;
const MARGIN_TOP = 22;
const MARGIN_BOTTOM = 22;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// ============================================================
// EXCEL COLUMN PROPORTIONS
//
// A = 8
// B = 10
// C = 30
// D = 16
// E = 16
// F = 13
// G = 11
// H = 13
// ============================================================

const EXCEL_COLUMNS = [
  6,
  7,
  42,
  13,
  11,
  7,
  7,
  10,
];

const totalColumnUnits = EXCEL_COLUMNS.reduce(
  (sum, value) => sum + value,
  0,
);

const COLUMN_WIDTHS = EXCEL_COLUMNS.map(
  (value) =>
    (value / totalColumnUnits) *
    CONTENT_WIDTH,
);

const [
  COL_SR,
  COL_CODE,
  COL_MEDICINE,
  COL_APPLICATION,
  COL_PHYSICAL,
  COL_DIFFERENCE,
  COL_EXPIRED,
  COL_REMARK,
] = COLUMN_WIDTHS;

// ============================================================
// FIXED REPORT
// ============================================================

const TOTAL_MEDICINES = 170;

// Fixed three-page report.
//
// These are intentionally fixed.
// If your reference PDF has different boundaries,
// change these three values.
//
// Page 1: 1 - 61
// Page 2: 62 - 136
// Page 3: 137 - 170 + footer
//
const PAGE_1_START = 0;
const PAGE_1_END = 61;

const PAGE_2_START = 61;
const PAGE_2_END = 136;

const PAGE_3_START = 136;
const PAGE_3_END = 170;

// ============================================================
// COLORS
// ============================================================

const BLACK = "#000000";

// ============================================================
// BORDER
// ============================================================

const drawBorder = (
  doc,
  x,
  y,
  width,
  height,
) => {
  doc
    .lineWidth(0.5)
    .strokeColor(BLACK)
    .rect(
      x,
      y,
      width,
      height,
    )
    .stroke();
};

// ============================================================
// CELL
// ============================================================

const drawCell = (
  doc,
  x,
  y,
  width,
  height,
  value = "",
  options = {},
) => {
  const {
    align = "left",
    fontSize = 8.5,
    bold = false,
    padding = 3,
    wrap = false,
  } = options;

  drawBorder(
    doc,
    x,
    y,
    width,
    height,
  );

  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  doc
    .font(
      bold
        ? "Helvetica-Bold"
        : "Helvetica",
    )
    .fontSize(fontSize)
    .fillColor(BLACK);

  const textWidth =
    Math.max(
      width - padding * 2,
      1,
    );

  const textHeight =
    doc.heightOfString(
      text,
      {
        width: textWidth,
        lineGap: 0,
      },
    );

  const textY =
    y +
    Math.max(
      padding,
      (height - textHeight) / 2,
    );

  doc.text(
    text,
    x + padding,
    textY,
    {
      width: textWidth,
      align,
      lineGap: 0,
      lineBreak: wrap,
    },
  );
};

const drawText = (
  doc,
  x,
  y,
  width,
  height,
  value = "",
  options = {},
) => {
  const {
    align = "left",
    fontSize = 8.5,
    bold = false,
    padding = 0,
  } = options;

  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  doc
    .font(
      bold
        ? "Helvetica-Bold"
        : "Helvetica",
    )
    .fontSize(fontSize)
    .fillColor(BLACK)
    .text(
      text,
      x + padding,
      y + padding,
      {
        width: Math.max(
          width - padding * 2,
          1,
        ),
        height,
        align,
        lineBreak: false,
      },
    );
};

// ============================================================
// MERGED CELL
// ============================================================

const drawMergedCell = (
  doc,
  x,
  y,
  width,
  height,
  value = "",
  options = {},
) => {
  drawCell(
    doc,
    x,
    y,
    width,
    height,
    value,
    options,
  );
};

// ============================================================
// MEDICINE ROW HEIGHT
//
// Dynamic height.
// No ellipsis.
// No fixed 10.8.
// ============================================================

const getMedicineRowHeight = () => {
  return 10.5;
};

// ============================================================
// LOGO
// ============================================================

const drawLogo = (
  doc,
) => {
  const logoPath =
    path.join(
      process.cwd(),
      "public",
      "logo.png",
    );

  if (
    !fs.existsSync(
      logoPath,
    )
  ) {
    console.error(
      "Logo not found:",
      logoPath,
    );
    return;
  }

  try {
    const logoBuffer = fs.readFileSync(
      logoPath,
    );
    const logoData = logoBuffer.buffer.slice(
      logoBuffer.byteOffset,
      logoBuffer.byteOffset + logoBuffer.byteLength,
    );

    doc.image(
      logoData,
      MARGIN_LEFT + 4,
      MARGIN_TOP + 2,
      {
        width: 54,
        height: 24,
      },
    );
  } catch (error) {
    console.error(
      "Logo error:",
      error,
    );
  }
};

// ============================================================
// REPORT HEADER
// ============================================================

const drawReportHeader = (
  doc,
  audit,
) => {
  let y = MARGIN_TOP;

  const x = MARGIN_LEFT;

  // ----------------------------------------------------------
  // TOP
  // ----------------------------------------------------------

  const topHeight = 24;

  drawBorder(
    doc,
    x,
    y,
    CONTENT_WIDTH,
    topHeight,
  );

  drawLogo(doc);

  const titleX =
    x +
    COL_SR +
    COL_CODE;

  const titleWidth =
    COL_MEDICINE +
    COL_APPLICATION;

  drawMergedCell(
    doc,
    titleX,
    y,
    titleWidth,
    topHeight,
    "MMU TPA Project",
    {
      align: "center",
      fontSize: 10,
      bold: true,
    },
  );

  y += topHeight;

  // ----------------------------------------------------------
  // HEADER ROWS
  // ----------------------------------------------------------

  const rowHeight = 16;

  const leftWidth =
    COL_SR +
    COL_CODE +
    COL_MEDICINE +
    COL_APPLICATION;

  const eX =
    x + leftWidth;

  const rightWidth =
    COL_DIFFERENCE +
    COL_EXPIRED +
    COL_REMARK;

  // ROW 4
  drawMergedCell(
    doc,
    x,
    y,
    leftWidth,
    rowHeight,
    "MMSSY-CHHATTISGARH",
    {
      align: "center",
      fontSize: 10,
      bold: true,
    },
  );

  drawCell(
    doc,
    eX,
    y,
    COL_PHYSICAL,
    rowHeight,
    "MMU NO.",
    {
      align: "center",
      fontSize: 8,
      bold: true,
    },
  );

  drawMergedCell(
    doc,
    eX + COL_PHYSICAL,
    y,
    rightWidth,
    rowHeight,
    audit.mmu_name,
    {
      align: "left",
      fontSize: 9,
      bold: true,
    },
  );

  y += rowHeight;

  // ROW 5
  drawMergedCell(
    doc,
    x,
    y,
    leftWidth,
    rowHeight,
    "CHECK LIST OF ESSENTIAL DRUG LIST IN THE MMU",
    {
      align: "center",
      fontSize: 8.5,
      bold: true,
    },
  );

  drawCell(
    doc,
    eX,
    y,
    COL_PHYSICAL,
    rowHeight,
    "Vehicle REG.",
    {
      align: "center",
      fontSize: 7.5,
      bold: true,
    },
  );

  drawMergedCell(
    doc,
    eX + COL_PHYSICAL,
    y,
    rightWidth,
    rowHeight,
    audit.vehicle_reg_number,
    {
      align: "left",
      fontSize: 8.5,
    },
  );

  y += rowHeight;

  // ROW 6
  drawCell(
    doc,
    x,
    y,
    COL_SR,
    rowHeight,
    "TOWN",
    {
      align: "center",
      fontSize: 8,
      bold: true,
    },
  );

  drawMergedCell(
    doc,
    x + COL_SR,
    y,
    COL_CODE +
      COL_MEDICINE +
      COL_APPLICATION,
    rowHeight,
    audit.town,
    {
      align: "center",
      fontSize: 8.5,
    },
  );

  drawCell(
    doc,
    eX,
    y,
    COL_PHYSICAL,
    rowHeight,
    "MMU - APM",
    {
      align: "center",
      fontSize: 8,
      bold: true,
    },
  );

  drawMergedCell(
    doc,
    eX + COL_PHYSICAL,
    y,
    rightWidth,
    rowHeight,
    audit.apm_name,
    {
      align: "left",
      fontSize: 8.5,
    },
  );

  y += rowHeight;

  // ROW 7
  drawCell(
    doc,
    x,
    y,
    COL_SR,
    rowHeight,
    "SPA",
    {
      align: "center",
      fontSize: 8,
      bold: true,
    },
  );

  drawMergedCell(
    doc,
    x + COL_SR,
    y,
    COL_CODE +
      COL_MEDICINE +
      COL_APPLICATION,
    rowHeight,
    audit.vendor_name,
    {
      align: "center",
      fontSize: 8.5,
    },
  );

  drawCell(
    doc,
    eX,
    y,
    COL_PHYSICAL,
    rowHeight,
    "Nodal Officer",
    {
      align: "center",
      fontSize: 7.5,
      bold: true,
    },
  );

  drawMergedCell(
    doc,
    eX + COL_PHYSICAL,
    y,
    rightWidth,
    rowHeight,
    audit.nodal_officer_name,
    {
      align: "left",
      fontSize: 8.5,
    },
  );

  y += rowHeight;

  // ROW 8
  drawCell(
    doc,
    x,
    y,
    COL_SR,
    rowHeight,
    "DATE",
    {
      align: "center",
      fontSize: 8,
      bold: true,
    },
  );

  const auditDate =
    audit.audit_date
      ? new Date(
          audit.audit_date,
        ).toLocaleDateString(
          "en-IN",
          {
            timeZone:
              "Asia/Kolkata",
          },
        )
      : "";

  drawMergedCell(
    doc,
    x + COL_SR,
    y,
    COL_CODE +
      COL_MEDICINE +
      COL_APPLICATION,
    rowHeight,
    auditDate,
    {
      align: "center",
      fontSize: 8.5,
    },
  );

  drawCell(
    doc,
    eX,
    y,
    COL_PHYSICAL,
    rowHeight,
    "MMU Doctor",
    {
      align: "center",
      fontSize: 8,
      bold: true,
    },
  );

  drawMergedCell(
    doc,
    eX + COL_PHYSICAL,
    y,
    rightWidth,
    rowHeight,
    audit.mmu_doctor_name,
    {
      align: "left",
      fontSize: 8.5,
    },
  );

  y += rowHeight;

  // ROW 9
  drawMergedCell(
    doc,
    x,
    y,
    leftWidth,
    rowHeight,
    "",
  );

  drawCell(
    doc,
    eX,
    y,
    COL_PHYSICAL,
    rowHeight,
    "Pharmacist",
    {
      align: "center",
      fontSize: 7.5,
      bold: true,
    },
  );

  drawMergedCell(
    doc,
    eX + COL_PHYSICAL,
    y,
    rightWidth,
    rowHeight,
    audit.mmu_pharmacist_name,
    {
      align: "left",
      fontSize: 8.5,
    },
  );

  y += rowHeight;

  return y;
};

// ============================================================
// TABLE HEADER
// ============================================================

const drawTableHeader = (
  doc,
  y,
) => {
  const x = MARGIN_LEFT;

  const height = 18;

  const headers = [
    {
      value: "Sr No",
      width: COL_SR,
    },
    {
      value: "Drug Code",
      width: COL_CODE,
    },
    {
      value: "Medicine Name",
      width: COL_MEDICINE,
    },
    {
      value:
        "Application Stock (A)",
      width: COL_APPLICATION,
    },
    {
      value:
        "Physical Qty (B)",
      width: COL_PHYSICAL,
          wrap: true,
    },
    {
      value:
        "Difference (A-B)",
      width: COL_DIFFERENCE,
      wrap: true,
    },
    {
      value: "Expired Qty",
      width: COL_EXPIRED,
    },
    {
      value: "Remark/Input",
      width: COL_REMARK,
    },
  ];

  let currentX = x;

  headers.forEach(
    ({
      value,
      width,
      wrap = false,
    }) => {
      drawCell(
        doc,
        currentX,
        y,
        width,
        height,
        value,
        {
          align: "center",
          fontSize: 6.5,
          bold: true,
          padding: 1,
          wrap,
        },
      );

      currentX += width;
    },
  );

  return y + height;
};

// ============================================================
// MEDICINE VALUES
// ============================================================

const calculateMedicineValues = (
  medicine,
  stockMap,
) => {
  const stock =
    stockMap.get(
      medicine?.drug_code
        ?.trim()
        .toUpperCase(),
    );

  const physical =
    medicine?.physical_quantity ??
    "";
 
  let difference = "";

  if (
    stock !== undefined &&
    stock !== "" &&
    physical !== ""
  ) {
    difference =
      Number(stock || 0) -
      Number(physical || 0);
  } else if (
    stock !== undefined &&
    stock !== ""
  ) {
    difference =
      Number(stock || 0);
  } else if (
    physical !== ""
  ) {
    difference =
      0 -
      Number(physical || 0);
  }

  let remark = "";

  if (
    difference !== "" &&
    Number(difference) !== 0
  ) {
    remark =
      Number(difference) > 0
        ? "Shortage"
        : "Excess";
  }

  return {
    stock:
      stock ?? "",
    physical,
    difference,
    remark,
  };
};

// ============================================================
// MEDICINE ROW
// ============================================================

const drawMedicineRow = (
  doc,
  y,
  medicine,
  index,
  stockMap,
) => {
  const x = MARGIN_LEFT;

  const rowHeight =
    getMedicineRowHeight(
      doc,
      medicine,
    );

  const {
    stock,
    physical,
    difference,
    remark,
  } =
    calculateMedicineValues(
      medicine,
      stockMap,
    );

  const cells = [
    {
      value: index + 1,
      width: COL_SR,
      align: "center",
    },
    {
      value:
        medicine?.drug_code || "",
      width: COL_CODE,
      align: "left",
    },
    {
      value:
        medicine?.medicine_name || "",
      width: COL_MEDICINE,
      align: "left",
    },
    {
      value: stock,
      width: COL_APPLICATION,
      align: "center",
    },
    {
      value: physical,
      width: COL_PHYSICAL,
      align: "center",
    },
    {
      value: difference,
      width: COL_DIFFERENCE,
      align: "center",
      wrap: true,
    },
    {
      value: medicine?.expired_quantity ?? 0,
      width: COL_EXPIRED,
      align: "center",
    },
    {
      value: remark,
      width: COL_REMARK,
      align: "center",
    },
  ];

  let currentX = x;

  cells.forEach(
    ({
      value,
      width,
      align,
      wrap = false,
    }) => {
      drawCell(
        doc,
        currentX,
        y,
        width,
        rowHeight,
        value,
        {
          align,
          fontSize: 6,
          padding: 1,
          wrap,
        },
      );

      currentX += width;
    },
  );

  return y + rowHeight;
};

// ============================================================
// FOOTER
// ============================================================

const drawAuditorFooter = (
  doc,
  y,
  audit,
  seniorAuditor,
) => {
  const x = MARGIN_LEFT;

  const leftWidth =
    COL_SR +
    COL_CODE +
    COL_MEDICINE +
    COL_APPLICATION;

  const rightX =
    x +
    leftWidth +
    COL_PHYSICAL;

  const rightWidth =
    COL_DIFFERENCE +
    COL_EXPIRED +
    COL_REMARK;

  // ----------------------------------------------------------
  y += 4;

  drawText(
    doc,
    x,
    y,
    leftWidth,
    16,
    audit.auditor_name || "",
    {
      align: "center",
      fontSize: 8.5,
      bold: true,
    },
  );

  drawText(
    doc,
    rightX,
    y,
    rightWidth,
    16,
    "Reviewed & Approved By",
    {
      align: "center",
      fontSize: 8,
    },
  );

  y += 16;

  drawText(
    doc,
    x,
    y,
    leftWidth,
    16,
    "(Medical Auditor)",
    {
      align: "center",
      fontSize: 8,
    },
  );

  drawText(
    doc,
    rightX,
    y,
    rightWidth,
    16,
    seniorAuditor.name,
    {
      align: "center",
      fontSize: 8.5,
      bold: true,
    },
  );

  y += 16;

  drawText(
    doc,
    rightX,
    y,
    rightWidth,
    16,
    seniorAuditor.designation,
    {
      align: "center",
      fontSize: 7.5,
    },
  );

  return y + 16;
};

// ============================================================
// SENIOR AUDITOR
// ============================================================

const getSeniorAuditor = (
  monthlyCount,
) => {
  if (
    monthlyCount > 60
  ) {
    return {
      name:
        "Dr. Abhishek Khandelwal",

      designation:
        "(Senior Medical Auditor)",
    };
  }

  return {
    name:
      "Major Rakesh Sharma",

    designation:
      "(Retd. Medical Officer Indian Army)",
  };
};

// ============================================================
// START NEW PAGE
// ============================================================

const startPage = (
  doc,
) => {
  doc.addPage({
    size: "A4",
    layout: "portrait",
    margin: 0,
  });
};

// ============================================================
// DRAW MEDICINE RANGE
// ============================================================

const drawMedicineRange = ({
  doc,
  medicines,
  stockMap,
  startIndex,
  endIndex,
  y,
  allowFooterSpace = false,
}) => {
  for (
    let index = startIndex;
    index < endIndex;
    index++
  ) {
    const medicine =
      medicines[index] || {
        drug_code: "",
        medicine_name: "",
        physical_quantity:
          "",
      };

    const rowHeight =
      getMedicineRowHeight(
        doc,
        medicine,
      );

    /*
     * Fixed pages:
     *
     * We do NOT create pages dynamically.
     * The medicine ranges are fixed.
     *
     * This means the report always remains
     * exactly 3 pages.
     */

    const bottomLimit =
      allowFooterSpace
        ? PAGE_HEIGHT -
          170
        : PAGE_HEIGHT -
          MARGIN_BOTTOM;

    if (
      y + rowHeight >
      bottomLimit
    ) {
      /*
       * The page is intentionally fixed.
       *
       * Instead of creating page 4,
       * continue drawing within the
       * allocated page area.
       *
       * In normal reference data the
       * fixed row ranges should fit.
       */
      console.warn(
        `Medicine row ${index + 1} exceeds allocated page height`,
      );
    }

    y =
      drawMedicineRow(
        doc,
        y,
        medicine,
        index,
        stockMap,
      );
  }

  return y;
};

// ============================================================
// MAIN GET
// ============================================================

export async function GET(
  request,
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    if (
      !validateAuth(
        request,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    if (
      !mongoose.connections[0]
        .readyState
    ) {
      await mongoose.connect(
        process.env
          .MONGODB_URI,
      );
    }

    // ========================================================
    // QUERY
    // ========================================================

    const {
      searchParams,
    } = new URL(
      request.url,
    );

    const mmuName =
      searchParams
        .get(
          "mmu_name",
        )
        ?.trim();

    const selectedDate =
      searchParams.get(
        "date",
      );

    if (
      !selectedDate
    ) {
      return NextResponse.json(
        {
          error:
            "Date is required",
        },
        {
          status: 400,
        },
      );
    }

    // ========================================================
    // DATE RANGE
    // ========================================================

    const start =
      new Date(
        `${selectedDate}T00:00:00+05:30`,
      );

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 1,
    );

    const query = {
      createdAt: {
        $gte: start,
        $lt: end,
      },
    };

    if (mmuName) {
      query.mmu_name =
        mmuName;
    }

    // ========================================================
    // MONTH
    // ========================================================

    const monthStart =
      new Date(
        `${selectedDate.slice(
          0,
          7,
        )}-01T00:00:00+05:30`,
      );

    // ========================================================
    // AUDITS
    // ========================================================

    const audits =
      await MedicineAudit.find(
        query,
      )
        .sort({
          createdAt: -1,
        })
        .limit(1)
        .lean();

    if (
      !audits.length
    ) {
      return NextResponse.json(
        {
          error: `No audits found${
            mmuName
              ? ` for ${mmuName}`
              : ""
          } on ${selectedDate}`,
        },
        {
          status: 404,
        },
      );
    }

    // ========================================================
    // MONTHLY COUNT
    // ========================================================

    const monthlyCount =
      await MedicineAudit.countDocuments(
        {
          createdAt: {
            $gte:
              monthStart,
          },
        },
      );

    const seniorAuditor =
      getSeniorAuditor(
        monthlyCount,
      );

    // ========================================================
    // PDF
    // ========================================================

    const doc =
      new PDFDocument({
        size: "A4",
        layout: "portrait",
        margin: 0,
        autoFirstPage: true,
        bufferPages: true,
      });

    const chunks = [];

    doc.on(
      "data",
      (chunk) => {
        chunks.push(
          chunk,
        );
      },
    );

    const pdfPromise =
      new Promise(
        (
          resolve,
          reject,
        ) => {
          doc.on(
            "end",
            () => {
              resolve(
                Buffer.concat(
                  chunks,
                ),
              );
            },
          );

          doc.on(
            "error",
            reject,
          );
        },
      );

    // ========================================================
    // EACH AUDIT
    // ========================================================

    for (
      let auditIndex = 0;
      auditIndex <
      audits.length;
      auditIndex++
    ) {
      const audit =
        audits[
          auditIndex
        ];

      // ======================================================
      // STOCK
      // ======================================================

      const stockImport =
        await StockImport.findOne(
          {
            audit_id:
              audit._id,
          },
        ).lean();

      const stockMap =
        new Map(
          (
            stockImport?.medicines ||
            []
          ).map(
            (item) => [
              item.drug_code
                ?.trim()
                .toUpperCase(),

              item.application_stock,
            ],
          ),
        );

      // ======================================================
      // MEDICINES
      // ======================================================

      const actualMedicines =
        Array.isArray(
          audit.medicines,
        )
          ? audit.medicines
          : [];

      /*
       * Exactly 170 medicine slots.
       */

      const medicines =
        Array.from(
          {
            length:
              TOTAL_MEDICINES,
          },
          (
            _,
            index,
          ) =>
            actualMedicines[
              index
            ] || {
              drug_code: "",
              medicine_name:
                "",
              physical_quantity:
                "",
            },
        );

      // ======================================================
      // PAGE 1
      // ======================================================

      let y =
        drawReportHeader(
          doc,
          audit,
        );

      y =
        drawTableHeader(
          doc,
          y,
        );

      y =
        drawMedicineRange({
          doc,
          medicines,
          stockMap,
          startIndex:
            PAGE_1_START,
          endIndex:
            PAGE_1_END,
          y,
          allowFooterSpace:
            false,
        });

      // ======================================================
      // PAGE 2
      // ======================================================

      startPage(doc);

      y = MARGIN_TOP;

      y =
        drawMedicineRange({
          doc,
          medicines,
          stockMap,
          startIndex:
            PAGE_2_START,
          endIndex:
            PAGE_2_END,
          y,
          allowFooterSpace:
            false,
        });

      // ======================================================
      // PAGE 3
      // ======================================================

      startPage(doc);

      y = MARGIN_TOP;

      y =
        drawMedicineRange({
          doc,
          medicines,
          stockMap,
          startIndex:
            PAGE_3_START,
          endIndex:
            PAGE_3_END,
          y,
          allowFooterSpace:
            true,
        });

      y += 8;

      y =
        drawAuditorFooter(
          doc,
          y,
          audit,
          seniorAuditor,
        );
    }

    doc.end();

    const pdfBuffer =
      await pdfPromise;

    const safeMmuName = sanitizeFilenamePart(mmuName || "all_mmus");
    const safeDate = formatDateOnly(selectedDate);
    const filename = `${safeDate}_${safeMmuName}_Medicine_Audit_Report.pdf`;

    return new NextResponse(
      pdfBuffer,
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      },
    );
  } catch (error) {
    console.error(
      "Error generating PDF:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}   