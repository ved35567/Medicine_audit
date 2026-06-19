"use client";

import { useRef, useState } from "react";
import {
  Building2,
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Download,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { mmuData } from "@/data/mmu.js";

const MMU_NAMES = mmuData.map((mmu) => mmu.mmu_name);

function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-600">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span
        className={`text-right text-sm font-semibold text-slate-900 ${
          mono ? "font-mono text-[13px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function CountCard({ label, value, accent = "slate" }) {
  const accentClasses =
    accent === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : accent === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-2xl border p-4 ${accentClasses}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value ?? "-"}
      </p>
    </div>
  );
}

export default function ApplicationStockPage() {
  const [selectedMmu, setSelectedMmu] = useState("");
  const [auditStatus, setAuditStatus] = useState("idle");
  const [auditMessage, setAuditMessage] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const todayDate = new Date().toLocaleDateString("en-CA");
  const canUpload = auditStatus === "success";

  const verifyAudit = async (mmu) => {
    if (!mmu) return;

    setAuditStatus("checking");
    setAuditMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/audit/today");
      const data = await response.json();

      if (response.ok && Array.isArray(data.audits)) {
        const found = data.audits.some(
          (audit) => audit.mmu_name.toLowerCase() === mmu.toLowerCase()
        );

        if (found) {
          setAuditStatus("success");
          setAuditMessage("Physical audit found. You can upload the matching PDF now.");
        } else {
          setAuditStatus("failed");
          setAuditMessage("Physical audit was not found for today.");
        }
      } else {
        setAuditStatus("failed");
        setAuditMessage("Unable to verify today's audit.");
      }
    } catch (error) {
      console.error(error);
      setAuditStatus("failed");
      setAuditMessage("Unable to verify today's audit.");
    }
  };

  const handleMmuChange = (e) => {
    const value = e.target.value;

    setSelectedMmu(value);
    setPdfFile(null);
    setImportSuccess(false);
    setResult(null);
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (value) {
      verifyAudit(value);
    } else {
      setAuditStatus("idle");
      setAuditMessage("");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setErrorMessage("Only PDF files are allowed.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setErrorMessage("");
    setPdfFile(file);
    setImportSuccess(false);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!canUpload) return;
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setErrorMessage("Only PDF files are allowed.");
      return;
    }

    setErrorMessage("");
    setPdfFile(file);
    setImportSuccess(false);
    setResult(null);
  };

  const handleDownload = async () => {
    try {
      const encodedMmu = selectedMmu ? encodeURIComponent(selectedMmu) : "";
      const endpoint = selectedMmu
        ? `/api/audit/today-download?mmu_name=${encodedMmu}`
        : "/api/audit/today-download";

      const response = await fetch(endpoint);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeMmu = (selectedMmu || "MMU").replace(/[^a-zA-Z0-9_-]+/g, "_");

      link.href = url;
      link.download = `${todayDate}_${safeMmu}_Medicine_Audit_Report.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("mmu_name", selectedMmu);

      const response = await fetch("/api/application-stock/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Import failed");
      }

      setResult(data);
      setImportSuccess(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fileSizeLabel = pdfFile ? `${(pdfFile.size / 1024).toFixed(2)} KB` : "-";
  const selectedLabel = selectedMmu || "Select MMU";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-emerald-100 bg-white/95">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-600">
                      Application Stock
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      Capture and import stock reports.
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      Use the guided workflow below to verify the MMU audit and upload the PDF.
                    </p>
                  </div>

                  <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Today
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{todayDate}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        MMU
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                        {selectedLabel}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {canUpload ? "Verified" : auditStatus === "failed" ? "Needs attention" : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <SectionHeader
                  eyebrow="Step 1"
                  title="Select MMU and confirm audit date"
                  description="Start here so the app can verify whether today's physical audit exists before you upload anything."
                  icon={Building2}
                />

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      MMU Name
                    </label>

                    <div className="relative">
                      <select
                        value={selectedMmu}
                        onChange={handleMmuChange}
                        className="w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      >
                        <option value="">Select MMU</option>
                        {MMU_NAMES.map((mmu) => (
                          <option key={mmu} value={mmu}>
                            {mmu}
                          </option>
                        ))}
                      </select>
                      <Building2
                        size={18}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Audit Date
                    </label>

                    <div className="relative">
                      <input
                        value={todayDate}
                        disabled
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm font-medium text-slate-600"
                      />
                      <Calendar
                        size={18}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <SectionHeader
                  eyebrow="Step 2"
                  title="Audit verification"
                  description="The system checks today's audit record for the selected MMU and unlocks the upload area only after a match is found."
                  icon={ShieldCheck}
                />

                <div className="mt-6">
                  {!selectedMmu && (
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
                      <AlertCircle className="mt-0.5 shrink-0 text-slate-400" size={18} />
                      <div>
                        <p className="font-semibold text-slate-800">Select an MMU to continue</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Once you choose an MMU, we'll verify whether the physical audit
                          exists for today.
                        </p>
                      </div>
                    </div>
                  )}

                  {auditStatus === "checking" && (
                    <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
                      <Loader2 className="mt-0.5 shrink-0 animate-spin" size={18} />
                      <div>
                        <p className="font-semibold">Checking today's audit</p>
                        <p className="mt-1 text-sm leading-6 text-blue-700/80">
                          Please wait while we confirm the audit record for {selectedLabel}.
                        </p>
                      </div>
                    </div>
                  )}

                  {auditStatus === "success" && (
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                      <CheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                      <div>
                        <p className="font-semibold">Verified successfully</p>
                        <p className="mt-1 text-sm leading-6 text-emerald-800/80">{auditMessage}</p>
                      </div>
                    </div>
                  )}

                  {auditStatus === "failed" && (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                      <AlertCircle className="mt-0.5 shrink-0 text-rose-600" size={18} />
                      <div>
                        <p className="font-semibold">Verification failed</p>
                        <p className="mt-1 text-sm leading-6 text-rose-800/80">{auditMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={!canUpload ? "opacity-80" : ""}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <SectionHeader
                    eyebrow="Step 3"
                    title="Upload stock PDF"
                    description="Drop the PDF here or browse for a file. The import action becomes available once the audit is verified."
                    icon={Upload}
                  />

                  {canUpload && (
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Ready for upload
                      <ArrowRight size={12} />
                    </div>
                  )}
                </div>

                <label
                  onClick={(e) => {
                    if (!canUpload) {
                      e.preventDefault();
                    }
                  }}
                  onDragOver={(e) => {
                    if (!canUpload) return;
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => {
                    if (canUpload) {
                      setIsDragging(false);
                    }
                  }}
                  onDrop={handleDrop}
                  className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed px-6 py-10 text-center transition-all duration-200 sm:px-10 ${
                    isDragging
                      ? "border-emerald-400 bg-emerald-50"
                      : canUpload
                      ? "border-slate-300 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/70"
                      : "border-slate-200 bg-slate-50"
                  } ${canUpload ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Upload className={canUpload ? "text-emerald-600" : "text-slate-500"} size={26} />
                  </div>

                  <p className="mt-4 text-base font-semibold text-slate-900">
                    Drag and drop your PDF here
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    or click to browse your computer and attach the application stock file.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={!canUpload}
                  />
                </label>

                {pdfFile && (
                  <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
                        <FileText className="text-rose-500" size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{pdfFile.name}</p>
                        <p className="text-sm text-slate-500">{fileSizeLabel}</p>
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      PDF ready
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    disabled={!pdfFile || loading || !canUpload}
                    onClick={handleImport}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Importing
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Import Application Stock
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canUpload}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Browse files
                  </button>
                </div>
              </Card>
            </motion.div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              >
                {errorMessage}
              </motion.div>
            )}
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <SectionHeader
                  eyebrow="Overview"
                  title="Import summary"
                  description="Track the selected MMU, uploaded file, and medicine counts in one place."
                  icon={FileText}
                />

                <div className="mt-6 space-y-3">
                  <SummaryRow label="MMU" value={selectedMmu || "-"} />
                  <SummaryRow label="Date" value={todayDate} mono />
                  <SummaryRow label="File" value={pdfFile?.name || "-"} />
                  <SummaryRow
                    label="Verification"
                    value={
                      auditStatus === "success"
                        ? "Verified"
                        : auditStatus === "failed"
                        ? "Failed"
                        : auditStatus === "checking"
                        ? "Checking"
                        : "Pending"
                    }
                  />
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Medicine counts</p>
                      <p className="mt-1 text-sm text-slate-500">Extracted and matched values.</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <CountCard
                      label="Extracted Medicine Count"
                      value={result?.totalExtracted}
                      accent="emerald"
                    />
                    <CountCard
                      label="Matched Medicine Count"
                      value={result?.totalMatched}
                      accent="amber"
                    />
                  </div>
                </div>

                {importSuccess && result && (
                  <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-emerald-600" />
                      <p className="font-semibold">Import completed successfully</p>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <SummaryRow label="Total Extracted" value={result.totalExtracted} />
                      <SummaryRow label="Total Matched" value={result.totalMatched} />
                      <SummaryRow label="Audit Medicines" value={result.totalAuditMedicines} />
                    </div>

                    <button
                      onClick={handleDownload}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      <Download size={18} />
                      Download Excel Report
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

