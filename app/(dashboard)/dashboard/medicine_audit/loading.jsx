import PageSkeleton from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <PageSkeleton
      title="Loading Medicine Audit"
      description="Fetching medicines and MMU details for the audit form."
      variant="form"
    />
  );
}
