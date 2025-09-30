import { StatusBadge } from '../StatusBadge';

export default function StatusBadgeExample() {
  const statuses = [
    "ok" as const,
    "pending" as const, 
    "rejected" as const,
    "needs-approval" as const,
    "offline" as const
  ];

  return (
    <div className="p-4 space-y-4 bg-background">
      <h2 className="text-lg font-semibold">Status Badge Examples</h2>
      <div className="flex flex-wrap gap-2">
        {statuses.map(status => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
    </div>
  );
}