"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { DonationReceiptCard } from "@/components/donation-receipt-card";
import { FlashBanner } from "@/components/flash-banner";

type MemberUser = {
  id: number;
  name: string;
  email: string;
  profileImage?: string | null;
};

type MemberManagementRow = {
  id: number;
  name: string;
  email: string;
  major: string | null;
  profileImage: string | null;
  status: "PENDING" | "APPROVED" | "DISABLED";
  createdAt: string;
};

type PaymentType = "CASH" | "BANK_TRANSFER" | "ABA" | "ACLEDA" | "WING" | "OTHER";

type CatalogDonation = {
  id: number;
  amount: number;
  status: "PENDING" | "APPROVED";
  paymentType: PaymentType;
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
  allDonations: CatalogDonation[];
  memberManagementList: MemberManagementRow[];
  memberUsers: MemberUser[];
};

type AdminPanel =
  | "overview"
  | "pendingDonations"
  | "donationManagement"
  | "memberManagement"
  | "add"
  | "recent"
  | "monthly";

type DonationMgmtSheet =
  | { mode: "edit"; id: number }
  | { mode: "delete"; id: number }
  | null;

const MEMBER_STATUS_SORT: Record<MemberManagementRow["status"], number> = {
  PENDING: 0,
  DISABLED: 1,
  APPROVED: 2,
};

export function AdminWorkspace({
  allDonations: initialAllDonations,
  memberManagementList: initialMemberManagementList,
  memberUsers,
}: AdminWorkspaceProps) {
  const [activePanel, setActivePanel] = useState<AdminPanel>("overview");
  const [donationCatalog, setDonationCatalog] = useState(initialAllDonations);
  const [members, setMembers] = useState(initialMemberManagementList);

  const pendingDonations = useMemo(
    () => donationCatalog.filter((d) => d.status === "PENDING"),
    [donationCatalog],
  );
  const donations = useMemo(
    () => donationCatalog.filter((d) => d.status === "APPROVED"),
    [donationCatalog],
  );
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
  const [approvingDonationId, setApprovingDonationId] = useState<number | null>(null);
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [memberBusyId, setMemberBusyId] = useState<number | null>(null);
  const [memberDeleteSheetUserId, setMemberDeleteSheetUserId] = useState<number | null>(null);
  const [memberDeleteSheetEntered, setMemberDeleteSheetEntered] = useState(false);
  const [memberDeleteFormError, setMemberDeleteFormError] = useState("");

  const [donationMgmtSheet, setDonationMgmtSheet] = useState<DonationMgmtSheet>(null);
  const [donationMgmtSheetEntered, setDonationMgmtSheetEntered] = useState(false);
  const [donationMgmtBusyId, setDonationMgmtBusyId] = useState<number | null>(null);
  const [donationMgmtFormError, setDonationMgmtFormError] = useState("");
  const [mgrAmount, setMgrAmount] = useState("");
  const [mgrPaymentType, setMgrPaymentType] = useState<PaymentType>("BANK_TRANSFER");
  const [mgrAccountNumber, setMgrAccountNumber] = useState("");
  const [mgrProofImageUrl, setMgrProofImageUrl] = useState("");
  const [mgrNote, setMgrNote] = useState("");
  const [mgrStatus, setMgrStatus] = useState<"PENDING" | "APPROVED">("APPROVED");
  const [mgrUploadingImage, setMgrUploadingImage] = useState(false);

  const donationMgmtSheetOpen = donationMgmtSheet !== null;
  const donationMgmtTarget =
    donationMgmtSheet !== null
      ? donationCatalog.find((d) => d.id === donationMgmtSheet.id) ?? null
      : null;

  const memberDeleteSheetOpen = memberDeleteSheetUserId !== null;
  const memberDeleteTarget =
    memberDeleteSheetUserId !== null
      ? members.find((m) => m.id === memberDeleteSheetUserId) ?? null
      : null;

  useEffect(() => {
    if (!donationMgmtSheetOpen) {
      setDonationMgmtSheetEntered(false);
      return;
    }
    setDonationMgmtSheetEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setDonationMgmtSheetEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [donationMgmtSheetOpen, donationMgmtSheet?.mode, donationMgmtSheet?.id]);

  useEffect(() => {
    if (!memberDeleteSheetOpen) {
      setMemberDeleteSheetEntered(false);
      return;
    }
    setMemberDeleteSheetEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMemberDeleteSheetEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [memberDeleteSheetOpen, memberDeleteSheetUserId]);

  useEffect(() => {
    if (!donationMgmtSheetOpen && !memberDeleteSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [donationMgmtSheetOpen, memberDeleteSheetOpen]);

  const closeDonationMgmtSheet = () => {
    if (donationMgmtBusyId !== null) return;
    setDonationMgmtSheet(null);
    setDonationMgmtFormError("");
  };

  const startDonationMgmtEdit = (d: CatalogDonation) => {
    setDonationMgmtFormError("");
    setDonationMgmtSheet({ mode: "edit", id: d.id });
    setMgrAmount(String(d.amount));
    setMgrPaymentType(d.paymentType);
    setMgrAccountNumber(d.accountNumber);
    setMgrProofImageUrl(d.proofImageUrl ?? "");
    setMgrNote(d.note ?? "");
    setMgrStatus(d.status);
  };

  const startDonationMgmtDelete = (d: CatalogDonation) => {
    setDonationMgmtFormError("");
    setDonationMgmtSheet({ mode: "delete", id: d.id });
  };

  const handleMgrProofUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    setDonationMgmtFormError("");
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setMgrUploadingImage(true);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    setMgrUploadingImage(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDonationMgmtFormError(data?.error ?? "Image upload failed.");
      return;
    }
    const data = await res.json();
    setMgrProofImageUrl(data.url);
  };

  const saveDonationMgmtEdit = async () => {
    if (donationMgmtSheet?.mode !== "edit") return;
    const editingId = donationMgmtSheet.id;
    setDonationMgmtFormError("");
    if (!mgrAmount || !mgrAccountNumber.trim()) {
      setDonationMgmtFormError("Amount and account number are required.");
      return;
    }
    setDonationMgmtBusyId(editingId);
    const res = await fetch(`/api/admin/donations/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(mgrAmount),
        paymentType: mgrPaymentType,
        accountNumber: mgrAccountNumber.trim(),
        proofImageUrl: mgrProofImageUrl.trim() ? mgrProofImageUrl.trim() : null,
        note: mgrNote.trim() ? mgrNote.trim() : null,
        status: mgrStatus,
      }),
    });
    setDonationMgmtBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDonationMgmtFormError(data?.error ?? "Could not update donation.");
      return;
    }
    const updated = await res.json();
    const createdAtStr =
      typeof updated.createdAt === "string"
        ? updated.createdAt
        : new Date(updated.createdAt).toISOString();
    setDonationCatalog((prev) =>
      prev.map((row) =>
        row.id === editingId
          ? {
              id: updated.id,
              amount: updated.amount,
              status: updated.status,
              paymentType: updated.paymentType,
              accountNumber: updated.accountNumber,
              proofImageUrl: updated.proofImageUrl,
              note: updated.note,
              createdAt: createdAtStr,
              user: {
                id: updated.user.id,
                name: updated.user.name,
                email: updated.user.email,
                profileImage: updated.user.profileImage ?? row.user.profileImage ?? null,
              },
            }
          : row,
      ),
    );
    setDonationMgmtSheet(null);
    setDonationMgmtFormError("");
    setMessage("Donation updated.");
  };

  const confirmDonationMgmtDelete = async () => {
    if (donationMgmtSheet?.mode !== "delete") return;
    const donationId = donationMgmtSheet.id;
    setDonationMgmtFormError("");
    setDonationMgmtBusyId(donationId);
    const res = await fetch(`/api/admin/donations/${donationId}`, { method: "DELETE" });
    setDonationMgmtBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDonationMgmtFormError(data?.error ?? "Could not delete donation.");
      return;
    }
    setDonationCatalog((prev) => prev.filter((d) => d.id !== donationId));
    setDonationMgmtSheet(null);
    setDonationMgmtFormError("");
    setMessage("Donation removed.");
  };

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
      memberCount: members.length,
      pendingDonationCount: pendingDonations.length,
      totalDonations: donationCatalog.length,
      totalAmount,
      monthlyReport,
    };
  }, [donations, pendingDonations, donationCatalog.length, members.length]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const byStatus = MEMBER_STATUS_SORT[a.status] - MEMBER_STATUS_SORT[b.status];
      if (byStatus !== 0) return byStatus;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [members]);

  const approvedForDonation = useMemo(
    () =>
      members
        .filter((m) => m.status === "APPROVED")
        .map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          profileImage: m.profileImage,
        })),
    [members],
  );

  useEffect(() => {
    if (approvedForDonation.length === 0) {
      setSelectedUserId("");
      return;
    }
    if (!approvedForDonation.some((m) => m.id === Number(selectedUserId))) {
      setSelectedUserId(String(approvedForDonation[0].id));
    }
  }, [approvedForDonation, selectedUserId]);

  const handleEnableMember = async (userId: number) => {
    setError("");
    setMessage("");
    setMemberBusyId(userId);
    const res = await fetch("/api/admin/approve-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setMemberBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Could not enable member.");
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, status: "APPROVED" as const } : m)),
    );
    setMessage("Member enabled successfully.");
  };

  const handleDisableMember = async (userId: number) => {
    setError("");
    setMessage("");
    setMemberBusyId(userId);
    const res = await fetch("/api/admin/disable-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setMemberBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Could not disable member.");
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, status: "DISABLED" as const } : m)),
    );
    setMessage("Member account disabled.");
  };

  const closeMemberDeleteSheet = () => {
    if (memberBusyId !== null) return;
    setMemberDeleteSheetUserId(null);
    setMemberDeleteFormError("");
  };

  const openMemberDeleteSheet = (userId: number) => {
    setMemberDeleteFormError("");
    setMemberDeleteSheetUserId(userId);
  };

  const confirmMemberDelete = async () => {
    if (memberDeleteSheetUserId === null) return;
    const userId = memberDeleteSheetUserId;
    setMemberDeleteFormError("");
    setError("");
    setMessage("");
    setMemberBusyId(userId);
    const res = await fetch("/api/admin/delete-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setMemberBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMemberDeleteFormError(data?.error ?? "Could not delete member.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== userId));
    setMemberDeleteSheetUserId(null);
    setMemberDeleteFormError("");
    setMessage("Member deleted.");
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

    setDonationCatalog((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, status: "APPROVED" as const } : d)),
    );
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
    const user = approvedForDonation.find((member) => member.id === Number(selectedUserId));

    if (user) {
      const createdAtStr =
        typeof createdDonation.createdAt === "string"
          ? createdDonation.createdAt
          : new Date(createdDonation.createdAt).toISOString();
      setDonationCatalog((prev) => [
        {
          id: createdDonation.id,
          amount: createdDonation.amount,
          status: "APPROVED" as const,
          paymentType: createdDonation.paymentType,
          accountNumber: createdDonation.accountNumber,
          proofImageUrl: createdDonation.proofImageUrl,
          note: createdDonation.note,
          createdAt: createdAtStr,
          user: {
            id: user.id,
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
        <FlashBanner
          variant="success"
          onDismiss={() => setMessage("")}
          className="mb-4 rounded-2xl px-4 py-2"
        >
          {message}
        </FlashBanner>
      ) : null}
      {error ? (
        <FlashBanner
          variant="error"
          onDismiss={() => setError("")}
          className="mb-4 rounded-2xl px-4 py-2"
        >
          {error}
        </FlashBanner>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Admin Sections
          </p>
          <nav className="space-y-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "pendingDonations", label: "Pending Donations" },
              { id: "donationManagement", label: "Donation Management" },
              { id: "memberManagement", label: "Member Management" },
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
          <p className="text-sm text-emerald-100">Members</p>
          <p className="mt-2 text-3xl font-bold">{totals.memberCount}</p>
          <p className="mt-2 text-xs text-emerald-100">Registered member accounts</p>
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
        className={`mt-6 ${
          activePanel === "overview" ? "" : "hidden"
        }`}
      >
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

      <section className={`mt-6 ${activePanel === "donationManagement" ? "" : "hidden"}`}>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Donation Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            All donation records. Edit details or remove entries. Use the bottom sheet to confirm
            changes.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 px-1 py-2">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donationCatalog.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                      No donations yet.
                    </td>
                  </tr>
                ) : (
                  donationCatalog.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {new Date(row.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{row.user.name}</div>
                        <div className="text-xs text-slate-500">{row.user.email}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        ${row.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            row.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {row.status === "PENDING" ? "Pending" : "Approved"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.paymentType}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => startDonationMgmtEdit(row)}
                            disabled={donationMgmtBusyId !== null || memberDeleteSheetOpen}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => startDonationMgmtDelete(row)}
                            disabled={donationMgmtBusyId !== null || memberDeleteSheetOpen}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className={`mt-6 ${activePanel === "memberManagement" ? "" : "hidden"}`}>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Member Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            All registered members, account status, and profile details.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 px-1 py-2">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Major</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                      No members yet.
                    </td>
                  </tr>
                ) : (
                  sortedMembers.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.profileImage}
                              alt=""
                              className="h-10 w-10 shrink-0 cursor-default rounded-full border border-slate-200 object-cover transition duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:scale-110 hover:shadow-lg hover:shadow-slate-300/80"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 cursor-default items-center justify-center rounded-full border border-sky-200/80 bg-sky-100 text-sm font-semibold text-slate-700 transition duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:scale-110 hover:shadow-lg hover:shadow-sky-200/70">
                              {row.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-slate-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.email}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.major ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            row.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : row.status === "DISABLED"
                                ? "bg-slate-200 text-slate-800"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {row.status === "PENDING"
                            ? "Pending"
                            : row.status === "DISABLED"
                              ? "Disabled"
                              : "Approved"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {new Date(row.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.status === "DISABLED" ? (
                            <button
                              type="button"
                              onClick={() => handleEnableMember(row.id)}
                              disabled={memberBusyId === row.id}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              {memberBusyId === row.id ? "…" : "Enable"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDisableMember(row.id)}
                              disabled={memberBusyId === row.id}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
                            >
                              {memberBusyId === row.id ? "…" : "Disable"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openMemberDeleteSheet(row.id)}
                            disabled={memberBusyId === row.id}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
              {approvedForDonation.map((member) => (
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
        <p className="mt-1 text-sm text-slate-500">Latest approved donations (newest first).</p>
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

      {donationMgmtSheetOpen && donationMgmtSheet ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby={
            donationMgmtSheet.mode === "delete"
              ? "admin-delete-donation-sheet-title"
              : "admin-edit-donation-sheet-title"
          }
        >
          <button
            type="button"
            className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${
              donationMgmtSheetEntered ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeDonationMgmtSheet}
            aria-label="Close panel"
          />
          <div
            className={`relative max-h-[min(90dvh,640px)] w-full overflow-y-auto rounded-t-[1.75rem] border border-slate-200 border-b-0 bg-white px-5 pb-8 pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
              donationMgmtSheetEntered ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-slate-200" />
            {donationMgmtSheet.mode === "edit" ? (
              <>
                <h3
                  id="admin-edit-donation-sheet-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Edit donation
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update amount, payment details, proof, or approval status.
                </p>
                {donationMgmtFormError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {donationMgmtFormError}
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
                      value={mgrAmount}
                      onChange={(e) => setMgrAmount(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Payment</span>
                    <select
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={mgrPaymentType}
                      onChange={(e) => setMgrPaymentType(e.target.value as PaymentType)}
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
                      value={mgrAccountNumber}
                      onChange={(e) => setMgrAccountNumber(e.target.value)}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Status</span>
                    <select
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={mgrStatus}
                      onChange={(e) =>
                        setMgrStatus(e.target.value as "PENDING" | "APPROVED")
                      }
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">
                      Proof image URL (optional)
                    </span>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={mgrProofImageUrl}
                      onChange={(e) => setMgrProofImageUrl(e.target.value)}
                    />
                  </label>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Upload proof</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMgrProofUpload}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-800"
                    />
                    {mgrUploadingImage ? (
                      <p className="text-xs text-slate-500">Uploading…</p>
                    ) : null}
                  </div>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Note (optional)</span>
                    <textarea
                      className="min-h-[5rem] w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={mgrNote}
                      onChange={(e) => setMgrNote(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      disabled={donationMgmtBusyId !== null}
                      onClick={saveDonationMgmtEdit}
                      className="rounded-bl-xl rounded-tr-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {donationMgmtBusyId !== null ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      disabled={donationMgmtBusyId !== null}
                      onClick={closeDonationMgmtSheet}
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
                  id="admin-delete-donation-sheet-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Delete donation?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  This permanently removes the record from the system. This cannot be undone.
                </p>
                {donationMgmtTarget ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p>
                      <span className="font-medium text-slate-900">Member:</span>{" "}
                      {donationMgmtTarget.user.name}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-slate-900">Amount:</span> $
                      {donationMgmtTarget.amount.toFixed(2)}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-slate-900">Status:</span>{" "}
                      {donationMgmtTarget.status}
                    </p>
                  </div>
                ) : null}
                {donationMgmtFormError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {donationMgmtFormError}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={donationMgmtBusyId !== null}
                    onClick={confirmDonationMgmtDelete}
                    className="rounded-bl-xl rounded-tr-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50"
                  >
                    {donationMgmtBusyId !== null ? "Deleting…" : "Delete donation"}
                  </button>
                  <button
                    type="button"
                    disabled={donationMgmtBusyId !== null}
                    onClick={closeDonationMgmtSheet}
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

      {memberDeleteSheetOpen && memberDeleteSheetUserId !== null ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-delete-member-sheet-title"
        >
          <button
            type="button"
            className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${
              memberDeleteSheetEntered ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMemberDeleteSheet}
            aria-label="Close panel"
          />
          <div
            className={`relative max-h-[min(90dvh,520px)] w-full overflow-y-auto rounded-t-[1.75rem] border border-slate-200 border-b-0 bg-white px-5 pb-8 pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
              memberDeleteSheetEntered ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-slate-200" />
            <h3
              id="admin-delete-member-sheet-title"
              className="text-lg font-semibold text-slate-900"
            >
              Delete member account?
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              This permanently removes the member and cannot be undone. Members who already have
              donation records cannot be deleted—you must remove or reassign those donations first.
            </p>
            {memberDeleteTarget ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Name:</span>{" "}
                  {memberDeleteTarget.name}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-slate-900">Email:</span>{" "}
                  {memberDeleteTarget.email}
                </p>
              </div>
            ) : null}
            {memberDeleteFormError ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {memberDeleteFormError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={memberBusyId !== null}
                onClick={confirmMemberDelete}
                className="rounded-bl-xl rounded-tr-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50"
              >
                {memberBusyId !== null ? "Deleting…" : "Delete member"}
              </button>
              <button
                type="button"
                disabled={memberBusyId !== null}
                onClick={closeMemberDeleteSheet}
                className="rounded-bl-xl rounded-tr-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
        </div>
      </div>
    </div>
  );
}
