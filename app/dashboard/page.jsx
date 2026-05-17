"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  LayoutDashboard,
  Building2,
  Filter,
  Calendar,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [mmuDetails, setMmuDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [downloadType, setDownloadType] = useState("monthly"); // 'monthly', 'dateRange', 'all'

  const [filters, setFilters] = useState({
    mmu_name: "",
    month: new Date().toISOString().split("T")[0].slice(0, 7),
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    async function fetchMmuData() {
      try {
        const response = await fetch("/api/mmu_details");
        const mmuData = await response.json();
        setMmuDetails(Array.isArray(mmuData) ? mmuData : []);
      } catch (error) {
        console.error("Error fetching MMU details:", error);
      }
    }
    fetchMmuData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownload = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let endpoint = "";
      let queryParams = new URLSearchParams();

      if (filters.mmu_name) {
        queryParams.append("mmu_name", filters.mmu_name);
      }

      if (downloadType === "monthly") {
        if (!filters.month) {
          setMessage({ type: "error", text: "Please select a month." });
          setLoading(false);
          return;
        }
        queryParams.append("month", filters.month);
        endpoint = `/api/audit/monthly-download?${queryParams.toString()}`;
      } else if (downloadType === "dateRange") {
        if (!filters.startDate || !filters.endDate) {
          setMessage({
            type: "error",
            text: "Please select both start and end dates.",
          });
          setLoading(false);
          return;
        }
        queryParams.append("startDate", filters.startDate);
        queryParams.append("endDate", filters.endDate);
        endpoint = `/api/audit/date-range-download?${queryParams.toString()}`;
      } else {
        // All Data
        endpoint = `/api/audit/download${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          // Try to extract a specific error message from the backend if available
          const errData = await response.json();
          if (errData.error || errData.message) {
            errorMessage = errData.error || errData.message;
          }
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medicine_audit_report_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({
        type: "success",
        text: "Excel file downloaded successfully!",
      });
    } catch (error) {
      console.error("Error downloading Excel:", error);
      setMessage({
        type: "error",
        text:
          error.message || "Error downloading Excel file. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-4xl"
      >
        <h1 className="mb-6 text-2xl font-bold text-slate-800">
          Dashboard Reports
        </h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">
            Download Audit Reports
          </h2>

          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 flex items-center gap-3 rounded-xl p-4 ${
                message.type === "success"
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={20} className="shrink-0" />
              ) : (
                <AlertCircle size={20} className="shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                MMU Name (Optional)
              </label>
              <select
                name="mmu_name"
                value={filters.mmu_name}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700"
              >
                <option value="">All MMUs</option>
                {mmuDetails.map((mmu) => (
                  <option key={mmu.mmu_name} value={mmu.mmu_name}>
                    {mmu.mmu_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Download Type
              </label>
              <select
                value={downloadType}
                onChange={(e) => setDownloadType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700"
              >
                <option value="monthly">Month Wise</option>
                <option value="dateRange">Date Range</option>
                <option value="all">All Data</option>
              </select>
            </div>

            {downloadType === "monthly" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Month
                </label>
                <input
                  type="month"
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
            )}

            {downloadType === "dateRange" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleDownload}
              disabled={loading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 sm:w-auto ${
                loading
                  ? "cursor-not-allowed bg-green-500"
                  : "bg-green-600 hover:bg-green-700 hover:shadow-xl"
              }`}
            >
              <FileSpreadsheet
                size={18}
                className={loading ? "animate-pulse" : ""}
              />
              {loading ? "Downloading..." : "Download Excel"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
