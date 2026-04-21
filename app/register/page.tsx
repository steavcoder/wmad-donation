"use client";

import Link from "next/link";
import { useState } from "react";
import { BackToHomeLink } from "@/components/back-to-home-link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [major, setMajor] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageHint, setImageHint] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProfileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadingImage(true);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setUploadingImage(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Image upload failed.");
      return;
    }

    const data = await res.json();
    setProfileImageUrl(data.url);
    setImageHint("Photo saved — it will be sent when you submit the form.");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setImageHint("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
        major: major.trim() || null,
        profileImage: profileImageUrl.trim() || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Registration failed.");
      return;
    }

    setSuccess(
      "Account created. Your status is pending — an admin must approve you before you can log in.",
    );
    setName("");
    setEmail("");
    setPassword("");
    setMajor("");
    setProfileImageUrl("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50/40 to-neutral-50 px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <BackToHomeLink variant="text" />
        </div>
        <p className="text-sm font-medium text-emerald-700">New donor</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Register as a member. After an admin approves your account, you can log in and view your
          donations.
        </p>

        <form className="mt-5 space-y-3" onSubmit={handleRegister}>
          <input
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <input
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />
          <input
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            type="text"
            placeholder="Major / field of study (optional)"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            autoComplete="organization-title"
          />
          <input
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            type="text"
            placeholder="Profile image URL (optional)"
            value={profileImageUrl}
            onChange={(e) => setProfileImageUrl(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm text-gray-600">Or upload profile photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileUpload}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-800"
            />
            {uploadingImage ? (
              <p className="text-xs text-gray-500">Uploading...</p>
            ) : null}
            {imageHint ? (
              <p className="text-xs font-medium text-emerald-700">{imageHint}</p>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {success}
          </p>
        ) : null}

        <p className="mt-4 text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
