"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPenLine,
  KeyRound,
  Loader2,
  LogOut,
  Pill,
  Search,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import PageSkeleton from "@/components/skeletons/PageSkeleton";

const requiredFields = [
  "audit_date",
  "mmu_name",
  "town",
  "vehicle_reg_number",
  "apm_name",
  "nodal_officer_name",
  "mmu_doctor_name",
  "mmu_pharmacist_name",
  "vendor_name",
  "phase",
  "auditor_name",
];

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "No date";

export default function UpdatedDetailsPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ userId: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState({ type: "", text: "" });
  const [audits, setAudits] = useState([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [formData, setFormData] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [loadingAuditId, setLoadingAuditId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadAudits = async (auditDate) => {
    if (!auditDate) {
      setAudits([]);
      return;
    }
    setAuditsLoading(true);
    try {
      const response = await fetch(
        `/api/audit/manage?audit_date=${encodeURIComponent(auditDate)}`,
        { credentials: "include" },
      );
      if (response.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load audits.");
      setAudits(data.audits || []);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setAuditsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/update-audit", {
          credentials: "include",
        });
        const data = await response.json();
        setIsLoggedIn(Boolean(data?.success));
      } catch (error) {
        console.error("Auth validation error:", error);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginMessage({ type: "", text: "" });
    try {
      const response = await fetch("/api/auth/update-audit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!data?.success) {
        setLoginMessage({ type: "error", text: "Invalid user ID or password." });
        return;
      }
      setIsLoggedIn(true);
      setCredentials({ userId: "", password: "" });
    } catch {
      setLoginMessage({ type: "error", text: "Login failed. Please try again." });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/update-audit/logout", { method: "POST", credentials: "include" });
    setIsLoggedIn(false);
    setAudits([]);
    setSelectedDate("");
    setSelectedAuditId("");
    setSelectedAudit(null);
    setFormData(null);
    setMessage({ type: "", text: "" });
  };

  const openAudit = async (id) => {
    setLoadingAuditId(id);
    setMessage({ type: "", text: "" });
    try {
      const response = await fetch(`/api/audit/manage?id=${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      if (response.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to open this audit.");
      setSelectedAudit(data.audit);
      setSelectedAuditId(id);
      setFormData({
        ...data.audit,
        audit_date: toDateInputValue(data.audit.audit_date),
        medicines: (data.audit.medicines || []).map((medicine) => ({
          ...medicine,
          physical_quantity: medicine.physical_quantity ?? 0,
          expired_quantity: medicine.expired_quantity ?? 0,
        })),
      });
      setMedicineSearch("");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoadingAuditId("");
    }
  };

  const handleDateChange = async (event) => {
    const nextDate = event.target.value;
    setSelectedDate(nextDate);
    setSelectedAuditId("");
    setSelectedAudit(null);
    setFormData(null);
    setMessage({ type: "", text: "" });
    await loadAudits(nextDate);
  };

  const handleAuditSelection = (event) => {
    const nextAuditId = event.target.value;
    setSelectedAuditId(nextAuditId);
    setSelectedAudit(null);
    setFormData(null);
    setMessage({ type: "", text: "" });
    if (nextAuditId) openAudit(nextAuditId);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleMedicineChange = (index, field, value) => {
    const normalized = value === "" ? "" : Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
    setFormData((current) => ({
      ...current,
      medicines: current.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: normalized } : medicine,
      ),
    }));
  };

  const filteredMedicines = useMemo(() => {
    if (!formData) return [];
    const term = medicineSearch.trim().toLowerCase();
    return formData.medicines
      .map((medicine, index) => ({ medicine, index }))
      .filter(({ medicine }) =>
        !term ||
        medicine.medicine_name.toLowerCase().includes(term) ||
        medicine.drug_code.toLowerCase().includes(term),
      );
  }, [formData, medicineSearch]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData) return;
    const missingField = requiredFields.find((field) => !String(formData[field] || "").trim());
    const invalidMedicine = formData.medicines.find(
      (medicine) =>
        !medicine.drug_code ||
        !medicine.medicine_name ||
        medicine.physical_quantity === "" ||
        medicine.expired_quantity === "" ||
        medicine.physical_quantity < 0 ||
        medicine.expired_quantity < 0,
    );
    if (missingField || invalidMedicine || formData.medicines.length === 0) {
      setMessage({
        type: "error",
        text: missingField
          ? "Please complete every audit detail before updating."
          : "Every medicine needs valid physical and expired quantities.",
      });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await fetch("/api/audit/manage", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAudit._id,
          ...formData,
          medicines: formData.medicines.map((medicine) => ({
            drug_code: medicine.drug_code,
            medicine_name: medicine.medicine_name,
            physical_quantity: Number(medicine.physical_quantity),
            expired_quantity: Number(medicine.expired_quantity),
          })),
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Unable to update audit details.");
      const updatedAudit = data.audit;
      const remainsOnSelectedDate =
        toDateInputValue(updatedAudit.audit_date) === selectedDate;
      setAudits((current) =>
        remainsOnSelectedDate
          ? current.map((audit) =>
              audit._id === updatedAudit._id
                ? { ...audit, ...updatedAudit, audit_date: updatedAudit.audit_date }
                : audit,
            )
          : current.filter((audit) => audit._id !== updatedAudit._id),
      );
      setSelectedAudit(null);
      setSelectedAuditId("");
      setFormData(null);
      setMedicineSearch("");
      setMessage({
        type: "success",
        text: "Audit details updated successfully. Select another MMU to continue.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <PageSkeleton title="Checking Access" description="Verifying admin access to audit updates." variant="form" />;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
          <form onSubmit={handleLogin} className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white"><ShieldCheck size={24} /></div>
            <h1 className="text-2xl font-bold text-slate-900">Update Audit Details</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the dedicated Update Audit Details credentials to view and correct stored medicine audits.</p>
            {loginMessage.text && <Notice {...loginMessage} />}
            <label className="mt-6 block text-sm font-semibold text-slate-700">Update Audit User ID
              <input required name="userId" value={credentials.userId} onChange={(event) => setCredentials((current) => ({ ...current, userId: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-700 focus:ring-4 focus:ring-slate-100" />
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">Password
              <input required type="password" name="password" value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-700 focus:ring-4 focus:ring-slate-100" />
            </label>
            <button disabled={loginLoading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
              {loginLoading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}{loginLoading ? "Signing in..." : "Sign in to update audits"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[96rem]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">Update Audit Details</h1><p className="mt-1 text-sm text-slate-500">Open a saved audit, review its complete stored data, and update it securely.</p></div>
          <button onClick={handleLogout} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"><LogOut size={16} /> Sign out</button>
        </div>

        {message.text && <Notice {...message} />}

        <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-6 sm:p-6">
          <div className="mb-5"><h2 className="text-lg font-bold text-slate-800">Find a saved audit</h2><p className="mt-1 text-sm text-slate-500">First select the audit date, then choose an MMU recorded on that exact date.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Audit Date"><input type="date" value={selectedDate} onChange={handleDateChange} className="audit-edit-field" /></Field>
            <Field label="MMU"><select value={selectedAuditId} onChange={handleAuditSelection} disabled={!selectedDate || auditsLoading || Boolean(loadingAuditId)} className="audit-edit-field bg-white disabled:cursor-not-allowed disabled:bg-slate-100"><option value="">{!selectedDate ? "Select an audit date first" : auditsLoading || loadingAuditId ? "Loading audit..." : audits.length ? "Select MMU" : "No audits found for this date"}</option>{audits.map((audit) => <option key={audit._id} value={audit._id}>{audit.mmu_name} — {audit.town || "No town"}{audit.auditor_name ? ` (${audit.auditor_name})` : ""}</option>)}</select></Field>
          </div>
          {selectedDate && !auditsLoading && <p className="mt-4 text-sm text-slate-500">{audits.length ? `${audits.length} saved audit${audits.length === 1 ? "" : "s"} available for ${formatDate(`${selectedDate}T00:00:00.000Z`)}.` : "No saved audits are available for the selected date."}</p>}
        </section>

        {!formData ? <section className="flex min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center sm:p-8"><div><ClipboardPenLine className="mx-auto text-slate-400" size={42} /><h2 className="mt-4 text-xl font-bold text-slate-700">Select date and MMU</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">The stored audit form will appear only after you choose an audit date and its MMU.</p></div></section> :
            <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
              <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="truncate text-xl font-bold text-slate-800">Audit details for {selectedAudit.mmu_name}</h2><p className="mt-1 truncate text-xs text-slate-500">Audit ID: {selectedAudit._id}</p></div><span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:self-auto"><ShieldCheck size={15} /> Admin protected</span></div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Audit Date"><input required type="date" name="audit_date" value={formData.audit_date} onChange={handleFieldChange} className="audit-edit-field" /></Field>
                <Field label="MMU Name"><input required name="mmu_name" value={formData.mmu_name} onChange={handleFieldChange} className="audit-edit-field" /></Field>
                <Field label="Town"><input required name="town" value={formData.town} onChange={handleFieldChange} className="audit-edit-field" /></Field>
                <Field label="Vehicle Registration Number"><input required name="vehicle_reg_number" value={formData.vehicle_reg_number} onChange={handleFieldChange} className="audit-edit-field uppercase" /></Field>
                <Field label="APM Name"><input required name="apm_name" value={formData.apm_name} onChange={handleFieldChange} className="audit-edit-field" /></Field>
                <Field label="Nodal Officer Name"><input required name="nodal_officer_name" value={formData.nodal_officer_name} onChange={handleFieldChange} className="audit-edit-field" /></Field>
                <Field label="MMU Doctor Name"><input required name="mmu_doctor_name" value={formData.mmu_doctor_name} onChange={handleFieldChange} className="audit-edit-field" /></Field>
                <Field label="MMU Pharmacist Name"><input required name="mmu_pharmacist_name" value={formData.mmu_pharmacist_name} onChange={handleFieldChange} className="audit-edit-field" /></Field>
                <Field label="Vendor Name"><input required name="vendor_name" value={formData.vendor_name} onChange={handleFieldChange} className="audit-edit-field" /></Field>
                <Field label="Phase"><input required name="phase" value={formData.phase} onChange={handleFieldChange} className="audit-edit-field" /></Field>
                <Field label="Auditor Name"><input required name="auditor_name" value={formData.auditor_name} onChange={handleFieldChange} className="audit-edit-field" /></Field>
              </div>
              <div className="mt-8 border-t border-slate-200 pt-7"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-slate-900 p-2 text-white"><Pill size={20} /></div><div><h3 className="text-lg font-bold text-slate-800">Medicine Stock</h3><p className="text-sm text-slate-500">{formData.medicines.length} stored medicine entries</p></div></div><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={medicineSearch} onChange={(event) => setMedicineSearch(event.target.value)} placeholder="Search medicines" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-600 sm:w-64" /></div></div>
                <div className="space-y-3 md:hidden">{filteredMedicines.map(({ medicine, index }) => <article key={`${medicine.drug_code}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Item {index + 1}</p><h4 className="mt-1 break-words font-bold text-slate-800">{medicine.medicine_name}</h4></div><span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{medicine.drug_code}</span></div><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-600">Physical Qty<input aria-label={`Physical quantity for ${medicine.medicine_name}`} type="number" min="0" value={medicine.physical_quantity} onChange={(event) => handleMedicineChange(index, "physical_quantity", event.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-base font-bold text-slate-800 outline-none focus:border-slate-700" /></label><label className="text-xs font-semibold text-slate-600">Expired Qty<input aria-label={`Expired quantity for ${medicine.medicine_name}`} type="number" min="0" value={medicine.expired_quantity} onChange={(event) => handleMedicineChange(index, "expired_quantity", event.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-base font-bold text-slate-800 outline-none focus:border-slate-700" /></label></div></article>)}</div>
                <div className="hidden max-h-[38rem] overflow-auto rounded-2xl border border-slate-200 md:block"><table className="w-full min-w-[42rem] border-collapse text-sm"><thead className="sticky top-0 bg-slate-900 text-left text-white"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Drug Code</th><th className="px-4 py-3">Medicine Name</th><th className="px-4 py-3 text-center">Physical Qty</th><th className="px-4 py-3 text-center">Expired Qty</th></tr></thead><tbody className="divide-y divide-slate-200">{filteredMedicines.map(({ medicine, index }) => <tr key={`${medicine.drug_code}-${index}`} className="hover:bg-slate-50"><td className="px-4 py-3 text-slate-500">{index + 1}</td><td className="px-4 py-3 font-semibold text-slate-700">{medicine.drug_code}</td><td className="px-4 py-3 font-medium text-slate-800">{medicine.medicine_name}</td><td className="px-4 py-2"><input aria-label={`Physical quantity for ${medicine.medicine_name}`} type="number" min="0" value={medicine.physical_quantity} onChange={(event) => handleMedicineChange(index, "physical_quantity", event.target.value)} className="mx-auto block w-24 rounded-lg border border-slate-300 px-2 py-2 text-center outline-none focus:border-slate-700" /></td><td className="px-4 py-2"><input aria-label={`Expired quantity for ${medicine.medicine_name}`} type="number" min="0" value={medicine.expired_quantity} onChange={(event) => handleMedicineChange(index, "expired_quantity", event.target.value)} className="mx-auto block w-24 rounded-lg border border-slate-300 px-2 py-2 text-center outline-none focus:border-slate-700" /></td></tr>)}</tbody></table></div>
              </div>
              <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Last saved: {formatDate(selectedAudit.updatedAt || selectedAudit.createdAt)}</p><button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto">{saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}{saving ? "Updating..." : "Update audit details"}</button></div>
            </motion.form>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="block text-sm font-semibold leading-5 text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Notice({ type, text }) {
  const isError = type === "error";
  return <div className={`mt-5 flex items-start gap-2 rounded-xl border px-3 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{isError ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}<span>{text}</span></div>;
}
