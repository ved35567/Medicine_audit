import PageSkeleton from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      title="Loading Audit Reports"
      description="Checking access and preparing report controls."
      variant="report"
    />
  );
}
