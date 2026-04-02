export function ChatListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex-1 space-y-1 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg px-3 py-3"
        >
          <div
            className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted"
            style={{ animationDelay: `${i * 100}ms` }}
          />
          <div className="flex-1 space-y-2.5">
            <div
              className="h-3 animate-pulse rounded bg-muted"
              style={{
                width: `${55 + (i % 3) * 20}%`,
                animationDelay: `${i * 100 + 50}ms`,
              }}
            />
            <div
              className="h-2.5 animate-pulse rounded bg-muted/60"
              style={{
                width: `${40 + (i % 2) * 30}%`,
                animationDelay: `${i * 100 + 100}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
