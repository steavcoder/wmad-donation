import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthPayload, verifyToken } from "@/lib/auth";
import { BackToHomeLink } from "@/components/back-to-home-link";
import { DashboardProfileSection } from "@/components/dashboard-profile-section";
import { DashboardDonationHistory } from "@/components/dashboard-donation-history";
import { LogoutButton } from "@/components/logout-button";
import { DashboardWarmWishes } from "@/components/dashboard-warm-wishes";
import { MemberDonationRequestForm } from "@/components/member-donation-request-form";
import { prisma } from "@/lib/prisma";
import { findWarmWishesForFeed } from "@/lib/warm-wishes-db";

type DashboardUser = {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
  major: string | null;
  status: "PENDING" | "APPROVED" | "DISABLED";
  donations: Array<{
    id: number;
    amount: number;
    status: "PENDING" | "APPROVED";
    paymentType: "CASH" | "BANK_TRANSFER" | "ABA" | "ACLEDA" | "WING" | "OTHER";
    accountNumber: string;
    proofImageUrl: string | null;
    note: string | null;
    createdAt: Date;
  }>;
};

export default async function DashboardPage() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let payload: AuthPayload;
  try {
    payload = verifyToken(token);
  } catch {
    redirect("/login");
  }

  const user = (await prisma.user.findUnique({
    where: { id: payload.id },
    include: {
      donations: {
        orderBy: { createdAt: "desc" },
      },
    },
  })) as DashboardUser | null;

  if (!user) {
    redirect("/login");
  }

  if (user.status !== "APPROVED") {
    redirect("/login");
  }

  const approvedDonations = user.donations.filter((donation) => donation.status === "APPROVED");

  const total = approvedDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const donationCount = approvedDonations.length;
  const average = donationCount > 0 ? total / donationCount : 0;
  const trendData = approvedDonations.slice(0, 7).reverse();
  const trendMax = Math.max(...trendData.map((d) => d.amount), 1);

  const warmWishesRaw = await findWarmWishesForFeed(48);
  const warmWishesInitial = warmWishesRaw.map((w) => ({
    id: w.id,
    message: w.message,
    createdAt: w.createdAt.toISOString(),
    user: {
      id: w.user.id,
      name: w.user.name,
      major: w.user.major,
      profileImage: w.user.profileImage,
    },
  }));

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-4">
          {user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profileImage}
              alt=""
              className="h-14 w-14 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-medium text-gray-500">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm text-slate-500">Member Portal</p>
            <h1 className="text-2xl font-bold text-slate-900">
              You&apos;re so generous, {user.name}
            </h1>
            <p className="text-sm text-gray-600">{user.email}</p>
            {user.major ? (
              <p className="text-sm text-gray-600">Major: {user.major}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BackToHomeLink />
          <LogoutButton />
        </div>
      </section>

      <DashboardProfileSection
        initialName={user.name}
        initialMajor={user.major}
        initialProfileImage={user.profileImage}
      />
      <MemberDonationRequestForm />

      <DashboardWarmWishes initialWishes={warmWishesInitial} currentUserId={user.id} />

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-6 pb-6 lg:grid-cols-4">
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl bg-emerald-500 p-5 text-white shadow-lg shadow-emerald-500/25">
          <p className="text-sm text-emerald-100">Total Donations</p>
          <p className="mt-2 text-3xl font-bold">${total.toFixed(2)}</p>
          <p className="mt-2 text-xs text-emerald-100">All time tracked amount</p>
        </article>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Donation Count</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{donationCount}</p>
          <p className="mt-2 text-xs text-slate-500">Entries recorded</p>
        </article>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Average Donation</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">${average.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-500">Per donation record</p>
        </article>
        <article className="rounded-bl-[2.75rem] rounded-tr-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <p className="text-sm text-slate-500">Latest 7 Donations</p>
          <div className="mt-4 flex h-20 items-end gap-1.5">
            {trendData.length === 0 ? (
              <p className="text-xs text-slate-500">No trend data yet.</p>
            ) : (
              trendData.map((donation) => (
                <div
                  key={donation.id}
                  className="flex-1 rounded-md bg-emerald-500/80"
                  style={{ height: `${Math.max(14, (donation.amount / trendMax) * 100)}%` }}
                  title={`$${donation.amount.toFixed(2)}`}
                />
              ))
            )}
          </div>
        </article>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-10">
        <DashboardDonationHistory
          donations={user.donations.map((d) => ({
            id: d.id,
            amount: d.amount,
            status: d.status,
            paymentType: d.paymentType,
            accountNumber: d.accountNumber,
            proofImageUrl: d.proofImageUrl,
            note: d.note,
            createdAt: d.createdAt.toISOString(),
          }))}
          userName={user.name}
          userEmail={user.email}
        />
      </section>
    </main>
  );
}
