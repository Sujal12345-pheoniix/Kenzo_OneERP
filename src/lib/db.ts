import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const rawDb =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = rawDb;

const SOFT_DELETE_MODELS = [
  "Tenant", "User", "Employee", "Attendance", "Leave",
  "Project", "Task", "Lead", "Invoice", "Expense", "Asset"
];

function hasIsDeleted(modelName: string): boolean {
  if (!modelName) return false;
  const normalized = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  return SOFT_DELETE_MODELS.includes(normalized);
}

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
      async findUnique({ args, query }) {
        const result = await query(args);
        if (result && (result as any).isDeleted === true) {
          return null;
        }
        return result;
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

export default db;
