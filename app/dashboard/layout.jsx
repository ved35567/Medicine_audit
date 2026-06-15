"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  BriefcaseMedical,
  ClipboardList,
  Menu,
  X,
  Bell,
  FileSpreadsheet,
  ChevronDown,
  Clock,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentFetched, setRecentFetched] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const lastCheckTime = useRef(null);
  const pathnameRef = useRef(pathname);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Medicine Audit", href: "/dashboard/medicine_audit", icon: ClipboardList },
    { name: "Capture Application Stock", href: "/dashboard/capture_application_stock", icon: FileSpreadsheet },
    { name: "Medicine Audit Reports", href: "/dashboard/medicine_audit_report", icon: BriefcaseMedical },
  ];

  useEffect(() => {
    pathnameRef.current = pathname;
    if (pathname === "/dashboard") setHasUnread(false);
  }, [pathname]);

  useEffect(() => {
    lastCheckTime.current = new Date().toISOString();
    const fetchRecentAudits = async () => {
      try {
        const response = await fetch(`/api/audit/latest?since=${lastCheckTime.current}`);
        if (response.ok) {
          const newAudits = await response.json();
          if (newAudits.length > 0) {
            lastCheckTime.current = new Date().toISOString();
            const newNotifs = newAudits.map((audit) => ({
              id: audit._id || Math.random().toString(),
              mmu_name: audit.mmu_name,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }));
            setNotifications((prev) => [...prev, ...newNotifs]);
            if (pathnameRef.current !== "/dashboard") setHasUnread(true);
            setTimeout(() => {
              setNotifications((prev) =>
                prev.filter((n) => !newNotifs.find((nn) => nn.id === n.id))
              );
            }, 8000);
          }
        }
      } catch (error) {
        console.error("Error polling recent audits:", error);
      }
    };
    const interval = setInterval(fetchRecentAudits, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's audits only once when tab is first opened
  const handleRecentToggle = async () => {
    const opening = !recentOpen;
    setRecentOpen(opening);
    if (opening && !recentFetched) {
      setRecentLoading(true);
      try {
        const res = await fetch(`/api/audit/today`);
        if (res.ok) {
          const data = await res.json();
          const audits = data.audits ?? [];
          setRecentItems(
            audits.map((a) => ({
              id: a._id || Math.random().toString(),
              mmu_name: a.mmu_name,
              time: a.time || new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }))
          );
          setRecentFetched(true);
        }
      } catch (e) {
        console.error("Error loading today audits", e);
      } finally {
        setRecentLoading(false);
      }
    }
  };

  const SidebarContent = ({ onLinkClick }) => (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">MMU Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">Audit Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-3">
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
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group relative ${
                  active
                    ? "bg-white text-slate-900 shadow-md shadow-black/20"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full"
                  />
                )}
                <div className={`shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-slate-100 text-slate-800"
                    : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                }`}>
                  <Icon size={16} />
                </div>
                <span className="font-medium text-sm tracking-wide flex-1">{item.name}</span>
                {item.name === "Dashboard" && hasUnread && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                )}
              </Link>
            </motion.div>
          );
        })}

        {/* ── Recent Audits Expandable Tab ── */}
        <div className="pt-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
            Today
          </p>

          <button
            onClick={handleRecentToggle}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group ${
              recentOpen
                ? "bg-slate-700/70 text-white"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <div className={`shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
              recentOpen
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
            }`}>
              <Activity size={16} />
            </div>
            <span className="font-medium text-sm tracking-wide flex-1 text-left">Recent Audits</span>
            <motion.div
              animate={{ rotate: recentOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={15} className="text-slate-400" />
            </motion.div>
          </button>

          {/* Expandable Panel */}
          <AnimatePresence>
            {recentOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 mx-1 rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-emerald-400" />
                      <span className="text-[11px] font-semibold text-slate-300">
                        {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {!recentLoading && (
                      <span className="text-[10px] text-slate-500">
                        {recentItems.length} audit{recentItems.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Panel Body */}
                  <div className="max-h-52 overflow-y-auto">
                    {recentLoading ? (
                      <div className="py-6 flex flex-col items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-emerald-400 animate-spin" />
                        <p className="text-[11px] text-slate-500">Loading...</p>
                      </div>
                    ) : recentItems.length === 0 ? (
                      <div className="py-6 flex flex-col items-center gap-1.5 text-center px-3">
                        <ClipboardList size={20} className="text-slate-600" />
                        <p className="text-xs font-medium text-slate-500">No audits today</p>
                      </div>
                    ) : (
                      <ul>
                        {recentItems.slice(0, 8).map((item, i) => (
                          <motion.li
                            key={item.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-slate-700/30 last:border-0 hover:bg-slate-700/30 transition-colors"
                          >
                            <div className="h-6 w-6 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-emerald-400">
                                {item.mmu_name?.charAt(0)?.toUpperCase() || "M"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">{item.mmu_name}</p>
                              <p className="text-[10px] text-slate-500">{item.time}</p>
                            </div>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Panel Footer */}
                  {recentItems.length > 0 && (
                    <div className="px-3.5 py-2.5 border-t border-slate-700/50">
                      <Link
                        href="/dashboard/medicine_audit_report"
                        onClick={onLinkClick}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        View full report →
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/60">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/60">
          <div className="h-8 w-8 rounded-full bg-linear-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">Admin User</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile Topbar ── */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <h1 className="text-base font-bold text-slate-800">MMU Panel</h1>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-200"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={open ? "close" : "menu"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </AnimatePresence>
          {!open && hasUnread && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          )}
        </button>
      </div>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 xl:w-72 bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl flex-col">
        <SidebarContent onLinkClick={undefined} />
      </aside>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 z-50 h-screen w-[min(18rem,calc(100vw-3rem))] bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl lg:hidden flex flex-col"
            >
              <SidebarContent onLinkClick={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="min-h-screen w-full overflow-x-hidden bg-slate-100 pt-16 lg:pt-0 lg:pl-64 xl:pl-72">
        {children}
      </main>

      {/* ── Toast Notifications ── */}
      <div className="fixed bottom-4 right-4 z- [60] flex flex-col gap-3 max-w-xs w-full">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }}
              className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl shadow-black/10"
            >
              <div className="shrink-0 h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Bell size={16} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-bold text-slate-800">New Audit Submitted</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  <span className="font-semibold text-slate-700">{notif.mmu_name}</span> just uploaded their data.
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{notif.time}</p>
              </div>
              <button
                onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
                className="shrink-0 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-150"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}