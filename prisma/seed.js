const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SYSTEM_PERMISSIONS = [
  { code: "user:create", module: "ADMIN", resource: "USER", action: "CREATE", description: "Create enterprise user accounts" },
  { code: "user:read", module: "ADMIN", resource: "USER", action: "READ", description: "View user directory and profiles" },
  { code: "user:update", module: "ADMIN", resource: "USER", action: "UPDATE", description: "Update user roles and access keys" },
  { code: "user:delete", module: "ADMIN", resource: "USER", action: "DELETE", description: "Purge or deactivate user accounts" },
  { code: "role:manage", module: "ADMIN", resource: "ROLE", action: "UPDATE", description: "Manage RBAC roles and permission matrices" },
  
  { code: "employee:create", module: "HR", resource: "EMPLOYEE", action: "CREATE", description: "Hire and onboard new employees" },
  { code: "employee:read", module: "HR", resource: "EMPLOYEE", action: "READ", description: "View employee profiles and organizational charts" },
  { code: "employee:update", module: "HR", resource: "EMPLOYEE", action: "UPDATE", description: "Edit employee information" },
  { code: "employee:delete", module: "HR", resource: "EMPLOYEE", action: "DELETE", description: "Terminate or archive employee records" },
  { code: "employee:salary:view", module: "HR", resource: "EMPLOYEE", action: "READ", description: "View compensation details and payroll metrics" },
  { code: "employee:salary:edit", module: "HR", resource: "EMPLOYEE", action: "UPDATE", description: "Modify salary and compensation packages" },
  
  { code: "attendance:mark", module: "HR", resource: "ATTENDANCE", action: "CREATE", description: "Mark daily check-in attendance" },
  { code: "attendance:read", module: "HR", resource: "ATTENDANCE", action: "READ", description: "Inspect attendance history calendars" },
  { code: "attendance:admin", module: "HR", resource: "ATTENDANCE", action: "UPDATE", description: "Override and audit attendance logs" },
  { code: "leave:request", module: "HR", resource: "LEAVE", action: "CREATE", description: "Submit time-off and leave requests" },
  { code: "leave:approve", module: "HR", resource: "LEAVE", action: "APPROVE", description: "Approve or deny employee leave applications" },
  
  { code: "project:create", module: "PROJECTS", resource: "PROJECT", action: "CREATE", description: "Initiate new enterprise projects" },
  { code: "project:read", module: "PROJECTS", resource: "PROJECT", action: "READ", description: "View project deliverables and milestones" },
  { code: "project:update", module: "PROJECTS", resource: "PROJECT", action: "UPDATE", description: "Modify project parameters and status" },
  { code: "project:delete", module: "PROJECTS", resource: "PROJECT", action: "DELETE", description: "Archive or delete project initiatives" },
  { code: "task:create", module: "PROJECTS", resource: "TASK", action: "CREATE", description: "Create project tasks and backlog items" },
  { code: "task:read", module: "PROJECTS", resource: "TASK", action: "READ", description: "Inspect task boards and checklists" },
  { code: "task:update", module: "PROJECTS", resource: "TASK", action: "UPDATE", description: "Update task progress status" },
  { code: "task:assign", module: "PROJECTS", resource: "TASK", action: "UPDATE", description: "Assign project tasks to employees" },
  { code: "task:delete", module: "PROJECTS", resource: "TASK", action: "DELETE", description: "Remove task items" },
  
  { code: "lead:create", module: "CRM", resource: "LEAD", action: "CREATE", description: "Register CRM sales leads" },
  { code: "lead:read", module: "CRM", resource: "LEAD", action: "READ", description: "View sales pipeline and lead cards" },
  { code: "lead:update", module: "CRM", resource: "LEAD", action: "UPDATE", description: "Update lead status and deal value" },
  { code: "lead:delete", module: "CRM", resource: "LEAD", action: "DELETE", description: "Purge CRM leads" },
  
  { code: "invoice:create", module: "FINANCE", resource: "INVOICE", action: "CREATE", description: "Generate customer billing invoices" },
  { code: "invoice:read", module: "FINANCE", resource: "INVOICE", action: "READ", description: "View financial invoices and ledgers" },
  { code: "invoice:update", module: "FINANCE", resource: "INVOICE", action: "UPDATE", description: "Update invoice billing state" },
  { code: "invoice:delete", module: "FINANCE", resource: "INVOICE", action: "DELETE", description: "Cancel or archive customer invoices" },
  { code: "expense:create", module: "FINANCE", resource: "EXPENSE", action: "CREATE", description: "File operational expense claims" },
  { code: "expense:read", module: "FINANCE", resource: "EXPENSE", action: "READ", description: "View corporate expense reports" },
  { code: "expense:approve", module: "FINANCE", resource: "EXPENSE", action: "APPROVE", description: "Approve or reject expense reimbursements" },
  { code: "expense:delete", module: "FINANCE", resource: "EXPENSE", action: "DELETE", description: "Purge expense claims" },
  
  { code: "asset:manage", module: "ADMIN", resource: "ASSET", action: "UPDATE", description: "Manage hardware and software assets" },
  { code: "audit:read", module: "ADMIN", resource: "TENANT", action: "READ", description: "View security audit trails and loggers" },
  { code: "system:restore", module: "ADMIN", resource: "TENANT", action: "UPDATE", description: "Recover soft-deleted records" },
];

async function main() {
  console.log("Cleaning database tables...");
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
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

  console.log("Creating Enterprise Tenant...");
  const tenant = await prisma.tenant.create({
    data: {
      name: "Kenzo Infosystems Pvt Ltd",
      domain: "kenzoinfosystems.com",
      settings: {
        theme: "light",
        primaryColor: "#0284c7",
      },
    },
  });

  console.log("Seeding System Permissions...");
  const createdPermissions = {};
  for (const perm of SYSTEM_PERMISSIONS) {
    const created = await prisma.permission.create({ data: perm });
    createdPermissions[perm.code] = created.id;
  }

  console.log("Seeding System Roles & Permission Matrix...");
  const systemRoles = [
    { name: "Company Administrator", code: "COMPANY_ADMIN", description: "Full administrative governance over tenant assets and users" },
    { name: "Chief Executive Officer", code: "CEO", description: "Strategic executive overview and expenditure approval" },
    { name: "HR Manager", code: "HR", description: "Human resources, headcount, leave approval, and compensation governance" },
    { name: "Project Manager", code: "PROJECT_MANAGER", description: "Project planning, task delegation, and timeline management" },
    { name: "Software Developer", code: "DEVELOPER", description: "Individual contributor task execution and workspace management" },
    { name: "Finance Manager", code: "FINANCE", description: "Financial ledgers, customer billing, and expense management" },
  ];

  const roleMap = {};
  for (const r of systemRoles) {
    const roleRecord = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: r.name,
        code: r.code,
        description: r.description,
        isSystem: true,
      },
    });
    roleMap[r.code] = roleRecord;
  }

  // Link permissions to roles
  for (const permCode of Object.keys(createdPermissions)) {
    // Admin gets all permissions
    await prisma.rolePermission.create({
      data: {
        roleId: roleMap["COMPANY_ADMIN"].id,
        permissionId: createdPermissions[permCode],
      },
    });
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Creating Target Enterprise Users...");

  // 1. Admin
  const userAdmin = await prisma.user.create({
    data: {
      email: "admin@kenzo.com",
      name: "Jitendar Saini",
      passwordHash,
      role: "COMPANY_ADMIN",
      tenantId: tenant.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: userAdmin.id, roleId: roleMap["COMPANY_ADMIN"].id },
  });
  await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      userId: userAdmin.id,
      firstName: "Jitendar",
      lastName: "Saini",
      department: "ADMINISTRATION",
      position: "Company Administrator",
      status: "ACTIVE",
      salary: "120000.00",
    },
  });

  // 2. CEO
  const userCeo = await prisma.user.create({
    data: {
      email: "ceo@kenzo.com",
      name: "Ankit Sethi",
      passwordHash,
      role: "CEO",
      tenantId: tenant.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: userCeo.id, roleId: roleMap["CEO"].id },
  });
  await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      userId: userCeo.id,
      firstName: "Ankit",
      lastName: "Sethi",
      department: "MANAGEMENT",
      position: "Chief Executive Officer",
      status: "ACTIVE",
      salary: "250000.00",
    },
  });

  // 3. HR
  const userHr = await prisma.user.create({
    data: {
      email: "hr@kenzo.com",
      name: "Chanchal Saini",
      passwordHash,
      role: "HR",
      tenantId: tenant.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: userHr.id, roleId: roleMap["HR"].id },
  });
  await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      userId: userHr.id,
      firstName: "Chanchal",
      lastName: "Saini",
      department: "HR",
      position: "HR Manager",
      status: "ACTIVE",
      salary: "80000.00",
    },
  });

  // 4. Developer
  const userDev = await prisma.user.create({
    data: {
      email: "dev@kenzo.com",
      name: "Sujal Kumar",
      passwordHash,
      role: "DEVELOPER",
      tenantId: tenant.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: userDev.id, roleId: roleMap["DEVELOPER"].id },
  });
  const empDev = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      userId: userDev.id,
      firstName: "Sujal",
      lastName: "Kumar",
      department: "ENGINEERING",
      position: "Developer",
      status: "ACTIVE",
      salary: "95000.00",
    },
  });

  // 5. Project Manager
  const userPm = await prisma.user.create({
    data: {
      email: "pm@kenzo.com",
      name: "Laxmi Narayan Ojha",
      passwordHash,
      role: "PROJECT_MANAGER",
      tenantId: tenant.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: userPm.id, roleId: roleMap["PROJECT_MANAGER"].id },
  });
  await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      userId: userPm.id,
      firstName: "Laxmi Narayan",
      lastName: "Ojha",
      department: "ENGINEERING",
      position: "Project Manager",
      status: "ACTIVE",
      salary: "110000.00",
    },
  });

  console.log("Seeding Projects & Tasks...");
  const project1 = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      name: "OneERP Enterprise Core Architecture",
      description: "Mandatory refactor to SAP/Oracle enterprise standards",
      status: "ACTIVE",
      startDate: new Date("2026-07-01"),
      budget: "150000.00",
    },
  });

  await prisma.task.create({
    data: {
      tenantId: tenant.id,
      projectId: project1.id,
      title: "Implement Enterprise RBAC Authorization Engine",
      description: "Replace simple string role with multi-role matrix & permission engine",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      assigneeId: empDev.id,
      dueDate: new Date("2026-07-30"),
    },
  });

  console.log("Enterprise database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
