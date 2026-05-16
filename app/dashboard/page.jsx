import Link from "next/link";
import { ClipboardList, LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-5 md:px-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">
            MMU Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            Audit management overview and quick actions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <LayoutDashboard className="text-slate-700 shrink-0" size={24} />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                Dashboard
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-500">
              Select a tab from the left panel to open its work area here.
            </p>
          </div>

          <Link
            href="/dashboard/medicine_audit"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 lg:p-6 transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <ClipboardList className="text-slate-700 shrink-0" size={24} />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                Medicine Audit
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-500">
              Open Medicine Audit to enter MMU details and physical quantities.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
