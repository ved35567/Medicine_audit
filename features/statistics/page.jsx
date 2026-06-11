"use client";

import {
  Activity,
  TrendingUp,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Calendar,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function PublicStatistics() {
  const [statistics, setStatistics] = useState({
    daily: { mmuAudited: 0, medicineCount: 0, auditCount: 0 },
    monthly: { mmuAudited: 0, medicineCount: 0, auditCount: 0 },
  });
  const [isFetching, setIsFetching] = useState(true);
  const [refreshTime, setRefreshTime] = useState(new Date());

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
      } finally {
        setIsFetching(false);
      }
    }

    // Fetch immediately
    fetchStatistics();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStatistics();
      setRefreshTime(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg--to-br from-slate-50 to-slate-100 px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800"></div>
        <p className="mt-4 text-lg font-medium text-slate-600">
          Loading statistics...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-3 py-4 sm:px-5 md:px-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-5 w-full max-w-7xl sm:mb-8"
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl lg:text-4xl">
              Medicine Audit Statistics
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Live tracking of Mobile Medical Unit audits
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Last updated</p>
            <p className="text-sm font-medium text-slate-700">
              {refreshTime.toLocaleTimeString("en-IN")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Daily Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto mb-6 w-full max-w-7xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-700 md:text-xl">
          Today Activity
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
          <motion.div
            custom={0}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200"
          >
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Today Audits</p>
              <p className="text-3xl font-bold text-slate-800">
                {statistics.daily.auditCount}
              </p>
            </div>
          </motion.div>

          <motion.div
            custom={1}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200"
          >
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                MMUs Audited (Today)
              </p>
              <p className="text-3xl font-bold text-slate-800">
                {statistics.daily.mmuAudited}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Monthly Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto w-full max-w-7xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-700 md:text-xl">
          This Month Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
          <motion.div
            custom={3}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-green-200"
          >
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Monthly Audits
              </p>
              <p className="text-3xl font-bold text-slate-800">
                {statistics.monthly.auditCount}
              </p>
            </div>
          </motion.div>

          <motion.div
            custom={4}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
          >
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                MMUs Audited (Month)
              </p>
              <p className="text-3xl font-bold text-slate-800">
                {statistics.monthly.mmuAudited}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mx-auto mt-8 w-full max-w-7xl text-center"
      >
        <p className="text-xs text-slate-500">
          Statistics update automatically every 30 seconds • No login required
        </p>
      </motion.div>
    </div>
  );
}
