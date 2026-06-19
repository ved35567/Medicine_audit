import PageSkeleton from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      title="Loading Application Stock"
      description="Preparing MMU selection and import workspace."
      variant="report"
    />
  );
}
