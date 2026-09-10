"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Menu, LayoutDashboard, BriefcaseMedical, ClipboardList, FileSpreadsheet, AlertTriangle } from "lucide-react";
import DashboardSidebar from "@/components/layouts/DashboardSidebar";

const formatAuditTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentFetched, setRecentFetched] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const lastCheckTime = useRef(null);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Medicine Audit Form", href: "/dashboard/medicine_audit", icon: ClipboardList },
    { name: "Capture Application Stock", href: "/dashboard/capture_application_stock", icon: FileSpreadsheet },
    { name: "Medicine Audit Reports", href: "/dashboard/medicine_audit_report", icon: BriefcaseMedical },
    { name: "Excess & Shortage", href: "/dashboard/excess_shortage", icon: AlertTriangle },
  ];

  useEffect(() => {
    lastCheckTime.current = new Date().toISOString();
    const fetchRecentAudits = async () => {
      try {
        const response = await fetch(`/api/audit/latest?since=${lastCheckTime.current}`);
        if (!response.ok) return;

        const newAudits = await response.json();
        if (newAudits.length === 0) return;

        lastCheckTime.current = new Date().toISOString();
        const newNotifs = newAudits.map((audit) => ({
          id: audit._id || Math.random().toString(),
          mmu_name: audit.mmu_name,
          time: formatAuditTime(audit.createdAt),
        }));

        setNotifications((prev) => [...prev, ...newNotifs]);
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => !newNotifs.find((nn) => nn.id === n.id)));
        }, 8000);
      } catch (error) {
        console.error("Error polling recent audits:", error);
      }
    };

    const interval = setInterval(fetchRecentAudits, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRecentToggle = async () => {
    const opening = !recentOpen;
    setRecentOpen(opening);
    if (opening && !recentFetched) {
      setRecentLoading(true);
      try {
        const res = await fetch("/api/audit/today");
        if (res.ok) {
          const data = await res.json();
          const audits = data.audits ?? [];
          setRecentItems(
            audits.map((a) => ({
              id: a._id || Math.random().toString(),
              mmu_name: a.mmu_name,
              time: a.time || formatAuditTime(a.createdAt),
            }))
          );
          setRecentFetched(true);
        }
      } catch (error) {
        console.error("Error loading today audits", error);
      } finally {
        setRecentLoading(false);
      }
    }
  };

  const hasUnread = pathname !== "/dashboard" && notifications.length > 0;

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 z-50 flex w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 ring-1 ring-slate-200/80">
            <Image
              src="/mmu-logo.png"
              alt="MMU Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
              priority
            />
          </div>
          <h1 className="text-base font-bold text-slate-900">MMU Panel</h1>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="relative rounded-xl bg-slate-100 p-2 transition-all duration-200 hover:bg-slate-200"
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

      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 xl:w-72 flex-col bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl shadow-slate-950/30">
        <DashboardSidebar
          onLinkClick={undefined}
          navItems={navItems}
          pathname={pathname}
          recentOpen={recentOpen}
          recentLoading={recentLoading}
          recentItems={recentItems}
          hasUnread={hasUnread}
          handleRecentToggle={handleRecentToggle}
        />
      </aside>

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
              className="fixed left-0 top-0 z-50 flex h-screen w-[min(18rem,calc(100vw-3rem))] flex-col bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl shadow-slate-950/30 lg:hidden"
            >
              <DashboardSidebar
                onLinkClick={() => setOpen(false)}
                navItems={navItems}
                pathname={pathname}
                recentOpen={recentOpen}
                recentLoading={recentLoading}
                recentItems={recentItems}
                hasUnread={hasUnread}
                handleRecentToggle={handleRecentToggle}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.06),transparent_20%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] pt-16 lg:pt-0 lg:pl-64 xl:pl-72">
        {children}
      </main>

      <div className="fixed bottom-4 right-4 z-60 flex flex-col gap-3 max-w-xs w-full">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }}
              className="flex items-start gap-3.5 rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
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
                className="shrink-0 rounded-lg p-1 text-slate-300 transition-all duration-150 hover:bg-slate-100 hover:text-slate-600"
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
