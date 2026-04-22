-- CreateTable
CREATE TABLE "WarmWish" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "WarmWish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarmWish_createdAt_idx" ON "WarmWish"("createdAt");

-- AddForeignKey
ALTER TABLE "WarmWish" ADD CONSTRAINT "WarmWish_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
