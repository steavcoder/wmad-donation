import Link from "next/link";
import { connection } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getDonorMembersForShowcase() {
  return prisma.$queryRaw<
    Array<{ id: number; name: string; profileImage: string | null }>
  >(Prisma.sql`
    SELECT u.id, u.name, u."profileImage"
    FROM "User" u
    WHERE u.role = 'MEMBER'
      AND u.status = 'APPROVED'
      AND EXISTS (SELECT 1 FROM "Donation" d WHERE d."userId" = u.id)
    ORDER BY (
      SELECT MAX(d."createdAt") FROM "Donation" d WHERE d."userId" = u.id
    ) DESC
    LIMIT 16
  `);
}

export default async function Home() {
  await connection();
  const donorMembers = await getDonorMembersForShowcase();

  return (
    <div className="min-h-screen bg-white text-neutral-800">
      {/* Top bar */}
      <div className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 md:px-6">
          <div className="flex flex-wrap gap-4">
            <span>contact@wmaddonate.org</span>
            <span className="hidden sm:inline">|</span>
            <span>+885 93620246</span>
          </div>
          <div className="flex gap-3">
            <span aria-hidden>○</span>
            <span aria-hidden>○</span>
            <span aria-hidden>○</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-neutral-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-lg text-white">
              ♥
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl tracking-tight">
              WMAD Donate
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
            <Link href="/" className="hover:text-emerald-700">
              Home
            </Link>
            <a href="#causes" className="hover:text-emerald-700">
              Causes
            </a>
            <a href="#donors" className="hover:text-emerald-700">
              Donors
            </a>
            <Link href="/login" className="hover:text-emerald-700">
              Login
            </Link>
          </nav>
          <Link
            href="/register"
            className="rounded-full border-2 border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-emerald-600 hover:text-emerald-700"
          >
            Make a Donate
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f8f8f8] px-4 pb-20 pt-14 md:px-6 md:pb-28 md:pt-16">

        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-10">
          <div className="lg:pr-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-500">
              Get started today
            </p>
            <h1 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.15] text-slate-900 md:text-5xl lg:text-[3.35rem]">
              Help The Children When They Need.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500 md:text-base">
              The world calls for acts from us, simplicity of life, the spirit of prayer,
              charity towards all, especially towards the lowly and the poor.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-emerald-500 bg-emerald-500 px-7 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-400/30"
              >
                Donate now
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-7 py-3 text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500 hover:text-emerald-700 hover:shadow-lg hover:shadow-emerald-100"
              >
                Learn more →
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative ml-auto aspect-[5/4] w-full max-w-[36rem] overflow-hidden rounded-bl-[9rem] rounded-tr-[1.5rem] bg-neutral-200 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80"
                alt="Children smiling together"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Good causes */}
      <section id="causes" className="scroll-mt-24 bg-white px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-500">
            Good causes
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900 md:text-5xl">
            Help The Poor Throughout Us
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-neutral-500">
            Every contribution is tracked and shared with members after verification.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Transparent giving",
                body: "Admins record donations with payment details and proof so members always know what was received.",
                icon: "https://png.pngtree.com/png-clipart/20250801/original/pngtree-hands-holding-floating-hearts-vector-png-image_21457648.png",
              },
              {
                title: "Member accounts",
                body: "Register once, get approved, then log in anytime to view your history and profile.",
                icon: "https://cdn-icons-png.flaticon.com/512/5455/5455944.png",
              },
              {
                title: "Lasting impact",
                body: "Monthly summaries and receipts help your community see progress over time.",
                icon: "https://cdn.sanity.io/images/g3jm82pm/production/8d7f85c20a75235e618b35f982f05f343f022363-550x550.png?w=1200&q=75&fit=clip&auto=format",
              },
            ].map((card) => (
              <article
                key={card.title}
                className="group rounded-sm border border-slate-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/70"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 p-2 transition duration-300 group-hover:scale-110 group-hover:bg-emerald-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.icon}
                    alt={`${card.title} icon`}
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-110"
                  />
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{card.body}</p>
                <Link
                  href="/register"
                  className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-500 transition duration-300 hover:gap-2 hover:text-emerald-600"
                >
                  Read more <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Donors who registered & donated */}
      <section
        id="donors"
        className="scroll-mt-24 border-t border-neutral-100 bg-gradient-to-b from-neutral-50 to-white px-4 py-16 md:px-6 md:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Our donors
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-neutral-900 md:text-4xl">
              Members who stepped up
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              Approved members with at least one recorded donation. Thank you for making a
              difference.
            </p>
          </div>

          {donorMembers.length === 0 ? (
            <p className="mt-12 text-center text-sm text-neutral-500">
              No public donor profiles yet. Be the first —{" "}
              <Link href="/register" className="font-semibold text-emerald-700 underline">
                register as a donor
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-12 flex flex-wrap items-start justify-center gap-8 md:gap-10">
              {donorMembers.map((donor) => (
                <li key={donor.id} className="flex w-28 flex-col items-center text-center">
                  <div className="relative">
                    {donor.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={donor.profileImage}
                        alt=""
                        className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-md ring-2 ring-emerald-100"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-100 text-2xl font-bold text-emerald-800 shadow-md ring-2 ring-emerald-100">
                        {donor.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs font-semibold text-neutral-800">
                    {donor.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-neutral-200 bg-emerald-700 px-4 py-12 text-white md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
              Ready to give?
            </p>
            <p className="mt-1 text-sm text-emerald-100">
              Create your account and join our donor community.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 border-white/80 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Member login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
