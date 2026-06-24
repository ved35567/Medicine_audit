"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Menu, LayoutDashboard, BriefcaseMedical, ClipboardList, FileSpreadsheet, AlertTriangle } from "lucide-react";
import DashboardSidebar from "@/components/layouts/DashboardSidebar";

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
    { name: "Medicine Audit", href: "/dashboard/medicine_audit", icon: ClipboardList },
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
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
              time: a.time || new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
      <div className="lg:hidden fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 ring-1 ring-slate-200">
            <Image
              src="/mmu-logo.png"
              alt="MMU Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
              priority
            />
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

      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 xl:w-72 bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl flex-col">
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
              className="fixed top-0 left-0 z-50 h-screen w-[min(18rem,calc(100vw-3rem))] bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl lg:hidden flex flex-col"
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

      <main className="min-h-screen w-full overflow-x-hidden bg-slate-100 pt-16 lg:pt-0 lg:pl-64 xl:pl-72">
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
