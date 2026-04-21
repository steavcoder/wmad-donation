import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [, , emailArg, passwordArg, ...nameParts] = process.argv;

  const email = (emailArg ?? "").trim().toLowerCase();
  const password = passwordArg ?? "";
  const name = nameParts.join(" ").trim() || "System Admin";

  if (!email || !password) {
    console.error(
      "Usage: npm run admin:create -- <email> <password> [full name]",
    );
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role: "ADMIN",
      status: "APPROVED",
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      status: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log("Admin ready:", admin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
