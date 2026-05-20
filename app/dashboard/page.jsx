/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Activity,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [mmuDetails, setMmuDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [downloadType, setDownloadType] = useState("monthly"); // 'monthly', 'dateRange', 'all'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState({ type: "", text: "" });
  const [loginCredentials, setLoginCredentials] = useState({
    userId: "",
    password: "",
  });

  const [filters, setFilters] = useState({
    mmu_name: "",
    month: new Date().toISOString().split("T")[0].slice(0, 7),
    startDate: "",
    endDate: "",
  });

  const [statistics, setStatistics] = useState({
    daily: { mmuAudited: 0, medicineCount: 0, auditCount: 0 },
    monthly: { mmuAudited: 0, medicineCount: 0, auditCount: 0 },
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

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/validate", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data?.success) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Auth validation error:", error);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchStatistics() {
      try {
        const response = await fetch("/api/audit/statistics");
        const statsData = await response.json();

        if (statsData && statsData.success) {
          setStatistics(statsData);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    }

    fetchStatistics();
    // Refresh statistics every 30 seconds
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownload = async () => {
    if (!isLoggedIn) {
      setMessage({
        type: "error",
        text: "Please login first to download reports.",
      });
      return;
    }

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

      const response = await fetch(endpoint, {
        credentials: "include",
      });

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

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginCredentials((prev) => ({ ...prev, [name]: value }));
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/auth/validate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginCredentials),
      });
      const data = await res.json();

      if (data && data.success) {
        setIsLoggedIn(true);
        setLoginMessage({
          type: "success",
          text: "Login successful. You can now download reports.",
        });
      } else {
        setLoginMessage({
          type: "error",
          text: "Invalid credentials. Please use the correct user ID and password.",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginMessage({ type: "error", text: "Login failed. Try again later." });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setLoginCredentials({ userId: "", password: "" });
      setMessage({ type: "", text: "" });
      setLoginMessage({ type: "", text: "" });
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

        {/* Statistics Section - Visible to Everyone */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
        >
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">Today Audits</p>
              <p className="text-2xl font-bold text-slate-800 sm:text-3xl">
                {statistics.daily.auditCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">Monthly Audits</p>
              <p className="text-2xl font-bold text-slate-800 sm:text-3xl">
                {statistics.monthly.auditCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">MMUs (Month)</p>
              <p className="text-2xl font-bold text-slate-800 sm:text-3xl">
                {statistics.monthly.mmuAudited}
              </p>
            </div>
          </div>
        </motion.div>

        {!isLoggedIn ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">
              Login to Access Downloads
            </h2>

            {loginMessage.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 flex items-center gap-3 rounded-xl p-4 ${
                  loginMessage.type === "success"
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {loginMessage.type === "success" ? (
                  <CheckCircle size={20} className="shrink-0" />
                ) : (
                  <AlertCircle size={20} className="shrink-0" />
                )}
                <span className="font-medium">{loginMessage.text}</span>
              </motion.div>
            )}

            <form
              onSubmit={handleLogin}
              autoComplete="off"
              className="grid gap-6"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  User ID
                </label>
                <input
                  type="text"
                  name="userId"
                  autoComplete="off"
                  value={loginCredentials.userId}
                  onChange={handleLoginChange}
                  placeholder="Enter user ID"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={loginCredentials.password}
                  onChange={handleLoginChange}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-8 py-3 text-white shadow-lg transition hover:bg-slate-800"
              >
                Login
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Download Audit Reports
                </h2>
                <p className="text-sm text-slate-500">
                  Use the filters below and click Download Excel.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>

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
        )}
      </motion.div>
    </div>
  );
}
