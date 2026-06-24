"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Building2,
  Calendar,
  Loader2,
  LogOut,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageSkeleton from "@/components/skeletons/PageSkeleton";

export default function ExcessShortageReport() {
  const [mmuDetails, setMmuDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [mmuLoading, setMmuLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState({ type: "", text: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({
    userId: "",
    password: "",
  });

  const [selectedMmu, setSelectedMmu] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("excess"); // 'excess' or 'shortage'

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(todayDate);

  useEffect(() => {
    async function fetchMmuData() {
      setMmuLoading(true);
      try {
        const response = await fetch("/api/mmu_details");
        const mmuData = await response.json();
        setMmuDetails(Array.isArray(mmuData) ? mmuData : []);
      } catch (error) {
        console.error("Error fetching MMU details:", error);
      } finally {
        setMmuLoading(false);
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
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, []);

  const getFilenameFromResponse = (response) => {
    const disposition = response.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/i);
    return filenameMatch?.[1];
  };

  const handleDownload = async () => {
    if (!isLoggedIn) {
      setMessage({
        type: "error",
        text: "Please login first to download reports.",
      });
      return;
    }

    if (!selectedMmu) {
      setMessage({
        type: "error",
        text: "Please select an MMU unit to generate the report.",
      });
      return;
    }

    if (!selectedDate) {
      setMessage({
        type: "error",
        text: "Please select a date.",
      });
      return;
    }

    if (!["excess", "shortage"].includes(selectedStatus)) {
      setMessage({
        type: "error",
        text: "Please select a valid report status.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const endpoint = `/api/audit/excess-shortage-download?mmu_name=${encodeURIComponent(
        selectedMmu
      )}&date=${selectedDate}&status=${selectedStatus}`;

      const response = await fetch(endpoint, {
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.error || errData.message) {
            errorMessage = errData.error || errData.message;
          }
        } catch {}
        if (response.status === 401) {
          setIsLoggedIn(false);
          errorMessage = "Your session expired. Please login again.";
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        getFilenameFromResponse(response) ||
        `medicine_${selectedStatus}_${selectedMmu.replace(/[^\w.-]+/g, "_")}_${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({
        type: "success",
        text: `Successfully downloaded ${selectedStatus} report for ${selectedMmu} on ${selectedDate}.`,
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      setMessage({
        type: "error",
        text: error.message || "Error downloading report. Please try again.",
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
    setLoginLoading(true);

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
        setMessage({ type: "", text: "" });
      } else {
        setLoginMessage({
          type: "error",
          text: "Invalid credentials. Please check your user ID and password.",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginMessage({
        type: "error",
        text: "Login failed. Try again later.",
      });
    } finally {
      setLoginLoading(false);
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

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-4xl lg:max-w-5xl"
      >
        {/* Header section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Excess & Shortage Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              Analyze discrepancies and download physical inventory reports by MMU and Date.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-2xl bg-white border border-slate-200 px-4 py-2 shadow-sm">
            <Calendar size={18} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">{todayDate}</span>
          </div>
        </div>

        {authLoading || mmuLoading ? (
          <PageSkeleton
            title={authLoading ? "Verifying Access" : "Loading MMU Units"}
            description={
              authLoading
                ? "Checking admin validation credentials..."
                : "Fetching active Mobile Medical Units..."
            }
            variant="report"
          />
        ) : !isLoggedIn ? (
          /* Login Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white border border-slate-100 shadow-xl overflow-hidden"
          >
            <div className="h-1.5 w-full bg-linear-to-r from-slate-700 via-slate-500 to-slate-700" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileSpreadsheet size={18} className="text-slate-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Admin Authentication Required</h2>
                  <p className="text-xs text-slate-400">Authenticate to generate auditing spreadsheets</p>
                </div>
              </div>

              <AnimatePresence>
                {loginMessage.text && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mb-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                      loginMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {loginMessage.type === "success" ? (
                      <CheckCircle size={16} className="shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0" />
                    )}
                    {loginMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    User ID
                  </label>
                  <input
                    type="text"
                    name="userId"
                    autoComplete="off"
                    value={loginCredentials.userId}
                    onChange={handleLoginChange}
                    placeholder="Enter your admin ID"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    value={loginCredentials.password}
                    onChange={handleLoginChange}
                    placeholder="Enter your password"
                    required
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-all duration-200 hover:shadow-lg disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>Sign In</>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          /* Report Control Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white border border-slate-100 shadow-xl overflow-hidden"
          >
            {/* Custom Gradient Accent Line based on selected status */}
            <div
              className={`h-1.5 w-full bg-linear-to-r transition-colors duration-500 ${
                selectedStatus === "excess"
                  ? "from-emerald-400 via-emerald-500 to-teal-500"
                  : "from-amber-400 via-orange-500 to-red-500"
              }`}
            />

            <div className="p-6 sm:p-8 space-y-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                      selectedStatus === "excess" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {selectedStatus === "excess" ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Generate Report</h2>
                    <p className="text-xs text-slate-400">Download inventory status differences as an Excel file</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
                >
                  <LogOut size={13} />
                  Logout
                </button>
              </div>

              {/* Status Message */}
              <AnimatePresence mode="wait">
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium border ${
                      message.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle size={18} className="shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Interactive Status Selector Cards */}
              <div>
               
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Select Discrepancy Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Excess Stock Option */}
                  <div
                    onClick={() => {
                      setSelectedStatus("excess");
                      setMessage({ type: "", text: "" });
                    }}
                    className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 select-none ${
                      selectedStatus === "excess"
                        ? "border-emerald-500 bg-emerald-50/20 shadow-md scale-[1.01]"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                    }`}
                  >
                    {selectedStatus === "excess" && (
                      <div className="absolute right-3 top-3 h-5.5 w-5.5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                        <CheckCircle size={13} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                        selectedStatus === "excess" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <TrendingUp size={22} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Excess Stock</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      List medicines where the physical quantity counted is higher than the registered application stock.
                    </p>
                  </div>

                  {/* Shortage Stock Option */}
                  <div
                    onClick={() => {
                      setSelectedStatus("shortage");
                      setMessage({ type: "", text: "" });
                    }}
                    className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 select-none ${
                      selectedStatus === "shortage"
                        ? "border-orange-500 bg-orange-50/20 shadow-md scale-[1.01]"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                    }`}
                  >
                    {selectedStatus === "shortage" && (
                      <div className="absolute right-3 top-3 h-5.5 w-5.5 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                        <CheckCircle size={13} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                        selectedStatus === "shortage" ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <TrendingDown size={22} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Shortage Stock</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      List medicines where the physical quantity counted is lower than the registered application stock.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mobile Medical Unit (MMU) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedMmu}
                      onChange={(e) => {
                        setSelectedMmu(e.target.value);
                        setMessage({ type: "", text: "" });
                      }}
                      disabled={mmuLoading}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700 bg-white appearance-none text-sm text-slate-800"
                    >
                      <option value="">Select MMU Unit</option>
                      {mmuDetails.map((mmu) => (
                        <option key={mmu.mmu_name} value={mmu.mmu_name}>
                          {mmu.mmu_name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <Building2 size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Audit Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      max={todayDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setMessage({ type: "", text: "" });
                      }}
                      required
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700 text-sm text-slate-800"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <Calendar size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Divider */}
              <div className="border-t border-slate-100 pt-2" />

              {/* Download Trigger Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  
                  <span>Fields marked with asterisk (*) are mandatory</span>
                  
                </div>
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className={`relative flex items-center justify-center gap-2.5 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 overflow-hidden ${
                    loading
                      ? "bg-slate-400 cursor-not-allowed"
                      : selectedStatus === "excess"
                      ? "bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5"
                      : "bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5"
                  }`}
                >
                  {!loading && (
                    <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  )}
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Preparing file...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download {selectedStatus === "excess" ? "Excess" : "Shortage"} Excel
                      <ArrowRight size={14} className="ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
