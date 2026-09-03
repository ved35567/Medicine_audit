"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  ChevronDown,
  Clock,
  Activity,
} from "lucide-react";

export default function DashboardSidebar({
  onLinkClick,
  navItems,
  pathname,
  recentOpen,
  recentLoading,
  recentItems,
  hasUnread,
  handleRecentToggle,
}) {
  return (
    <>
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 shadow-lg shadow-emerald-900/20">
            <Image
              src="/mmu-logo.png"
              alt="MMU Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Medicine Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Medicine Audit Management
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>

        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                onClick={onLinkClick}
                className={`group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all duration-200 ${
                  active
                    ? "bg-white text-slate-950 shadow-lg shadow-black/15"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500"
                  />
                )}
                <div
                  className={`shrink-0 rounded-lg p-1.5 transition-all duration-200 ${
                    active
                      ? "bg-slate-100 text-slate-800"
                      : "bg-slate-900/70 text-slate-400 group-hover:bg-slate-800 group-hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span className="flex-1 text-sm font-medium tracking-wide">
                  {item.name}
                </span>
                {item.name === "Dashboard" && hasUnread && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                )}
              </Link>
            </motion.div>
          );
        })}

        <div className="pt-3">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Today
          </p>

          <button
            onClick={handleRecentToggle}
            className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 transition-all duration-200 ${
              recentOpen
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <div
              className={`shrink-0 rounded-lg p-1.5 transition-all duration-200 ${
                recentOpen
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-900/70 text-slate-400 group-hover:bg-slate-800 group-hover:text-white"
              }`}
            >
              <Activity size={16} />
            </div>
            <span className="flex-1 text-left text-sm font-medium tracking-wide">
              Recent Audits
            </span>
            <motion.div
              animate={{ rotate: recentOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={15} className="text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {recentOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mx-1 mt-1.5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-emerald-400" />
                      <span className="text-[11px] font-semibold text-slate-300">
                        {new Date().toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    {!recentLoading && (
                      <span className="text-[10px] text-slate-500">
                        {recentItems.length} audit
                        {recentItems.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="max-h-52 overflow-y-auto">
                    {recentLoading ? (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-emerald-400 animate-spin" />
                        <p className="text-[11px] text-slate-500">Loading...</p>
                      </div>
                    ) : recentItems.length === 0 ? (
                      <div className="flex flex-col items-center gap-1.5 px-3 py-6 text-center">
                        <ClipboardList size={20} className="text-slate-600" />
                        <p className="text-xs font-medium text-slate-500">
                          No audits today
                        </p>
                      </div>
                    ) : (
                      <ul>
                        {recentItems.slice(0, 8).map((item, i) => (
                          <motion.li
                            key={item.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-2.5 border-b border-white/10 px-3.5 py-2.5 transition-colors last:border-0 hover:bg-white/5"
                          >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                              <span className="text-[10px] font-bold text-emerald-400">
                                {item.mmu_name?.charAt(0)?.toUpperCase() || "M"}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-slate-200">
                                {item.mmu_name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {item.time}
                              </p>
                            </div>
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {recentItems.length > 0 && (
                    <div className="border-t border-white/10 px-3.5 py-2.5">
                      <Link
                        href="/dashboard/medicine_audit_report"
                        onClick={onLinkClick}
                        className="text-[11px] font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                      >
                        {"View full report ->"}
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-600 to-slate-700">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="truncate text-sm font-semibold text-white">Admin User</p>
          </div>
          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        </div>
      </div>
    </>
  );
}
