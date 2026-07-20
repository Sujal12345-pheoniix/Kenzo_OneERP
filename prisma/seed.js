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

  console.log("Creating target users...");

  // 1. Jitendar Saini - Company Admin
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
      department: "ADMINISTRATION",
      position: "Company Administrator",
      status: "ACTIVE",
      salary: 120000,
    },
  });

  // 2. Ankit Sethi - CEO
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
      department: "MANAGEMENT",
      position: "Chief Executive Officer",
      status: "ACTIVE",
      salary: 250000,
    },
  });

  // 3. Chanchal Saini - HR Manager
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
      department: "HR",
      position: "HR Manager",
      status: "ACTIVE",
      salary: 80000,
    },
  });

  // 4. Sujal Kumar - Developer
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

  // 5. Laxmi Narayan Ojha - Project Manager
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
      department: "ENGINEERING",
      position: "Project Manager",
      status: "ACTIVE",
      salary: 110000,
    },
  });

  console.log("Database reset and customized users seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
