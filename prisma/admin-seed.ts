import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin users
  const adminUsers = [
    {
      email: "admin@example.com",
      name: "Admin User",
      password: "admin123",
      phone: "1234567890",
      address: "123 Admin St",
      idProof: "ADMIN123",
    },
    {
      email: "superadmin@example.com",
      name: "Super Admin",
      password: "superadmin123",
      phone: "9876543210",
      address: "456 Admin Ave",
      idProof: "SUPER123",
    },
  ];

  for (const admin of adminUsers) {
    const hashedPassword = await hash(admin.password, 12);
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        ...admin,
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    });
  }

  console.log("Admin users have been seeded. 🌱");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
