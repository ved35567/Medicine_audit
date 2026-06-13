"use client";

import { useState } from "react";
import { mmuData } from "../../../data/mmu.js";
const MMU_NAMES = mmuData.map((mmu) => mmu.mmu_name);


import {
  Building2,
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";

import { motion } from "framer-motion";

export default function ApplicationStockPage() {
  const [selectedMmu, setSelectedMmu] = useState("");
  const [auditStatus, setAuditStatus] = useState("idle");
  const [auditMessage, setAuditMessage] = useState("");

  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);

  const todayDate = new Date().toLocaleDateString("en-CA");

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
          setAuditMessage("Physical Audit found. You can now upload the PDF.");
        } else {
          setAuditStatus("failed");
          setAuditMessage("Physical Audit not found for today.");
        }
      } else {
        setAuditStatus("failed");
        setAuditMessage("Unable to verify audit.");
      }
    } catch (error) {
      console.error(error);

      setAuditStatus("failed");

      setAuditMessage("Unable to verify audit.");
    }
  };
  const handleMmuChange = (e) => {
    const value = e.target.value;

    setSelectedMmu(value);

    setPdfFile(null);
    setImportSuccess(false);
    setResult(null);
    setErrorMessage("");

    if (value) {
      verifyAudit(value);
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }

    setPdfFile(file);
  };

const handleDownload = async () => {

  try {
    const endpoint = selectedMmu
      ? `/api/audit/today-download?mmu_name=${selectedMmu}`
      : "/api/audit/today-download";

    const response = await fetch(endpoint);

    if (!response.ok) {
      const data = await response.json();

      throw new Error(
        data.error || "Failed to generate report"
      );
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${todayDate}_${selectedMmu}_Medicine_Audit_Report.xlsx`;

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
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800">
            Application Stock Import
          </h1>

          <p className="mt-2 text-slate-500">
            Upload MMSSY stock PDF and generate today's audit report.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audit Details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-6 text-lg font-semibold text-slate-800">
                Audit Information
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                {/* MMU */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    MMU Name
                  </label>

                  <div className="relative">
                    <select
                      value={selectedMmu}
                      onChange={handleMmuChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="absolute right-4 top-4 text-slate-400"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Audit Date
                  </label>

                  <div className="relative">
                    <input
                      value={todayDate}
                      disabled
                      className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-600"
                    />

                    <Calendar
                      size={18}
                      className="absolute right-4 top-4 text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Audit Verification */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Audit Verification
              </h2>

              {!selectedMmu && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <AlertCircle className="text-slate-500" />
                  <span>Select MMU to verify today's audit.</span>
                </div>
              )}

              {auditStatus === "checking" && (
                <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
                  <Loader2 className="animate-spin" />
                  Checking today's audit...
                </div>
              )}

              {auditStatus === "success" && (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                  <CheckCircle />
                  {auditMessage}
                </div>
              )}

              {auditStatus === "failed" && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertCircle />
                  {auditMessage}
                </div>
              )}
            </motion.div>

            {/* Upload Area */}
            {auditStatus === "success" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="mb-4 text-lg font-semibold">Upload Stock PDF</h2>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-10 transition hover:border-blue-500">
                  <Upload size={42} className="mb-3 text-slate-500" />

                  <p className="font-medium">Drag & Drop PDF</p>

                  <p className="mt-1 text-sm text-slate-500">
                    or click to browse
                  </p>

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {pdfFile && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    <FileText className="text-red-500" />

                    <div>
                      <p className="font-medium">{pdfFile.name}</p>

                      <p className="text-sm text-slate-500">
                        {(pdfFile.size / 1024).toFixed(2)}
                        KB
                      </p>
                    </div>
                  </div>
                )}

                <button
                  disabled={!pdfFile || loading}
                  onClick={handleImport}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Import Application Stock
                    </>
                  )}
                </button>
              </motion.div>
            )}
            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-5 text-lg font-semibold">Import Summary</h2>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">MMU:</span> {selectedMmu || "-"}
                </div>

                <div>
                  <span className="font-medium">Date:</span> {todayDate}
                </div>

                <div>
                  <span className="font-medium">File:</span>{" "}
                  {pdfFile?.name || "-"}
                </div>
              </div>

              {importSuccess && result && (
                <>
                  <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                    <CheckCircle className="mb-2" />

                    <p className="font-semibold">
                      Import completed successfully
                    </p>

                    <div className="mt-2 text-sm space-y-1">
                      <p>Total Extracted: {result.totalExtracted}</p>

                      <p>Total Matched: {result.totalMatched}</p>

                      <p>Audit Medicines: {result.totalAuditMedicines}</p>
                    </div>
                  </div>

                  <button onClick={handleDownload} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700">
                    <Download size={18} />
                    Download Excel Report
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
