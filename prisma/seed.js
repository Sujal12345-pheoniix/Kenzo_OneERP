const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  await prisma.activity.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("Creating Kenzo Tenant...");
  const tenantKenzo = await prisma.tenant.create({
    data: {
      name: "Kenzo Infosystems Pvt Ltd",
      domain: "kenzo.oneerp.io",
      settings: {
        theme: "light",
        primaryColor: "#0284c7",
      },
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Creating target users with updated positions & roles...");

  // 1. Jitendar Saini - CEO (admin@kenzo.com)
  const userAdmin = await prisma.user.create({
    data: {
      email: "admin@kenzo.com",
      name: "Jitendar Saini",
      passwordHash,
      role: "COMPANY_ADMIN",
      tenantId: tenantKenzo.id,
    },
  });

  await prisma.employee.create({
    data: {
      tenantId: tenantKenzo.id,
      userId: userAdmin.id,
      firstName: "Jitendar",
      lastName: "Saini",
      department: "MANAGEMENT",
      position: "CEO",
      status: "ACTIVE",
      salary: 250000,
    },
  });

  // 2. Ankit Sethi - Bussiness and Sales Head (ceo@kenzo.com)
  const userCeo = await prisma.user.create({
    data: {
      email: "ceo@kenzo.com",
      name: "Ankit Sethi",
      passwordHash,
      role: "CEO",
      tenantId: tenantKenzo.id,
    },
  });

  await prisma.employee.create({
    data: {
      tenantId: tenantKenzo.id,
      userId: userCeo.id,
      firstName: "Ankit",
      lastName: "Sethi",
      department: "SALES",
      position: "Bussiness and Sales Head",
      status: "ACTIVE",
      salary: 200000,
    },
  });

  // 3. Chanchal Saini - Managing Director (hr@kenzo.com)
  const userHr = await prisma.user.create({
    data: {
      email: "hr@kenzo.com",
      name: "Chanchal Saini",
      passwordHash,
      role: "HR",
      tenantId: tenantKenzo.id,
    },
  });

  await prisma.employee.create({
    data: {
      tenantId: tenantKenzo.id,
      userId: userHr.id,
      firstName: "Chanchal",
      lastName: "Saini",
      department: "MANAGEMENT",
      position: "Managing Director",
      status: "ACTIVE",
      salary: 180000,
    },
  });

  // 4. Sujal Kumar - Developer (dev@kenzo.com)
  const userDev = await prisma.user.create({
    data: {
      email: "dev@kenzo.com",
      name: "Sujal Kumar",
      passwordHash,
      role: "DEVELOPER",
      tenantId: tenantKenzo.id,
    },
  });

  await prisma.employee.create({
    data: {
      tenantId: tenantKenzo.id,
      userId: userDev.id,
      firstName: "Sujal",
      lastName: "Kumar",
      department: "ENGINEERING",
      position: "Developer",
      status: "ACTIVE",
      salary: 95000,
    },
  });

  // 5. Laxmi Narayan Ojha - Field Sales Executive (pm@kenzo.com)
  const userPm = await prisma.user.create({
    data: {
      email: "pm@kenzo.com",
      name: "Laxmi Narayan Ojha",
      passwordHash,
      role: "PROJECT_MANAGER",
      tenantId: tenantKenzo.id,
    },
  });

  await prisma.employee.create({
    data: {
      tenantId: tenantKenzo.id,
      userId: userPm.id,
      firstName: "Laxmi Narayan",
      lastName: "Ojha",
      department: "SALES",
      position: "Field Sales Executive",
      status: "ACTIVE",
      salary: 110000,
    },
  });

  // Default project
  await prisma.project.create({
    data: {
      tenantId: tenantKenzo.id,
      name: "General Corporate Operations",
      description: "Core operational scope & assigned task lane",
      status: "ACTIVE",
      budget: 100000,
      startDate: new Date(),
    },
  });

  console.log("Database successfully seeded with updated roles and positions!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
