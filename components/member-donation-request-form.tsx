"use client";

import { useState } from "react";

type PaymentType = "CASH" | "BANK_TRANSFER" | "ABA" | "ACLEDA" | "WING" | "OTHER";

export function MemberDonationRequestForm() {
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("BANK_TRANSFER");
  const [accountNumber, setAccountNumber] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setProofImageUrl(data.url);
    setMessage("Proof image uploaded.");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!amount || !accountNumber.trim()) {
      setError("Please fill amount and account number.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        paymentType,
        accountNumber: accountNumber.trim(),
        proofImageUrl: proofImageUrl.trim() ? proofImageUrl.trim() : null,
        note: note.trim() ? note.trim() : null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Could not submit donation request.");
      return;
    }

    setAmount("");
    setPaymentType("BANK_TRANSFER");
    setAccountNumber("");
    setProofImageUrl("");
    setNote("");
    setMessage("Donation request sent. Waiting for admin approval.");
    window.location.reload();
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-6">
      <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add Donation Request</h2>
        <p className="mt-1 text-sm text-slate-500">
          Submit your donation and admin will approve it before it appears in your history.
        </p>
        {message ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-4 rounded-bl-2xl rounded-tr-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-sm font-semibold text-emerald-700">Scan payment QR</p>
          <p className="mt-1 text-xs text-emerald-800/80">
            Use this QR code to make payment, then submit your receipt proof below.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/qrcode.jpg"
            alt="Payment QR code"
            className="mt-3 h-46 w-36 rounded-bl-2xl rounded-tr-xl border border-emerald-200 bg-white object-cover p-1"
          />
        </div>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={paymentType}
            onChange={(event) => setPaymentType(event.target.value as PaymentType)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="ABA">ABA</option>
            <option value="ACLEDA">ACLEDA</option>
            <option value="WING">WING</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            type="text"
            placeholder="Account Number"
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Proof image URL (optional)"
            value={proofImageUrl}
            onChange={(event) => setProofImageUrl(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-slate-600">Upload proof image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProofUpload}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            {uploadingImage ? <p className="mt-1 text-xs text-slate-500">Uploading image...</p> : null}
          </div>
          <textarea
            placeholder="Note (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-bl-xl rounded-tr-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60 md:col-span-2 md:w-fit"
          >
            {submitting ? "Submitting..." : "Submit for approval"}
          </button>
        </form>
      </article>
    </section>
  );
}
