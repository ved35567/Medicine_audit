// services/audit.service.ts

import { connectDB } from "@/lib/db";
import MedicineAudit from "@/models/MedicineAudit";

export interface SearchAuditFilters {
  mmu_name?: string;
  auditor_name?: string;
  doctor_name?: string;
  pharmacist_name?: string;
  vendor_name?: string;
  town?: string;
  phase?: string;
  fromDate?: string;
  toDate?: string;
}

export async function searchAudits(filters: SearchAuditFilters) {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.mmu_name) {
    query["mmu_name"] = {
      $regex: filters.mmu_name,
      $options: "i",
    };
  }

  if (filters.auditor_name) {
    query["auditor_name"] = {
      $regex: filters.auditor_name,
      $options: "i",
    };
  }

  if (filters.doctor_name) {
    query["mmu_doctor_name"] = {
      $regex: filters.doctor_name,
      $options: "i",
    };
  }

  if (filters.pharmacist_name) {
    query["mmu_pharmacist_name"] = {
      $regex: filters.pharmacist_name,
      $options: "i",
    };
  }

  if (filters.vendor_name) {
    query["vendor_name"] = {
      $regex: filters.vendor_name,
      $options: "i",
    };
  }

  if (filters.town) {
    query["town"] = {
      $regex: filters.town,
      $options: "i",
    };
  }

  if (filters.phase) {
    query["phase"] = {
      $regex: filters.phase,
      $options: "i",
    };
  }

  if (filters.fromDate || filters.toDate) {
    const auditDateQuery: { $gte?: Date; $lte?: Date } = {};

    if (filters.fromDate) {
      auditDateQuery.$gte = new Date(filters.fromDate);
    }

    if (filters.toDate) {
      auditDateQuery.$lte = new Date(filters.toDate);
    }

    query["audit_date"] = auditDateQuery;
  }

  const audits = await MedicineAudit.find(query)
    .select({
      medicines: 0, // Don't return medicine list by default
      __v: 0,
    })
    .sort({
      audit_date: -1,
    })
    .limit(20)
    .lean();

  return audits;
}
