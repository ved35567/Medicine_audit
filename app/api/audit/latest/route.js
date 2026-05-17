import MedicineAudit from "@/models/MedicineAudit";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    if (!since) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Find audits submitted after the 'since' timestamp
    const recentAudits = await MedicineAudit.find({
      createdAt: { $gt: new Date(since) },
    }).sort({ createdAt: -1 });

    return new Response(JSON.stringify(recentAudits), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching latest audits:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
    });
  }
}
