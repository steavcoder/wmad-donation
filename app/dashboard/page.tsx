import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthPayload, verifyToken } from "@/lib/auth";
import { BackToHomeLink } from "@/components/back-to-home-link";
import { DashboardProfileSection } from "@/components/dashboard-profile-section";
import { DonationReceiptCard } from "@/components/donation-receipt-card";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/lib/prisma";

type DashboardUser = {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
  major: string | null;
  donations: Array<{
    id: number;
    amount: number;
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

  const total = user.donations.reduce((sum, donation) => sum + donation.amount, 0);
  const donationCount = user.donations.length;
  const average =
    donationCount > 0 ? total / donationCount : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-neutral-50">
      <section className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
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
            <p className="text-sm text-gray-500">Member Portal</p>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}</h1>
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
        initialMajor={user.major}
        initialProfileImage={user.profileImage}
      />

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-6 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Donations</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Donation Count</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{donationCount}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Average Donation</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">${average.toFixed(2)}</p>
        </article>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-10">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Donation History</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your latest donation activity and notes.
          </p>
          <div className="mt-4">
            {user.donations.length === 0 ? (
              <p className="text-gray-500">No donations yet.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {user.donations.map((donation) => (
                  <li key={donation.id}>
                    <DonationReceiptCard
                      amount={donation.amount}
                      donorName={user.name}
                      donorEmail={user.email}
                      showDonorAvatar={false}
                      paymentType={donation.paymentType}
                      accountNumber={donation.accountNumber}
                      note={donation.note}
                      createdAt={donation.createdAt}
                      proofImageUrl={donation.proofImageUrl}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
