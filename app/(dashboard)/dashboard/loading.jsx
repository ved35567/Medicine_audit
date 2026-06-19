import PageSkeleton from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      title="Loading Dashboard"
      description="Fetching dashboard content and recent activity."
      variant="dashboard"
    />
  );
}
