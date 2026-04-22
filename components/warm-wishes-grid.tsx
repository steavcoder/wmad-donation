export type WarmWishItem = {
  id: number;
  message: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    major: string | null;
    profileImage: string | null;
  };
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type WarmWishesGridProps = {
  wishes: WarmWishItem[];
  highlightUserId?: number;
  emptyHint?: string;
  renderActions?: (wish: WarmWishItem, isOwn: boolean) => React.ReactNode;
};

export function WarmWishesGrid({
  wishes,
  highlightUserId,
  emptyHint,
  renderActions,
}: WarmWishesGridProps) {
  if (wishes.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-500">
        {emptyHint ??
          "No messages yet. Members can share a few kind words from their dashboard."}
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {wishes.map((w) => {
        const isOwn = highlightUserId !== undefined && w.user.id === highlightUserId;
        return (
          <li
            key={w.id}
            className={`relative overflow-hidden rounded-bl-[2.25rem] rounded-tr-2xl border bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
              isOwn
                ? "border-emerald-300 ring-2 ring-emerald-100"
                : "border-slate-100 hover:border-emerald-100"
            }`}
          >
            {isOwn ? (
              <span className="absolute right-3 top-3 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                You
              </span>
            ) : null}
            <div className="flex items-start gap-3">
              {w.user.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.user.profileImage}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-bl-xl rounded-tr-lg border border-slate-100 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-bl-xl rounded-tr-lg bg-gradient-to-br from-emerald-100 to-sky-100 text-sm font-bold text-emerald-800">
                  {w.user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{w.user.name}</p>
                <p className="text-xs text-slate-500">{w.user.major ?? "Member"}</p>
                <p className="text-xs text-slate-400">{formatTime(w.createdAt)}</p>
              </div>
            </div>
            <p className="mt-4 break-words text-base leading-relaxed text-slate-700">
              {w.message}
            </p>
            {renderActions ? <div className="mt-4">{renderActions(w, isOwn)}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}
