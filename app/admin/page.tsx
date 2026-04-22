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

  const memberManagementListRaw = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      major: true,
      profileImage: true,
      status: true,
      createdAt: true,
    },
  });

  const memberUsersBase = memberManagementListRaw.filter((m) => m.status === "APPROVED");

  const allDonationsRaw = await prisma.donation.findMany({
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

  const profileMap = await loadProfileImagesByUserIds([
    ...memberUsersBase.map((m) => m.id),
    ...allDonationsRaw.map((d) => d.userId),
  ]);

  const memberUsers = memberUsersBase.map((m) => ({
    ...m,
    profileImage: profileMap.get(m.id) ?? null,
  }));

  const allDonations = allDonationsRaw.map((donation) => ({
    id: donation.id,
    amount: donation.amount,
    status: donation.status,
    paymentType: donation.paymentType,
    accountNumber: donation.accountNumber,
    proofImageUrl: donation.proofImageUrl,
    note: donation.note,
    createdAt: donation.createdAt.toISOString(),
    user: {
      id: donation.user.id,
      name: donation.user.name,
      email: donation.user.email,
      profileImage: profileMap.get(donation.userId) ?? null,
    },
  }));

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div>
          <p className="text-sm text-slate-500">Admin Portal</p>
          <h1 className="text-2xl font-bold text-slate-900">Donation Management</h1>
          <p className="text-sm text-slate-600">
            Review donation requests, record entries, and manage members.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BackToHomeLink />
          <LogoutButton />
        </div>
      </section>
      <AdminWorkspace
        allDonations={allDonations}
        memberManagementList={memberManagementListRaw.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          major: m.major,
          profileImage: m.profileImage,
          status: m.status,
          createdAt: m.createdAt.toISOString(),
        }))}
        memberUsers={memberUsers}
      />
    </main>
  );
}
