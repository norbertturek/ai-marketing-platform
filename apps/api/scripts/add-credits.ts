/**
 * One-off script: add credits to a user by email.
 * Usage: pnpm --filter api add-credits <email> [amount]
 * Example: pnpm --filter api add-credits user@example.com 1000
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.argv[2];
  const amount = parseInt(process.argv[3] ?? '1000', 10);

  if (!email) {
    console.error('Usage: pnpm add-credits <email> [amount]');
    process.exit(1);
  }
  if (amount < 1) {
    console.error('Amount must be positive');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, credits: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { credits: { increment: amount } },
    select: { email: true, credits: true },
  });

  console.log(`Added ${amount} credits to ${updated.email}. New balance: ${updated.credits}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
