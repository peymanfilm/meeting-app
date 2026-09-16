interface SkeletonProps {
  lines?: number;
  className?: string;
}

export function Skeleton({ lines = 3, className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="skeleton h-8 w-32" />
      <div className="skeleton h-12 w-full" />
      <div className="skeleton h-4 w-24" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-wrapper overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-4 border-b border-gray-50">
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="skeleton h-4 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
