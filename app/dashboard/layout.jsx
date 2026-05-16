"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, ClipboardList, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
  ];

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-base sm:text-lg font-bold text-slate-800">
          MMU Panel
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 xl:w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl flex-col">
        {/* Logo */}
        <div className="px-6 xl:px-8 py-7 xl:py-8 border-b border-slate-700">
          <h1 className="text-xl xl:text-2xl font-bold tracking-wide">
            MMU Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit Management System
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 xl:p-5 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <motion.div
                key={item.href}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={item.href}
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

                  <span className="font-medium tracking-wide">
                    {item.name}
                  </span>
                </Link>
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
              className="fixed top-0 left-0 z-50 h-screen w-[min(18rem,calc(100vw-2rem))] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl lg:hidden"
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

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-4 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl transition-all duration-300 ${
                        active
                          ? "bg-white text-slate-900"
                          : "hover:bg-slate-700 text-slate-200"
                      }`}
                    >
                      <Icon size={22} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
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
    </>
  );
}
