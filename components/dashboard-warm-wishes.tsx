"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FlashBanner } from "@/components/flash-banner";
import { WarmWishesGrid, type WarmWishItem } from "@/components/warm-wishes-grid";

const MAX = 280;

const QUICK_EMOJI = ["💛", "✨", "🌈", "🫶", "🙏", "❤️", "☀️", "🌟", "🕊️", "😊"];

type Props = {
  initialWishes: WarmWishItem[];
  currentUserId: number;
};

type WishSheetState = { mode: "edit"; id: number } | { mode: "delete"; id: number } | null;

export function DashboardWarmWishes({ initialWishes, currentUserId }: Props) {
  const router = useRouter();
  const [wishes, setWishes] = useState(initialWishes);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<WishSheetState>(null);
  const [sheetEntered, setSheetEntered] = useState(false);
  const [sheetBusyId, setSheetBusyId] = useState<number | null>(null);
  const [sheetFormError, setSheetFormError] = useState("");
  const [editText, setEditText] = useState("");

  useEffect(() => {
    setWishes(initialWishes);
  }, [initialWishes]);

  const sheetOpen = sheet !== null;
  const activeWish = sheet ? wishes.find((w) => w.id === sheet.id) ?? null : null;

  useEffect(() => {
    if (!sheetOpen) {
      setSheetEntered(false);
      return;
    }
    setSheetEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [sheetOpen, sheet?.mode, sheet?.id]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const appendEmoji = (emoji: string) => {
    setText((prev) => {
      const next = `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${emoji}`;
      return next.slice(0, MAX);
    });
  };

  const closeSheet = () => {
    if (sheetBusyId !== null) return;
    setSheet(null);
    setSheetFormError("");
  };

  const startEdit = (wish: WarmWishItem) => {
    setSheetFormError("");
    setEditText(wish.message);
    setSheet({ mode: "edit", id: wish.id });
  };

  const startDelete = (wish: WarmWishItem) => {
    setSheetFormError("");
    setSheet({ mode: "delete", id: wish.id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Add a short message or tap an emoji to start.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/warm-wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Could not post your note.");
      return;
    }
    const created = (await res.json()) as WarmWishItem;
    setWishes((prev) => [created, ...prev].slice(0, 48));
    setText("");
    setMessage("Your message is live on the home page cheer wall—thank you!");
    router.refresh();
  };

  const saveEdit = async () => {
    if (sheet?.mode !== "edit") return;
    const editingId = sheet.id;
    const nextMessage = editText.trim();
    setSheetFormError("");
    if (!nextMessage) {
      setSheetFormError("Write something before saving.");
      return;
    }
    setSheetBusyId(editingId);
    const res = await fetch(`/api/warm-wishes/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: nextMessage }),
    });
    setSheetBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSheetFormError(data?.error ?? "Could not update post.");
      return;
    }
    const updated = (await res.json()) as WarmWishItem;
    setWishes((prev) => prev.map((w) => (w.id === editingId ? updated : w)));
    setSheet(null);
    setSheetFormError("");
    setMessage("Post updated.");
    router.refresh();
  };

  const confirmDelete = async () => {
    if (sheet?.mode !== "delete") return;
    const deleteId = sheet.id;
    setSheetFormError("");
    setSheetBusyId(deleteId);
    const res = await fetch(`/api/warm-wishes/${deleteId}`, { method: "DELETE" });
    setSheetBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSheetFormError(data?.error ?? "Could not delete post.");
      return;
    }
    setWishes((prev) => prev.filter((w) => w.id !== deleteId));
    setSheet(null);
    setSheetFormError("");
    setMessage("Post deleted.");
    router.refresh();
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-6">
      <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
          Cheer wall
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Share love for the kids</h2>
        <p className="mt-1 text-sm text-slate-500">
          Post a emoji, a short phrase, or both—your note appears on the public home page under{" "}
          <strong className="font-medium text-slate-700">Our donors</strong> so visitors see our
          community&apos;s heart.
        </p>

        {message ? (
          <FlashBanner
            variant="success"
            onDismiss={() => setMessage("")}
            className="mt-4 rounded-xl"
          >
            {message}
          </FlashBanner>
        ) : null}
        {error ? (
          <FlashBanner variant="error" onDismiss={() => setError("")} className="mt-4 rounded-xl">
            {error}
          </FlashBanner>
        ) : null}

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="warm-wish-text" className="sr-only">
              Your message
            </label>
            <textarea
              id="warm-wish-text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX))}
              placeholder="e.g. Stay strong little ones — you’ve got a whole community behind you! 🌈"
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {text.length}/{MAX}
              </span>
              <span className="text-slate-400">Visible to everyone on the website</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">Quick emoji</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => appendEmoji(emoji)}
                  disabled={submitting || text.length >= MAX}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
                  aria-label={`Add ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-bl-xl rounded-tr-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post to cheer wall"}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-sm font-semibold text-slate-900">Latest from members</h3>
          <p className="mt-0.5 text-xs text-slate-500">Newest first — same feed as the home page.</p>
          <div className="mt-4">
            <WarmWishesGrid
              wishes={wishes}
              highlightUserId={currentUserId}
              renderActions={(wish, isOwn) =>
                isOwn ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={sheetBusyId !== null}
                      onClick={() => startEdit(wish)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={sheetBusyId !== null}
                      onClick={() => startDelete(wish)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                ) : null
              }
            />
          </div>
        </div>
      </article>

      {sheetOpen && sheet ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby={sheet.mode === "delete" ? "delete-wish-sheet-title" : "edit-wish-sheet-title"}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${
              sheetEntered ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeSheet}
            aria-label="Close panel"
          />
          <div
            className={`relative max-h-[min(90dvh,560px)] w-full overflow-y-auto rounded-t-[1.75rem] border border-slate-200 border-b-0 bg-white px-5 pb-8 pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
              sheetEntered ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-slate-200" />
            {sheet.mode === "edit" ? (
              <>
                <h3 id="edit-wish-sheet-title" className="text-lg font-semibold text-slate-900">
                  Edit your post
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update your message so it still reflects how you feel today.
                </p>
                {sheetFormError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {sheetFormError}
                  </p>
                ) : null}
                <div className="mt-4 grid gap-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value.slice(0, MAX))}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-xs text-slate-500">
                    {editText.length}/{MAX}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      disabled={sheetBusyId !== null}
                      onClick={saveEdit}
                      className="rounded-bl-xl rounded-tr-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {sheetBusyId !== null ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      disabled={sheetBusyId !== null}
                      onClick={closeSheet}
                      className="rounded-bl-xl rounded-tr-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 id="delete-wish-sheet-title" className="text-lg font-semibold text-slate-900">
                  Delete your post?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  This removes your message from the dashboard and public cheer wall.
                </p>
                {activeWish ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {activeWish.message}
                  </div>
                ) : null}
                {sheetFormError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {sheetFormError}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={sheetBusyId !== null}
                    onClick={confirmDelete}
                    className="rounded-bl-xl rounded-tr-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50"
                  >
                    {sheetBusyId !== null ? "Deleting…" : "Delete post"}
                  </button>
                  <button
                    type="button"
                    disabled={sheetBusyId !== null}
                    onClick={closeSheet}
                    className="rounded-bl-xl rounded-tr-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
