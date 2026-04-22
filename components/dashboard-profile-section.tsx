"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FlashBanner } from "@/components/flash-banner";

type Props = {
  initialName: string;
  initialMajor: string | null;
  initialProfileImage: string | null;
};

export function DashboardProfileSection({
  initialName,
  initialMajor,
  initialProfileImage,
}: Props) {
  const router = useRouter();
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [profileSheetEntered, setProfileSheetEntered] = useState(false);
  const [name, setName] = useState(initialName);
  const [major, setMajor] = useState(initialMajor ?? "");
  const [profileImage, setProfileImage] = useState(initialProfileImage ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");

  useEffect(() => {
    if (!profileSheetOpen) {
      setProfileSheetEntered(false);
      return;
    }
    setProfileSheetEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setProfileSheetEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [profileSheetOpen]);

  useEffect(() => {
    if (!profileSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [profileSheetOpen]);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    setMajor(initialMajor ?? "");
  }, [initialMajor]);

  useEffect(() => {
    setProfileImage(initialProfileImage ?? "");
  }, [initialProfileImage]);

  const openProfileSheet = () => {
    setError("");
    setMessage("");
    setUploadNotice("");
    setProfileSheetOpen(true);
  };

  const closeProfileSheet = () => {
    if (saving || uploading) return;
    setProfileSheetOpen(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setMessage("");
    setUploadNotice("");
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Upload failed.");
      return;
    }

    const data = await res.json();
    setProfileImage(data.url);
    setUploadNotice("Photo uploaded — tap Save profile to keep it.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setUploadNotice("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        major: major.trim() || null,
        profileImage: profileImage.trim() || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Could not save profile.");
      return;
    }

    const updated = await res.json();
    if (typeof updated?.name === "string") {
      setName(updated.name);
    }
    setMessage("Profile saved.");
    setProfileSheetOpen(false);
    router.refresh();
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-6">
      <div className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-16 w-16 rounded-bl-2xl rounded-tr-lg border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-bl-2xl rounded-tr-lg border border-dashed border-gray-300 bg-gray-50 text-sm font-semibold text-gray-500">
                  {name.trim() ? name.trim().slice(0, 1).toUpperCase() : "?"}
                </div>
              )}
              <button
                type="button"
                onClick={openProfileSheet}
                className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-bl-md rounded-tr-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Edit profile"
                title="Edit profile"
              >
                ✎
              </button>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{name.trim() || "Your name"}</h2>
              <p className="text-sm text-slate-500">Your profile</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Tap the edit icon or button to update your name, major, and profile photo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openProfileSheet}
            className="rounded-bl-xl rounded-tr-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Edit profile
          </button>
        </div>

        {!profileSheetOpen && error ? (
          <FlashBanner
            variant="error"
            onDismiss={() => setError("")}
            className="mt-3 rounded-lg"
          >
            {error}
          </FlashBanner>
        ) : null}
        {!profileSheetOpen && message ? (
          <FlashBanner
            variant="success"
            onDismiss={() => setMessage("")}
            className="mt-3 rounded-lg"
          >
            {message}
          </FlashBanner>
        ) : null}
      </div>

      {profileSheetOpen ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-edit-sheet-title"
        >
          <button
            type="button"
            className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${
              profileSheetEntered ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeProfileSheet}
            aria-label="Close panel"
          />
          <div
            className={`relative max-h-[min(90dvh,720px)] w-full overflow-y-auto rounded-t-[1.75rem] border border-slate-200 border-b-0 bg-white px-5 pb-8 pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
              profileSheetEntered ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-slate-200" />
            <h3 id="profile-edit-sheet-title" className="text-lg font-semibold text-slate-900">
              Edit profile
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Update your name, major, profile photo URL, or upload a new image.
            </p>

            {uploadNotice ? (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {uploadNotice}
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <form className="mt-4 grid gap-4" onSubmit={handleSave}>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  disabled={saving}
                  autoComplete="name"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none disabled:opacity-60"
                />
              </label>

              <div className="flex flex-col items-start gap-2">
                {profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileImage}
                    alt="Profile preview"
                    className="h-24 w-24 rounded-bl-[2rem] rounded-tr-xl border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-bl-[2rem] rounded-tr-xl border border-dashed border-gray-300 bg-gray-50 text-lg font-semibold text-gray-500">
                    {name.trim() ? name.trim().slice(0, 1).toUpperCase() : "?"}
                  </div>
                )}
                <label className="text-xs text-gray-600">
                  <span className="mb-1 block font-medium text-slate-700">Upload photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading || saving}
                    className="max-w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-800"
                  />
                </label>
                {uploading ? <p className="text-xs text-gray-500">Uploading…</p> : null}
              </div>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Major</span>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none disabled:opacity-60"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Profile photo URL</span>
                <input
                  type="text"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://... or /uploads/..."
                  disabled={saving}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none disabled:opacity-60"
                />
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-bl-xl rounded-tr-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
                <button
                  type="button"
                  disabled={saving || uploading}
                  onClick={closeProfileSheet}
                  className="rounded-bl-xl rounded-tr-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
