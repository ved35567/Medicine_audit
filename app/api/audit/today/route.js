import mongoose from "mongoose";
import MedicineAudit from "@/models/MedicineAudit";
import { NextResponse } from "next/server";

// Helper to get today's start and end in IST
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
      .map((part) => [part.type, part.value])
  );

  const dateKey = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const start = new Date(`${dateKey}T00:00:00+05:30`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { dateKey, start, end };
};

export async function GET(request) {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const { start, end, dateKey } = getTodayIstRange();

    const audits = await MedicineAudit.find({
      createdAt: { $gte: start, $lt: end },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Return empty array if no audits for today
    if (!audits.length) {
      return NextResponse.json({ date: dateKey, audits: [] }, { status: 200 });
    }

    // Include formatted time string for hover panel (keep original createdAt)
    const formattedAudits = audits.map((a) => ({
      ...a,
      time: new Date(a.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }));

    return NextResponse.json(
      { date: dateKey, audits: formattedAudits },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching today audits:", error);
    return NextResponse.json(
      { error: "Failed to fetch today audits" },
      { status: 500 }
    );
  }
}
