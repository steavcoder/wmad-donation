type DonationReceiptCardProps = {
  amount: number;
  donorName: string;
  donorEmail?: string;
  /** Member profile photo from User.profileImage (e.g. admin view) */
  donorProfileImage?: string | null;
  /** When false, header has no avatar / initial (member dashboard) */
  showDonorAvatar?: boolean;
  paymentType: string;
  accountNumber: string;
  note?: string | null;
  createdAt: string | Date;
  proofImageUrl?: string | null;
};

export function DonationReceiptCard({
  amount,
  donorName,
  donorEmail,
  donorProfileImage,
  showDonorAvatar = true,
  paymentType,
  accountNumber,
  note,
  createdAt,
  proofImageUrl,
}: DonationReceiptCardProps) {
  return (
    <article className="h-[300px] rounded-md border-2 border-gray-300 bg-white p-3 shadow-sm">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-center gap-2 border-b border-gray-200 pb-2">
          {showDonorAvatar ? (
            donorProfileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={donorProfileImage}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-500">
                {donorName.slice(0, 1).toUpperCase()}
              </div>
            )
          ) : null}
          <h3 className="text-center text-sm font-bold tracking-wide text-sky-700">
            DONATION RECEIPT
          </h3>
        </div>

        <div className="mt-2 flex-1 space-y-1 overflow-auto text-xs text-gray-700">
          <p>
            <span className="font-semibold">Amount:</span> ${amount.toFixed(2)}
          </p>
          <p>
            <span className="font-semibold">Name:</span> {donorName}
          </p>
          {donorEmail ? (
            <p>
              <span className="font-semibold">Email:</span> {donorEmail}
            </p>
          ) : null}
          <p>
            <span className="font-semibold">Payment:</span> {paymentType}
          </p>
          <p>
            <span className="font-semibold">Account:</span> {accountNumber}
          </p>
          <p>
            <span className="font-semibold">Date:</span>{" "}
            {new Date(createdAt).toLocaleDateString()}
          </p>
          <p>
            <span className="font-semibold">Note:</span> {note?.trim() ? note : "No note"}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-200 pt-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-medium text-gray-500">Payment proof</p>
            {proofImageUrl ? (
              <a
                href={proofImageUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative block h-12 w-12 rounded border border-gray-200 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${proofImageUrl})` }}
                title="Hover to preview, click to open"
              >
                <span className="pointer-events-none absolute left-[3.25rem] top-0 z-20 hidden h-28 w-28 rounded-lg border border-gray-200 bg-white p-1 shadow-lg group-hover:block">
                  <span
                    className="block h-full w-full rounded-md bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${proofImageUrl})` }}
                  />
                </span>
              </a>
            ) : (
              <div className="h-12 w-12 rounded border border-gray-200 bg-gray-100" />
            )}
          </div>
          <p className="text-right text-[11px] text-gray-500">
            {proofImageUrl ? "Proof" : "No proof"}
          </p>
        </div>
      </div>
    </article>
  );
}
