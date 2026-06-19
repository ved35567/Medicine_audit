"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Building2,
  Activity,
  TrendingUp,
  Download,
  LogOut,
  LogIn,
  Calendar,
  ChevronRight,
  BarChart3,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function StatCard({ icon: Icon, label, value, color, delay }) {
  const colors = {
    blue: { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" },
    emerald: { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
    violet: { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" },
  };
  const c = colors[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex items-center gap-4 group hover:shadow-md transition-shadow duration-300"
    >
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${c.bg} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      <div className={`shrink-0 h-12 w-12 rounded-xl ${c.light} ${c.text} flex items-center justify-center ring-4 ${c.ring}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <motion.p
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold text-slate-800 mt-0.5 tabular-nums"
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}

function TypePill({ value, label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-slate-900 text-white shadow-md"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

export default function Dashboard() {
  const [mmuDetails, setMmuDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [downloadType, setDownloadType] = useState("monthly");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState({ type: "", text: "" });
  const [loginCredentials, setLoginCredentials] = useState({ userId: "", password: "" });
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
    fetch("/api/mmu_details")
      .then((r) => r.json())
      .then((d) => setMmuDetails(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("/api/auth/validate", { method: "GET", credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d?.success) setIsLoggedIn(true); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchStats = () =>
      fetch("/api/audit/statistics")
        .then((r) => r.json())
        .then((d) => { if (d?.success) setStatistics(d); })
        .catch(console.error);
    fetchStats();
    const iv = setInterval(fetchStats, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const handleDownload = async () => {
    if (!isLoggedIn) { setMessage({ type: "error", text: "Please login first." }); return; }
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const q = new URLSearchParams();
      if (filters.mmu_name) q.append("mmu_name", filters.mmu_name);
      let endpoint = "";
      if (downloadType === "monthly") {
        if (!filters.month) { setMessage({ type: "error", text: "Please select a month." }); setLoading(false); return; }
        q.append("month", filters.month);
        endpoint = `/api/audit/monthly-download?${q}`;
      } else if (downloadType === "dateRange") {
        if (!filters.startDate || !filters.endDate) { setMessage({ type: "error", text: "Please select both dates." }); setLoading(false); return; }
        q.append("startDate", filters.startDate);
        q.append("endDate", filters.endDate);
        endpoint = `/api/audit/date-range-download?${q}`;
      } else {
        endpoint = `/api/audit/download${q.toString() ? `?${q}` : ""}`;
      }
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) {
        let msg = `Server error: ${response.status}`;
        try { const e = await response.json(); msg = e.error || e.message || msg; } catch {}
        throw new Error(msg);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medicine_audit_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage({ type: "success", text: "Report downloaded successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Download failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/validate", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginCredentials),
      });
      const data = await res.json();
      if (data?.success) {
        setIsLoggedIn(true);
        setLoginMessage({ type: "success", text: "Logged in successfully." });
      } else {
        setLoginMessage({ type: "error", text: "Invalid credentials." });
      }
    } catch { setLoginMessage({ type: "error", text: "Login failed. Try again." }); }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    setIsLoggedIn(false);
    setLoginCredentials({ userId: "", password: "" });
    setMessage({ type: "", text: "" });
    setLoginMessage({ type: "", text: "" });
  };

  const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-200 px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-1 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Live Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Audit Reports
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600">Live</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Activity} label="Today's Audits" value={statistics.daily.auditCount} color="blue" delay={0.05} />
          <StatCard icon={TrendingUp} label="Monthly Audits" value={statistics.monthly.auditCount} color="emerald" delay={0.1} />
          <StatCard icon={Building2} label="MMUs This Month" value={statistics.monthly.mmuAudited} color="violet" delay={0.15} />
        </div>

        <AnimatePresence mode="wait">
          {!isLoggedIn ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="h-1.5 w-full bg-linear-to-r from-slate-700 via-slate-500 to-slate-700" />
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Lock size={18} className="text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Admin Access</h2>
                    <p className="text-xs text-slate-400">Login to download audit reports</p>
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
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {loginMessage.type === "success"
                        ? <CheckCircle size={16} className="shrink-0" />
                        : <AlertCircle size={16} className="shrink-0" />}
                      {loginMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">User ID</label>
                    <input
                      type="text" name="userId" autoComplete="off"
                      value={loginCredentials.userId}
                      onChange={(e) => setLoginCredentials((p) => ({ ...p, userId: e.target.value }))}
                      placeholder="Enter your user ID"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                    <input
                      type="password" name="password" autoComplete="new-password"
                      value={loginCredentials.password}
                      onChange={(e) => setLoginCredentials((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Enter password"
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-all duration-200 hover:shadow-lg"
                  >
                    <LogIn size={16} />
                    Sign In
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="download"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="h-1.5 w-full bg-linear-to-r from-emerald-400 via-emerald-500 to-teal-500" />

              <div className="p-6 sm:p-8 space-y-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <BarChart3 size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Download Reports</h2>
                      <p className="text-xs text-slate-400">Filter and export audit data as Excel</p>
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

                <AnimatePresence>
                  {message.text && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                        message.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {message.type === "success"
                        ? <CheckCircle size={16} className="shrink-0" />
                        : <AlertCircle size={16} className="shrink-0" />}
                      {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Report Type</label>
                  <div className="flex flex-wrap gap-2">
                    <TypePill value="monthly" label="Monthly" icon={Calendar} active={downloadType === "monthly"} onClick={setDownloadType} />
                    <TypePill value="dateRange" label="Date Range" icon={ChevronRight} active={downloadType === "dateRange"} onClick={setDownloadType} />
                    <TypePill value="all" label="All Data" icon={FileSpreadsheet} active={downloadType === "all"} onClick={setDownloadType} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">MMU Name</label>
                    <select
                      name="mmu_name" value={filters.mmu_name} onChange={handleFilterChange}
                      className={inputCls}
                    >
                      <option value="">All MMUs</option>
                      {mmuDetails.map((m) => (
                        <option key={m.mmu_name} value={m.mmu_name}>{m.mmu_name}</option>
                      ))}
                    </select>
                  </div>

                  <AnimatePresence mode="wait">
                    {downloadType === "monthly" && (
                      <motion.div
                        key="month"
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                      >
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Month</label>
                        <input type="month" name="month" value={filters.month} onChange={handleFilterChange} className={inputCls} />
                      </motion.div>
                    )}

                    {downloadType === "dateRange" && (
                      <motion.div
                        key="range"
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="contents"
                      >
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">End Date</label>
                          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputCls} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-slate-100" />

                <div className="flex justify-end">
                  <button
                    onClick={handleDownload}
                    disabled={loading}
                    className={`relative flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 overflow-hidden ${
                      loading
                        ? "bg-emerald-400 cursor-not-allowed"
                        : "bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5"
                    }`}
                  >
                    {!loading && (
                      <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    )}
                    {loading ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Preparing file...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Download Excel
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
