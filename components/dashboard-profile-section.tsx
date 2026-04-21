"use client";

import { useState } from "react";

type Props = {
  initialMajor: string | null;
  initialProfileImage: string | null;
};

export function DashboardProfileSection({
  initialMajor,
  initialProfileImage,
}: Props) {
  const [major, setMajor] = useState(initialMajor ?? "");
  const [profileImage, setProfileImage] = useState(initialProfileImage ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setMessage("");
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
    setMessage("Photo uploaded — click Save profile to keep it.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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

    setMessage("Profile saved.");
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Your profile</h2>
        <p className="mt-1 text-sm text-gray-500">
          Major and profile photo (URL or upload). Donation proof images appear on each donation
          card below when an admin attaches them.
        </p>

        <form className="mt-4 grid gap-4 md:grid-cols-[auto_1fr]" onSubmit={handleSave}>
          <div className="flex flex-col items-start gap-2">
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImage}
                alt="Profile"
                className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
                No photo
              </div>
            )}
            <label className="text-xs text-gray-600">
              <span className="sr-only">Upload profile photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="max-w-[200px] text-xs"
              />
            </label>
            {uploading ? <p className="text-xs text-gray-500">Uploading...</p> : null}
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Major</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Profile photo URL
              </label>
              <input
                type="text"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://... or /uploads/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
