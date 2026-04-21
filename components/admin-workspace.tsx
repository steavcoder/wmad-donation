"use client";

import { useMemo, useState } from "react";
import { DonationReceiptCard } from "@/components/donation-receipt-card";

type PendingUser = {
  id: number;
  name: string;
  email: string;
};

type MemberUser = {
  id: number;
  name: string;
  email: string;
  profileImage?: string | null;
};

type DonationItem = {
  id: number;
  amount: number;
  paymentType: "CASH" | "BANK_TRANSFER" | "ABA" | "ACLEDA" | "WING" | "OTHER";
  accountNumber: string;
  proofImageUrl: string | null;
  note: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    profileImage?: string | null;
  };
};

type AdminWorkspaceProps = {
  pendingUsers: PendingUser[];
  memberUsers: MemberUser[];
  recentDonations: DonationItem[];
};

export function AdminWorkspace({
  pendingUsers: initialPendingUsers,
  memberUsers,
  recentDonations: initialDonations,
}: AdminWorkspaceProps) {
  const [pendingUsers, setPendingUsers] = useState(initialPendingUsers);
  const [donations, setDonations] = useState(initialDonations);
  const [selectedUserId, setSelectedUserId] = useState(
    memberUsers.length > 0 ? String(memberUsers[0].id) : "",
  );
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<
    "CASH" | "BANK_TRANSFER" | "ABA" | "ACLEDA" | "WING" | "OTHER"
  >("BANK_TRANSFER");
  const [accountNumber, setAccountNumber] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [submittingDonation, setSubmittingDonation] = useState(false);

  const handleProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

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
    setMessage("Image uploaded successfully.");
  };

  const totals = useMemo(() => {
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const monthlyReportMap = new Map<
      string,
      { totalAmount: number; donationCount: number }
    >();

    for (const donation of donations) {
      const date = new Date(donation.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthlyReportMap.get(key);
      if (existing) {
        existing.totalAmount += donation.amount;
        existing.donationCount += 1;
      } else {
        monthlyReportMap.set(key, {
          totalAmount: donation.amount,
          donationCount: 1,
        });
      }
    }

    const monthlyReport = [...monthlyReportMap.entries()]
      .map(([monthKey, value]) => ({
        monthKey,
        ...value,
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    return {
      pendingCount: pendingUsers.length,
      totalDonations: donations.length,
      totalAmount,
      monthlyReport,
    };
  }, [donations, pendingUsers]);

  const handleApprove = async (userId: number) => {
    setError("");
    setMessage("");
    setApprovingId(userId);

    const res = await fetch("/api/admin/approve-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    setApprovingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Could not approve user.");
      return;
    }

    setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
    setMessage("User approved successfully.");
  };

  const handleAddDonation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedUserId || !amount || !paymentType || !accountNumber.trim()) {
      setError("Please fill member, amount, payment type, and account number.");
      return;
    }

    setSubmittingDonation(true);
    const res = await fetch("/api/admin/add-donation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: Number(selectedUserId),
        amount: Number(amount),
        paymentType,
        accountNumber: accountNumber.trim(),
        proofImageUrl: proofImageUrl.trim() ? proofImageUrl.trim() : null,
        note: note.trim() ? note.trim() : null,
      }),
    });

    setSubmittingDonation(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to add donation.");
      return;
    }

    const createdDonation = await res.json();
    const user = memberUsers.find((member) => member.id === Number(selectedUserId));

    if (user) {
      setDonations((prev) => [
        {
          id: createdDonation.id,
          amount: createdDonation.amount,
          paymentType: createdDonation.paymentType,
          accountNumber: createdDonation.accountNumber,
          proofImageUrl: createdDonation.proofImageUrl,
          note: createdDonation.note,
          createdAt: createdDonation.createdAt,
          user: {
            name: user.name,
            email: user.email,
            profileImage: user.profileImage ?? null,
          },
        },
        ...prev,
      ]);
    }

    setAmount("");
    setPaymentType("BANK_TRANSFER");
    setAccountNumber("");
    setProofImageUrl("");
    setNote("");
    setMessage("Donation added successfully.");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-10">
      {message ? (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending Approvals</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totals.pendingCount}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Donation Records</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totals.totalDonations}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tracked Amount</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            ${totals.totalAmount.toFixed(2)}
          </p>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Pending Users</h2>
          <p className="mt-1 text-sm text-gray-500">Approve users so they can log in.</p>
          <div className="mt-4 space-y-2">
            {pendingUsers.length === 0 ? (
              <p className="text-sm text-gray-500">No pending users.</p>
            ) : (
              pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={approvingId === user.id}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {approvingId === user.id ? "Approving..." : "Approve"}
                  </button>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Add Donation</h2>
          <p className="mt-1 text-sm text-gray-500">Record an incoming donation for a member.</p>
          <form className="mt-4 space-y-3" onSubmit={handleAddDonation}>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select member</option>
              {memberUsers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={paymentType}
              onChange={(event) =>
                setPaymentType(
                  event.target.value as
                    | "CASH"
                    | "BANK_TRANSFER"
                    | "ABA"
                    | "ACLEDA"
                    | "WING"
                    | "OTHER",
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Proof image URL (optional, or upload below)"
              value={proofImageUrl}
              onChange={(event) => setProofImageUrl(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">Upload proof image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProofUpload}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {uploadingImage ? (
                <p className="text-xs text-gray-500">Uploading image...</p>
              ) : null}
              {proofImageUrl ? (
                <p className="text-xs text-green-700">Image ready: {proofImageUrl}</p>
              ) : null}
            </div>
            <textarea
              placeholder="Note (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submittingDonation}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submittingDonation ? "Saving..." : "Add Donation"}
            </button>
          </form>
        </article>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Recent Donations</h2>
        <p className="mt-1 text-sm text-gray-500">Latest records added by admins.</p>
        <div className="mt-4">
          {donations.length === 0 ? (
            <p className="text-sm text-gray-500">No donations recorded yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {donations.slice(0, 10).map((donation) => (
                <DonationReceiptCard
                  key={donation.id}
                  amount={donation.amount}
                  donorName={donation.user.name}
                  donorEmail={donation.user.email}
                  donorProfileImage={donation.user.profileImage ?? null}
                  paymentType={donation.paymentType}
                  accountNumber={donation.accountNumber}
                  note={donation.note}
                  createdAt={donation.createdAt}
                  proofImageUrl={donation.proofImageUrl}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Report by Month</h2>
        <p className="mt-1 text-sm text-gray-500">
          Donation count and amount grouped by month.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2">Month</th>
                <th className="py-2">Donation Count</th>
                <th className="py-2">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {totals.monthlyReport.length === 0 ? (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={3}>
                    No monthly data yet.
                  </td>
                </tr>
              ) : (
                totals.monthlyReport.map((row) => (
                  <tr key={row.monthKey} className="border-b border-gray-100">
                    <td className="py-2 text-gray-800">{row.monthKey}</td>
                    <td className="py-2 text-gray-800">{row.donationCount}</td>
                    <td className="py-2 font-medium text-gray-900">
                      ${row.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
