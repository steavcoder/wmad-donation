"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DonationReceiptCard } from "@/components/donation-receipt-card";
import { FlashBanner } from "@/components/flash-banner";

type PaymentType = "CASH" | "BANK_TRANSFER" | "ABA" | "ACLEDA" | "WING" | "OTHER";

export type DashboardDonationItem = {
  id: number;
  amount: number;
  status: "PENDING" | "APPROVED";
  paymentType: PaymentType;
  accountNumber: string;
  proofImageUrl: string | null;
  note: string | null;
  createdAt: string;
};

type DashboardDonationHistoryProps = {
  donations: DashboardDonationItem[];
  userName: string;
  userEmail: string;
};

type SheetState = { mode: "edit"; id: number } | { mode: "delete"; id: number } | null;

export function DashboardDonationHistory({
  donations,
  userName,
  userEmail,
}: DashboardDonationHistoryProps) {
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [sheetEntered, setSheetEntered] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("BANK_TRANSFER");
  const [accountNumber, setAccountNumber] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const pendingDonations = donations.filter((d) => d.status === "PENDING");
  const sheetOpen = sheet !== null;
  const sheetDonation =
    sheet !== null ? donations.find((d) => d.id === sheet.id) ?? null : null;

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

  const closeSheet = () => {
    if (busyId !== null) return;
    setSheet(null);
    setFormError("");
  };

  const startEdit = (d: DashboardDonationItem) => {
    setFormError("");
    setSheet({ mode: "edit", id: d.id });
    setAmount(String(d.amount));
    setPaymentType(d.paymentType);
    setAccountNumber(d.accountNumber);
    setProofImageUrl(d.proofImageUrl ?? "");
    setNote(d.note ?? "");
  };

  const startDelete = (d: DashboardDonationItem) => {
    setFormError("");
    setSheet({ mode: "delete", id: d.id });
  };

  const handleProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormError("");
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
      setFormError(data?.error ?? "Image upload failed.");
      return;
    }
    const data = await res.json();
    setProofImageUrl(data.url);
  };

  const saveEdit = async () => {
    if (sheet?.mode !== "edit") return;
    const editingId = sheet.id;
    setFormError("");
    if (!amount || !accountNumber.trim()) {
      setFormError("Amount and account number are required.");
      return;
    }
    setBusyId(editingId);
    const res = await fetch(`/api/donations/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        paymentType,
        accountNumber: accountNumber.trim(),
        proofImageUrl: proofImageUrl.trim() ? proofImageUrl.trim() : null,
        note: note.trim() ? note.trim() : null,
      }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data?.error ?? "Could not update donation.");
      return;
    }
    setSheet(null);
    router.refresh();
  };

  const confirmDelete = async () => {
    if (sheet?.mode !== "delete") return;
    const donationId = sheet.id;
    setFormError("");
    setBusyId(donationId);
    const res = await fetch(`/api/donations/${donationId}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data?.error ?? "Could not delete donation.");
      return;
    }
    setSheet(null);
    router.refresh();
  };

  const sheetTitleId =
    sheet?.mode === "delete" ? "delete-donation-sheet-title" : "edit-donation-sheet-title";

  return (
    <div className="rounded-bl-[3rem] rounded-tr-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Donation History</h2>
      <p className="mt-1 text-sm text-slate-500">
        Approved donations and pending requests.
      </p>
      {pendingDonations.length > 0 ? (
        <div className="mt-4 rounded-bl-2xl rounded-tr-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have {pendingDonations.length} donation request(s) waiting for admin approval.
        </div>
      ) : null}
      {formError && !sheetOpen ? (
        <FlashBanner
          variant="error"
          onDismiss={() => setFormError("")}
          className="mt-3 rounded-lg"
        >
          {formError}
        </FlashBanner>
      ) : null}
      <div className="mt-4">
        {donations.length === 0 ? (
          <p className="text-gray-500">No donations yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {donations.map((donation) => (
              <li key={donation.id} className="flex flex-col gap-2">
                <DonationReceiptCard
                  amount={donation.amount}
                  donorName={userName}
                  donorEmail={userEmail}
                  showDonorAvatar={false}
                  paymentType={donation.paymentType}
                  accountNumber={donation.accountNumber}
                  note={donation.note}
                  createdAt={donation.createdAt}
                  proofImageUrl={donation.proofImageUrl}
                  status={donation.status}
                />
                {donation.status === "PENDING" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => startEdit(donation)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => startDelete(donation)}
                      className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {sheetOpen && sheet ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby={sheetTitleId}
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
            className={`relative max-h-[min(90dvh,640px)] w-full overflow-y-auto rounded-t-[1.75rem] border border-slate-200 border-b-0 bg-white px-5 pb-8 pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
              sheetEntered ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-slate-200" />
            {sheet.mode === "edit" ? (
              <>
                <h3
                  id="edit-donation-sheet-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Edit donation request
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update your pending request before an admin reviews it.
                </p>
                {formError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </p>
                ) : null}
                <div className="mt-4 grid gap-3 text-sm">
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Payment</span>
                    <select
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="ABA">ABA</option>
                      <option value="ACLEDA">ACLEDA</option>
                      <option value="WING">WING</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Account number</span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">
                      Proof image URL (optional)
                    </span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={proofImageUrl}
                      onChange={(e) => setProofImageUrl(e.target.value)}
                    />
                  </label>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Upload proof</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofUpload}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-800"
                    />
                    {uploadingImage ? (
                      <p className="text-xs text-slate-500">Uploading…</p>
                    ) : null}
                  </div>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Note (optional)</span>
                    <textarea
                      className="min-h-[5rem] w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={saveEdit}
                      className="rounded-bl-xl rounded-tr-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busyId !== null ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId !== null}
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
                <h3
                  id="delete-donation-sheet-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Delete donation request?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  This removes your pending request permanently. You can submit a new one anytime.
                </p>
                {sheetDonation ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p>
                      <span className="font-medium text-slate-900">Amount:</span> $
                      {sheetDonation.amount.toFixed(2)}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-slate-900">Payment:</span>{" "}
                      {sheetDonation.paymentType}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(sheetDonation.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ) : null}
                {formError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={confirmDelete}
                    className="rounded-bl-xl rounded-tr-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50"
                  >
                    {busyId !== null ? "Deleting…" : "Delete request"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
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
    </div>
  );
}
