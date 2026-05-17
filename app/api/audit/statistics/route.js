import MedicineAudit from "@/models/MedicineAudit";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Daily Statistics
    const dailyAudits = await MedicineAudit.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const dailyMmuCount = new Set(dailyAudits.map((a) => a.mmu_name)).size;
    let dailyMedicineCount = 0;
    dailyAudits.forEach((audit) => {
      audit.medicines.forEach((medicine) => {
        if (medicine.physical_quantity > 0) {
          dailyMedicineCount += medicine.physical_quantity;
        }
      });
    });

    // Monthly Statistics
    const monthlyAudits = await MedicineAudit.find({
      createdAt: { $gte: monthStart, $lt: monthEnd },
    });

    const monthlyMmuCount = new Set(monthlyAudits.map((a) => a.mmu_name)).size;
    let monthlyMedicineCount = 0;
    const medicineDetails = {}; // For detailed breakdown

    monthlyAudits.forEach((audit) => {
      audit.medicines.forEach((medicine) => {
        if (medicine.physical_quantity > 0) {
          monthlyMedicineCount += medicine.physical_quantity;
          if (!medicineDetails[medicine.medicine_name]) {
            medicineDetails[medicine.medicine_name] = 0;
          }
          medicineDetails[medicine.medicine_name] += medicine.physical_quantity;
        }
      });
    });

    return Response.json(
      {
        success: true,
        daily: {
          mmuAudited: dailyMmuCount,
          medicineCount: dailyMedicineCount,
          auditCount: dailyAudits.length,
        },
        monthly: {
          mmuAudited: monthlyMmuCount,
          medicineCount: monthlyMedicineCount,
          auditCount: monthlyAudits.length,
          medicineDetails: medicineDetails,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return Response.json(
      {
        success: false,
        message: "Error fetching statistics",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
