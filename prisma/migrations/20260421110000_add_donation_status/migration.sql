-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DonationStatus') THEN
    CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'APPROVED');
  END IF;
END
$$;

-- AlterTable
ALTER TABLE "Donation"
ADD COLUMN IF NOT EXISTS "status" "DonationStatus" NOT NULL DEFAULT 'APPROVED';
