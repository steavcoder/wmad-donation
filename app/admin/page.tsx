import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { AdminWorkspace } from "@/components/admin-workspace";
import { BackToHomeLink } from "@/components/back-to-home-link";
import { LogoutButton } from "@/components/logout-button";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadProfileImagesByUserIds(ids: number[]) {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id)))];
  if (unique.length === 0) {
    return new Map<number, string | null>();
  }
  const rows = await prisma.$queryRaw<Array<{ id: number; profileImage: string | null }>>(
    Prisma.sql`SELECT id, "profileImage" FROM "User" WHERE id IN (${Prisma.join(unique)})`,
  );
  return new Map(rows.map((r) => [r.id, r.profileImage]));
}

export default async function AdminPage() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    redirect("/login");
  }

  if (payload.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const pendingUsers = await prisma.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true },
  });

  const memberUsersBase = await prisma.user.findMany({
    where: { role: "MEMBER", status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true },
  });

  const recentDonationsRaw = await prisma.donation.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const pendingDonationRequestsRaw = await prisma.donation.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const profileMap = await loadProfileImagesByUserIds([
    ...memberUsersBase.map((m) => m.id),
    ...recentDonationsRaw.map((d) => d.userId),
    ...pendingDonationRequestsRaw.map((d) => d.userId),
  ]);

  const memberUsers = memberUsersBase.map((m) => ({
    ...m,
    profileImage: profileMap.get(m.id) ?? null,
  }));

  const recentDonations = recentDonationsRaw.map((donation) => ({
    id: donation.id,
    amount: donation.amount,
    paymentType: donation.paymentType,
    accountNumber: donation.accountNumber,
    proofImageUrl: donation.proofImageUrl,
    note: donation.note,
    createdAt: donation.createdAt,
    user: {
      name: donation.user.name,
      email: donation.user.email,
      profileImage: profileMap.get(donation.userId) ?? null,
    },
  }));

  const pendingDonations = pendingDonationRequestsRaw.map((donation) => ({
    id: donation.id,
    amount: donation.amount,
    paymentType: donation.paymentType,
    accountNumber: donation.accountNumber,
    proofImageUrl: donation.proofImageUrl,
    note: donation.note,
    createdAt: donation.createdAt.toISOString(),
    user: {
      id: donation.user.id,
      name: donation.user.name,
      email: donation.user.email,
      profileImage: profileMap.get(donation.user.id) ?? null,
    },
  }));

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div>
          <p className="text-sm text-slate-500">Admin Portal</p>
          <h1 className="text-2xl font-bold text-slate-900">Donation Management</h1>
          <p className="text-sm text-slate-600">Approve users and record donation entries.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BackToHomeLink />
          <LogoutButton />
        </div>
      </section>
      <AdminWorkspace
        pendingUsers={pendingUsers}
        pendingDonations={pendingDonations}
        memberUsers={memberUsers}
        recentDonations={recentDonations.map((donation) => ({
          id: donation.id,
          amount: donation.amount,
          paymentType: donation.paymentType,
          accountNumber: donation.accountNumber,
          proofImageUrl: donation.proofImageUrl,
          note: donation.note,
          createdAt: donation.createdAt.toISOString(),
          user: donation.user,
        }))}
      />
    </main>
  );
}
