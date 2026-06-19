const baseShimmer =
  "relative overflow-hidden rounded-2xl bg-slate-200/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

function SkeletonBlock({ className = "" }) {
  return <div className={`${baseShimmer} ${className}`} />;
}

function SkeletonLine({ className = "" }) {
  return <div className={`h-3 rounded-full bg-slate-200/90 ${className}`} />;
}

function PageHeaderSkeleton() {
  return (
    <div className="mb-8 rounded-4xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <SkeletonBlock className="h-3 w-24 rounded-full bg-emerald-100" />
        <SkeletonBlock className="h-8 w-44 rounded-full" />
      </div>
      <div className="mt-4 grid gap-3">
        <SkeletonLine className="w-2/3" />
        <SkeletonLine className="w-1/2" />
      </div>
    </div>
  );
}

function StatSkeleton({ className = "" }) {
  return (
    <div className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <SkeletonBlock className="h-10 w-10 rounded-2xl bg-slate-100" />
      <div className="mt-4 space-y-3">
        <SkeletonLine className="w-24" />
        <SkeletonBlock className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden rounded-4xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:block">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <SkeletonBlock className="h-12 w-12 rounded-2xl bg-slate-100" />
          <div className="space-y-2">
            <SkeletonLine className="w-28" />
            <SkeletonLine className="w-20" />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
        </div>

        <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <SkeletonLine className="w-24" />
          <div className="mt-4 space-y-2">
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-4/5" />
            <SkeletonLine className="w-3/5" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <PageHeaderSkeleton />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <SkeletonBlock className="h-3 w-32 rounded-full bg-emerald-100" />
              <SkeletonBlock className="mt-4 h-10 w-72 max-w-full rounded-2xl" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
              </div>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <SkeletonLine className="w-40" />
                  <SkeletonLine className="w-64" />
                </div>
                <SkeletonBlock className="h-10 w-28 rounded-xl" />
              </div>
              <div className="mt-6 space-y-3">
                <SkeletonBlock className="h-14" />
                <SkeletonBlock className="h-14" />
                <SkeletonBlock className="h-14" />
                <SkeletonBlock className="h-14" />
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <SkeletonLine className="w-28" />
            <div className="mt-5 space-y-3">
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <SkeletonLine className="w-40" />
              <SkeletonLine className="w-64" />
            </div>
            <SkeletonBlock className="h-10 w-32 rounded-xl" />
          </div>

          <div className="mt-5 grid gap-4">
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <SkeletonBlock className="h-12 w-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <PageHeaderSkeleton />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>

        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <SkeletonLine className="w-36" />
              <SkeletonLine className="w-56" />
            </div>
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SkeletonBlock className="h-12" />
            <SkeletonBlock className="h-12" />
            <SkeletonBlock className="h-12" />
            <SkeletonBlock className="h-12" />
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
            <SkeletonLine className="w-24" />
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <SkeletonLine className="w-24" />
          <SkeletonBlock className="mt-4 h-16 rounded-2xl" />
          <div className="mt-5 space-y-3">
            <SkeletonBlock className="h-12" />
            <SkeletonBlock className="h-12" />
            <SkeletonBlock className="h-12" />
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <SkeletonLine className="w-32" />
          <div className="mt-4 space-y-3">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingSkeleton() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center gap-6 px-4 py-16 sm:px-6 lg:px-8">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <SkeletonBlock className="h-3 w-24 rounded-full bg-emerald-100" />
          <SkeletonBlock className="mt-4 h-12 w-3/4 rounded-2xl" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="w-11/12" />
            <SkeletonLine className="w-5/6" />
            <SkeletonLine className="w-3/4" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <SkeletonBlock className="h-56 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

export default function PageSkeleton({
  title = "Loading...",
  description = "Please wait while we prepare the page.",
  variant = "dashboard",
}) {
  const body =
    variant === "form" ? (
      <FormSkeleton />
    ) : variant === "report" ? (
      <ReportSkeleton />
    ) : variant === "landing" ? (
      <LandingSkeleton />
    ) : (
      <DashboardSkeleton />
    );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>

        <div className="mb-6 flex items-center justify-between rounded-3xl border border-white/60 bg-white/60 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
              Loading
            </p>
            <h2 className="mt-1 text-sm font-semibold text-slate-800">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <div className="hidden h-11 w-11 rounded-2xl bg-white shadow-sm sm:block" />
        </div>

        {body}
      </div>
    </div>
  );
}
