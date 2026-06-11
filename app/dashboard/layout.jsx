"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, ClipboardList, Menu, X, Bell, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showHover, setShowHover] = useState(false);
  const [hoverItems, setHoverItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const lastCheckTime = useRef(null);
  const pathnameRef = useRef(pathname);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Medicine Audit",
      href: "/dashboard/medicine_audit",
      icon: ClipboardList,
    },
    {
      name: "Today Report",
      href: "/dashboard/today_report",
      icon: FileSpreadsheet,
    },
  ];

  useEffect(() => {
    pathnameRef.current = pathname;
    if (pathname === "/dashboard") {
      setHasUnread(false);
    }
  }, [pathname]);

  useEffect(() => {
    // Initialize the last check time on mount
    lastCheckTime.current = new Date().toISOString();

    const fetchRecentAudits = async () => {
      try {
        const response = await fetch(`/api/audit/latest?since=${lastCheckTime.current}`);
        if (response.ok) {
          const newAudits = await response.json();
          if (newAudits.length > 0) {
            // Update last check time so we don't fetch these again
            lastCheckTime.current = new Date().toISOString();

            // Create notification objects
            const newNotifs = newAudits.map((audit) => ({
              id: audit._id || Math.random().toString(),
              mmu_name: audit.mmu_name,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }));

            setNotifications((prev) => [...prev, ...newNotifs]);

            // Add green dot on dashboard tab if not currently on dashboard
            if (pathnameRef.current !== "/dashboard") {
              setHasUnread(true);
            }

            // Auto-remove notification toast after 8 seconds
            setTimeout(() => {
              setNotifications((prev) =>
                prev.filter((n) => !newNotifs.find((nn) => nn.id === n.id)),
              );
            }, 8000);
          }
        }
      } catch (error) {
        console.error("Error polling recent audits:", error);
      }
    };

    // Poll silently every 15 seconds to check for new audits
    const interval = setInterval(fetchRecentAudits, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-base sm:text-lg font-bold text-slate-800">
          MMU Panel
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
          {!open && hasUnread && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 xl:w-72 bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl flex-col">
        {/* Logo */}
        <div className="px-6 xl:px-8 py-7 xl:py-8 border-b border-slate-700">
          <h1 className="text-xl xl:text-2xl font-bold tracking-wide">
            MMU Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Audit Management System</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 xl:p-5 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const isTodayReport = item.name === "Today Report";

            const handleMouseEnter = async () => {
              if (isTodayReport) {
                try {
                  const res = await fetch(`/api/audit/today`);
                  if (res.ok) {
                    const data = await res.json();
                    const audits = data.audits ?? [];
                    const items = audits.map((a) => ({
                      id: a._id || Math.random().toString(),
                      mmu_name: a.mmu_name,
                      time: a.time || new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    }));
                    setHoverItems(items);
                    setShowHover(true);
                  }
                } catch (e) {
                  console.error("Error loading today audits", e);
                }
              }
            };
            const handleMouseLeave = () => {
              if (isTodayReport) {
                setShowHover(false);
                setHoverItems([]);
              }
            };

            return (
              <motion.div
                key={item.href}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={item.href}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className={`flex items-center gap-3 xl:gap-4 px-4 xl:px-5 py-3.5 xl:py-4 rounded-2xl transition-all duration-300 group ${
                    active
                      ? "bg-white text-slate-900 shadow-lg"
                      : "hover:bg-slate-700/60 text-slate-200"
                  }`}
                >
                  <Icon
                    size={22}
                    className={active ? "text-slate-900" : "text-slate-300 group-hover:text-white"}
                  />

                  <span className="font-medium tracking-wide">{item.name}</span>
                  {item.name === "Dashboard" && hasUnread && (
                    <span className="ml-auto flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                  )}
                </Link>
                {isTodayReport && showHover && (
                  <div className="absolute left-0  top-full mt-2 w-72 max-h-64 overflow-y-auto rounded-lg bg-white shadow-lg z-50 md:left-64 md:top-0 md:mt-0">
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-slate-800 mb-2">Recent Audits</h4>
                      {hoverItems.length === 0 ? (
                        <p className="text-xs text-slate-500">No recent data</p>
                      ) : (
                        <ul className="space-y-1">
                          {hoverItems.slice(0, 10).map((n) => (
                            <li key={n.id} className="text-xs text-slate-700">
                              <span className="font-medium">{n.mmu_name}</span> – {n.time}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 xl:p-5 border-t border-slate-700">
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Logged in as</p>
            <h3 className="font-semibold mt-1">Admin User</h3>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 left-0 z-50 h-screen w-[min(18rem,calc(100vw-2rem))] bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl lg:hidden"
            >
              <div className="px-5 sm:px-6 py-5 sm:py-6 border-b border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">MMU Dashboard</h1>
                  <p className="text-sm text-slate-400">Audit Management</p>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="p-4 sm:p-5 space-y-3">
                {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              const isTodayReport = item.name === "Today Report";

              const handleMouseEnter = () => {
                if (isTodayReport) {
                  // Use existing notifications as recent data source
                  setHoverItems(notifications.slice().reverse()); // latest first
                  setShowHover(true);
                }
              };
              const handleMouseLeave = () => {
                if (isTodayReport) {
                  setShowHover(false);
                }
              };

              return (
                <motion.div
                  key={item.href}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={item.href}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => {
                      if (isTodayReport) {
                        if (!showHover) {
                          e.preventDefault();
                          handleMouseEnter();
                        }
                        setShowHover(!showHover);
                      }
                    }}
                    onTouchStart={(e) => {
                      if (isTodayReport) {
                        if (!showHover) {
                          e.preventDefault();
                          handleMouseEnter();
                        }
                        setShowHover(!showHover);
                      }
                    }}
                    className={`flex items-center gap-3 xl:gap-4 px-4 xl:px-5 py-3.5 xl:py-4 rounded-2xl transition-all duration-300 group ${
                      active
                        ? "bg-white text-slate-900 shadow-lg"
                        : "hover:bg-slate-700/60 text-slate-200"
                    }`}
                  >
                    <Icon
                      size={22}
                      className={
                        active
                          ? "text-slate-900"
                          : "text-slate-300 group-hover:text-white"
                      }
                    />
                    <span className="font-medium tracking-wide">{item.name}</span>
                    {item.name === "Dashboard" && hasUnread && (
                      <span className="ml-auto flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    )}
                  </Link>
                  {/* Hover panel for Today Report */}
                  {isTodayReport && showHover && (
                    <div className="absolute left-0 top-full mt-2 w-full max-h-64 overflow-y-auto rounded-lg bg-white shadow-lg z-50 sm:left-64 sm:w-72">
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">Recent Audits</h4>
                        {hoverItems.length === 0 ? (
                          <p className="text-xs text-slate-500">No recent data</p>
                        ) : (
                          <ul className="space-y-1">
                            {hoverItems.slice(0, 10).map((n) => (
                              <li key={n.id} className="text-xs text-slate-700">
                                <span className="font-medium">{n.mmu_name}</span> – {n.time}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-h-screen w-full overflow-x-hidden bg-slate-100 pt-16 lg:pt-0 lg:pl-64 xl:pl-72">
        {children}
      </main>

      {/* Real-time Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-60 flex flex-col gap-3">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="flex w-80 items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-center rounded-full bg-emerald-100 p-2.5 text-emerald-600">
                <Bell size={20} className="animate-pulse" />
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-bold text-slate-800">
                  New Audit Submitted
                </h4>
                <p className="mt-1 text-sm text-slate-500 leading-tight">
                  <span className="font-bold text-slate-700">
                    {notif.mmu_name}
                  </span>{" "}
                  just uploaded their data.
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  {notif.time}
                </p>
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) =>
                    prev.filter((n) => n.id !== notif.id),
                  )
                }
                className="shrink-0 text-slate-400 transition hover:text-slate-600 rounded-full hover:bg-slate-100 p-1"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
