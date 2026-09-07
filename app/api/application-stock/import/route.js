import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mongoose from "mongoose";

import MedicineAudit from "@/models/MedicineAudit";
import StockImport from "@/models/MedicineStockItem";

export async function POST(req) {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const formData = await req.formData();

    const pdf = formData.get("pdf");
    const mmu_name = formData.get("mmu_name");

    if (!pdf) {
      return NextResponse.json(
        {
          success: false,
          message: "PDF file is required",
        },
        { status: 400 }
      );
    }

    if (!mmu_name) {
      return NextResponse.json(
        {
          success: false,
          message: "MMU Name is required",
        },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const audit = await MedicineAudit.findOne({
      mmu_name,
      audit_date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (!audit) {
      return NextResponse.json(
        {
          success: false,
          message: "Physical audit not found for today.",
        },
        { status: 400 }
      );
    }

    const existingImport = await StockImport.findOne({
      audit_id: audit._id,
    });

    if (existingImport) {
      return NextResponse.json(
        {
          success: false,
          message: "Application stock already imported.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await pdf.arrayBuffer());

    const parsedPdf = await pdfParse(buffer);

    const pdfText = parsedPdf.text
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ");

    // ===============================
    // MMU Validation
    // ===============================

    if (
      !pdfText.toLowerCase().includes(mmu_name.toLowerCase())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Selected MMU (${mmu_name}) not found in PDF.`,
        },
        { status: 400 }
      );
    }

 // ===============================
// Extract Medicines
// ===============================

const VALID_A_CODES = [
  "D235A",
  "D260A",
  "D285A",
  "D51A",
  "D588A",
  "D63A",
  "D731A",
];

function normalizeDrugCode(rawCode) {
  const code = rawCode.toUpperCase().trim();

  // Preserve only approved amended codes
  for (const validCode of VALID_A_CODES) {
    if (code.startsWith(validCode)) {
      return validCode;
    }
  }

  // Everything else becomes D + digits only
  const match = code.match(/^D\d+/);

  return match ? match[0] : null;
}

const extractedMedicines = [];

const regex =
  /(No\.|Unit|BOTTLE|TUBE|GM|ML|MG)(\d[\d,]*)\s*(D[A-Z0-9]+)/gi;

let match;

while ((match = regex.exec(pdfText)) !== null) {
  const rawCode = match[3];

  const drugCode = normalizeDrugCode(rawCode);

  if (!drugCode) continue;

  extractedMedicines.push({
    drug_code: drugCode,
    application_stock: Number(
      match[2].replace(/,/g, "")
    ),
  });
}

// Remove duplicates
const uniqueMedicines = [];
const seen = new Set();

for (const item of extractedMedicines) {
  if (!seen.has(item.drug_code)) {
    seen.add(item.drug_code);
    uniqueMedicines.push(item);
  }
}

console.log("TOTAL EXTRACTED:", uniqueMedicines.length);
console.log(uniqueMedicines.slice(0, 30));
   // ===============================
// Match With Audit
// ===============================

const auditCodes = new Set(
  audit.medicines.map((item) =>
    String(item.drug_code)
      .trim()
      .toUpperCase()
  )
);

console.log(
  "FIRST 20 AUDIT CODES",
  [...auditCodes].slice(0, 20)
);

console.log(
  "FIRST 20 PDF CODES",
  uniqueMedicines
    .slice(0, 20)
    .map((m) => m.drug_code)
);

const matchedMedicines =
  uniqueMedicines.filter((item) =>
    auditCodes.has(item.drug_code)
  );

console.log(
  "Extracted:",
  uniqueMedicines.length
);

console.log(
  "Matched:",
  matchedMedicines.length
);
    if (matchedMedicines.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No matching medicines found between PDF and Audit.",
        },
        { status: 400 }
      );
    }

    // ===============================
    // Save
    // ===============================

    const stockImport = await StockImport.create({
      audit_id: audit._id,
      medicines: matchedMedicines,
    });

    return NextResponse.json({
      success: true,
      stockImportId: stockImport._id,
      totalExtracted: uniqueMedicines.length,
      totalMatched: matchedMedicines.length,
      totalAuditMedicines: audit.medicines.length,
      message:
        "Application stock imported successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}