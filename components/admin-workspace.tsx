"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
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

type PendingDonationItem = {
  id: number;
  amount: number;
  paymentType: "CASH" | "BANK_TRANSFER" | "ABA" | "ACLEDA" | "WING" | "OTHER";
  accountNumber: string;
  proofImageUrl: string | null;
  note: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    profileImage?: string | null;
  };
};

type AdminWorkspaceProps = {
  pendingUsers: PendingUser[];
  pendingDonations: PendingDonationItem[];
  memberUsers: MemberUser[];
  recentDonations: DonationItem[];
};

type AdminPanel = "overview" | "pendingUsers" | "pendingDonations" | "add" | "recent" | "monthly";

export function AdminWorkspace({
  pendingUsers: initialPendingUsers,
  pendingDonations: initialPendingDonations,
  memberUsers,
  recentDonations: initialDonations,
}: AdminWorkspaceProps) {
  const [activePanel, setActivePanel] = useState<AdminPanel>("overview");
  const [pendingUsers, setPendingUsers] = useState(initialPendingUsers);
  const [pendingDonations, setPendingDonations] = useState(initialPendingDonations);
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
  const [approvingDonationId, setApprovingDonationId] = useState<number | null>(null);
  const [submittingDonation, setSubmittingDonation] = useState(false);

  const handleProofUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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
      pendingDonationCount: pendingDonations.length,
      totalDonations: donations.length,
      totalAmount,
      monthlyReport,
    };
  }, [donations, pendingDonations, pendingUsers]);

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

  const handleApproveDonation = async (donationId: number) => {
    setError("");
    setMessage("");
    setApprovingDonationId(donationId);

    const res = await fetch("/api/admin/approve-donation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donationId }),
    });

    setApprovingDonationId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Could not approve donation.");
      return;
    }

    const approved = pendingDonations.find((item) => item.id === donationId);
    if (approved) {
      setDonations((prev) => [
        {
          id: approved.id,
          amount: approved.amount,
          paymentType: approved.paymentType,
          accountNumber: approved.accountNumber,
          proofImageUrl: approved.proofImageUrl,
          note: approved.note,
          createdAt: approved.createdAt,
          user: {
            name: approved.user.name,
            email: approved.user.email,
            profileImage: approved.user.profileImage ?? null,
          },
        },
        ...prev,
      ]);
    }
    setPendingDonations((prev) => prev.filter((item) => item.id !== donationId));
    setMessage("Donation approved successfully.");
  };

  const handleAddDonation = async (event: FormEvent<HTMLFormElement>) => {
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
    <div className="mx-auto w-full max-w-7xl px-6 pb-10">
      {message ? (
        <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Admin Sections
          </p>
          <nav className="space-y-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "pendingUsers", label: "Pending Users" },
              { id: "pendingDonations", label: "Pending Donations" },
              { id: "add", label: "Add Donation" },
              { id: "recent", label: "Recent Donations" },
              { id: "monthly", label: "Monthly Report" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePanel(item.id as AdminPanel)}
                className={`w-full rounded-bl-xl rounded-tr-lg px-3 py-2 text-left text-sm font-medium transition ${
                  activePanel === item.id
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div>
      <section
        className={`grid gap-4 md:grid-cols-3 ${
          activePanel === "overview" ? "" : "hidden"
        }`}
      >
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl bg-emerald-500 p-5 text-white shadow-lg shadow-emerald-500/25">
          <p className="text-sm text-emerald-100">Pending Approvals</p>
          <p className="mt-2 text-3xl font-bold">{totals.pendingCount}</p>
          <p className="mt-2 text-xs text-emerald-100">Accounts awaiting activation</p>
        </article>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Donations</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totals.pendingDonationCount}</p>
          <p className="mt-2 text-xs text-slate-500">Awaiting admin approval</p>
        </article>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Donation Records</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totals.totalDonations}</p>
          <p className="mt-2 text-xs text-slate-500">Total entries in the system</p>
        </article>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Tracked Amount</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            ${totals.totalAmount.toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Accumulated value</p>
        </article>
      </section>

      <section
        className={`mt-6 grid gap-6 lg:grid-cols-2 ${
          activePanel === "overview" ? "" : "hidden"
        }`}
      >
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pending Users</h2>
          <p className="mt-1 text-sm text-slate-500">Approve users so they can log in.</p>
          <div className="mt-4 space-y-2">
            {pendingUsers.length === 0 ? (
              <p className="text-sm text-slate-500">No pending users.</p>
            ) : (
              pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-bl-xl rounded-tr-lg border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={approvingId === user.id}
                    className="rounded-bl-xl rounded-tr-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {approvingId === user.id ? "Approving..." : "Approve"}
                  </button>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pending Donation Requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Approve member-submitted donations so they appear in records.
          </p>
          <div className="mt-4 space-y-2">
            {pendingDonations.length === 0 ? (
              <p className="text-sm text-slate-500">No pending donation requests.</p>
            ) : (
              pendingDonations.slice(0, 5).map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between rounded-bl-xl rounded-tr-lg border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {donation.user.name} - ${donation.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {donation.paymentType} / {new Date(donation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApproveDonation(donation.id)}
                    disabled={approvingDonationId === donation.id}
                    className="rounded-bl-xl rounded-tr-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {approvingDonationId === donation.id ? "Approving..." : "Approve"}
                  </button>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section
        className={`mt-6 ${
          activePanel === "pendingUsers" ? "" : "hidden"
        }`}
      >
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pending Users</h2>
          <p className="mt-1 text-sm text-slate-500">Approve users so they can log in.</p>
          <div className="mt-4 space-y-2">
            {pendingUsers.length === 0 ? (
              <p className="text-sm text-slate-500">No pending users.</p>
            ) : (
              pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-bl-xl rounded-tr-lg border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={approvingId === user.id}
                    className="rounded-bl-xl rounded-tr-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {approvingId === user.id ? "Approving..." : "Approve"}
                  </button>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className={`mt-6 ${activePanel === "pendingDonations" ? "" : "hidden"}`}>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pending Donation Requests</h2>
          <p className="mt-1 text-sm text-slate-500">Requests submitted by members.</p>
          <div className="mt-4">
            {pendingDonations.length === 0 ? (
              <p className="text-sm text-slate-500">No pending donation requests.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pendingDonations.map((donation) => (
                  <li key={donation.id} className="space-y-2">
                    <DonationReceiptCard
                      amount={donation.amount}
                      donorName={donation.user.name}
                      donorEmail={donation.user.email}
                      donorProfileImage={donation.user.profileImage ?? null}
                      paymentType={donation.paymentType}
                      accountNumber={donation.accountNumber}
                      note={donation.note}
                      createdAt={donation.createdAt}
                      proofImageUrl={donation.proofImageUrl}
                      status="PENDING"
                    />
                    <button
                      onClick={() => handleApproveDonation(donation.id)}
                      disabled={approvingDonationId === donation.id}
                      className="w-full rounded-bl-xl rounded-tr-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
                    >
                      {approvingDonationId === donation.id ? "Approving..." : "Approve Donation"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>

      <section className={`mt-6 ${activePanel === "add" ? "" : "hidden"}`}>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add Donation</h2>
          <p className="mt-1 text-sm text-slate-500">Record an incoming donation for a member.</p>
          <form className="mt-4 space-y-3" onSubmit={handleAddDonation}>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
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
              placeholder="Proof image URL (optional, or upload below)"
              value={proofImageUrl}
              onChange={(event) => setProofImageUrl(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="space-y-2">
              <label className="block text-sm text-slate-600">Upload proof image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProofUpload}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              {uploadingImage ? (
                <p className="text-xs text-slate-500">Uploading image...</p>
              ) : null}
              {proofImageUrl ? (
                <p className="text-xs text-emerald-700">Image ready: {proofImageUrl}</p>
              ) : null}
            </div>
            <textarea
              placeholder="Note (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submittingDonation}
              className="rounded-bl-xl rounded-tr-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {submittingDonation ? "Saving..." : "Add Donation"}
            </button>
          </form>
        </article>
      </section>

      <section
        className={`mt-6 rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm ${
          activePanel === "overview" || activePanel === "recent" ? "" : "hidden"
        }`}
      >
        <h2 className="text-lg font-semibold text-slate-900">Recent Donations</h2>
        <p className="mt-1 text-sm text-slate-500">Latest records added by admins.</p>
        <div className="mt-4">
          {donations.length === 0 ? (
            <p className="text-sm text-slate-500">No donations recorded yet.</p>
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
                  status="APPROVED"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        className={`mt-6 rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm ${
          activePanel === "overview" || activePanel === "monthly" ? "" : "hidden"
        }`}
      >
        <h2 className="text-lg font-semibold text-slate-900">Report by Month</h2>
        <p className="mt-1 text-sm text-slate-500">
          Donation count and amount grouped by month.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">Month</th>
                <th className="py-2">Donation Count</th>
                <th className="py-2">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {totals.monthlyReport.length === 0 ? (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={3}>
                    No monthly data yet.
                  </td>
                </tr>
              ) : (
                totals.monthlyReport.map((row) => (
                  <tr key={row.monthKey} className="border-b border-slate-100">
                    <td className="py-2 text-slate-800">{row.monthKey}</td>
                    <td className="py-2 text-slate-800">{row.donationCount}</td>
                    <td className="py-2 font-medium text-slate-900">
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
      </div>
    </div>
  );
}
