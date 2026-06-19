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
} from "lucide-react";
import { motion } from "framer-motion";
import PageSkeleton from "@/components/skeletons/PageSkeleton";

export default function TodayReport() {
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

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const queryParams = new URLSearchParams();
      if (!selectedMmu) {
        setMessage({
          type: "error",
          text: "Please select MMU",
        });

        return;
      }

      if (!selectedDate) {
        setMessage({
          type: "error",
          text: "Please select Date",
        });

        return;
      }

      if (selectedMmu) {
        queryParams.append("mmu_name", selectedMmu);
      }
      if (selectedDate) {
        queryParams.append("date", selectedDate);
      }

      const endpoint =
        `/api/audit/date_wise_download?mmu_name=${encodeURIComponent(selectedMmu)}&date=${selectedDate}`;

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
        `${todayDate}_Medicine_Audit_Report_of_${selectedMmu || "all"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const auditCount = response.headers.get("X-Audit-Count");
      setMessage({
        type: "success",
        text: auditCount
          ? `Downloaded ${auditCount} audit${auditCount === "1" ? "" : "s"} successfully.`
          : "Excel file downloaded successfully.",
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
          text: "Invalid credentials. Please use the correct user ID and password.",
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

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-4xl lg:max-w-5xl"
      >
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              Download medicine audit reports submitted via MMU
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2 shadow-xs">
            <Calendar size={18} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">
              {todayDate}
            </span>
          </div>
        </div>

        {authLoading || mmuLoading ? (
          <PageSkeleton
            title={authLoading ? "Checking Access" : "Loading MMU Options"}
            description={
              authLoading
                ? "Verifying your session before showing report controls."
                : "Preparing the MMU list for report filtering."
            }
            variant="report"
          />
        ) : !isLoggedIn ? (
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
                disabled={loginLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {loginLoading && <Loader2 size={18} className="animate-spin" />}
                {loginLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Download Medicine Audit Reports
                </h2>
                <p className="text-sm text-slate-500">
                  Select an MMU and Date to download Reports.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <LogOut size={16} />
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

            <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
              <div className="sm:col-span-1">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  MMU Name (Optional)
                </label>
              </div>
              <div className="relative sm:col-span-1">
                <select
                  value={selectedMmu}
                  onChange={(e) => setSelectedMmu(e.target.value)}
                  disabled={mmuLoading}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700 bg-white appearance-none"
                >
                  <option value="">
                    {mmuLoading ? "Loading MMUs..." : "All MMUs"}
                  </option>
                  {mmuDetails.map((mmu) => (
                    <option key={mmu.mmu_name} value={mmu.mmu_name}>
                      {mmu.mmu_name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <Building2 size={18} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Audit Date
                </label>

                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-700"
                  />

                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <Calendar size={18} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleDownload}
                disabled={loading}
                className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 ${
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
