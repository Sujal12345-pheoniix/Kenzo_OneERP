import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const rawDb =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = rawDb;

/**
 * Priority 04: Soft Delete Client Extension
 * Intercepts queries to filter out soft-deleted records (isDeleted: false) by default.
 */
export const db = rawDb.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (hasIsDeleted(model)) {
          args.where = { isDeleted: false, ...args.where };
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (hasIsDeleted(model)) {
          args.where = { isDeleted: false, ...args.where };
        }
        return query(args);
      },
      async findUnique({ model, args, query }) {
        if (hasIsDeleted(model)) {
          // findUnique requires unique input, convert query behavior via findFirst
          const whereWithFilter = { isDeleted: false, ...args.where };
          return (rawDb as any)[model].findFirst({ ...args, where: whereWithFilter });
        }
        return query(args);
      },
      async count({ model, args, query }) {
        if (hasIsDeleted(model)) {
          args.where = { isDeleted: false, ...args.where };
        }
        return query(args);
      },
    },
  },
});

function hasIsDeleted(modelName: string): boolean {
  const modelsWithSoftDelete = [
    "Tenant", "User", "Employee", "Attendance", "Leave", 
    "Project", "Task", "Lead", "Invoice", "Expense", "Asset"
  ];
  return modelsWithSoftDelete.includes(modelName);
}

export default db;
