-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'BANK_TRANSFER', 'ABA', 'ACLEDA', 'WING', 'OTHER');

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "accountNumber" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "proofImageUrl" TEXT;
