import prisma from "../src/db/prisma.js";

async function runMigration() {
  console.log("Starting DB migration for Notification and EscalationRule...");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "qrCode" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrder_qrCode_key" ON "WorkOrder"("qrCode");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" SERIAL PRIMARY KEY,
      "recipientId" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
      "status" TEXT NOT NULL DEFAULT 'UNREAD',
      "readAt" TIMESTAMP(3),
      "link" TEXT,
      "entityType" TEXT,
      "entityId" INTEGER,
      "dedupKey" TEXT,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Notification_recipientId_dedupKey_key" ON "Notification"("recipientId", "dedupKey");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Notification_recipientId_status_createdAt_idx" ON "Notification"("recipientId", "status", "createdAt");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EscalationRule" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "level" INTEGER NOT NULL DEFAULT 1,
      "thresholdHours" INTEGER NOT NULL DEFAULT 24,
      "targetRoles" TEXT[] NOT NULL DEFAULT '{}',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "EscalationRule_eventType_level_key" ON "EscalationRule"("eventType", "level");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "EscalationRule_eventType_isActive_idx" ON "EscalationRule"("eventType", "isActive");
  `);

  console.log("Tables and indexes successfully verified/created in database!");

  // Seed default escalation rules
  const count = await prisma.escalationRule.count();
  if (count === 0) {
    await prisma.escalationRule.createMany({
      data: [
        {
          name: "WO Overdue - Level 1 (Shift Supervisor)",
          eventType: "WO_OVERDUE",
          level: 1,
          thresholdHours: 0,
          targetRoles: ["PRODUCTION_MANAGER", "ENGINEER"],
        },
        {
          name: "WO Overdue - Level 2 (Production Head)",
          eventType: "WO_OVERDUE",
          level: 2,
          thresholdHours: 24,
          targetRoles: ["PRODUCTION_MANAGER", "ADMIN"],
        },
        {
          name: "WO Overdue - Level 3 (General Management)",
          eventType: "WO_OVERDUE",
          level: 3,
          thresholdHours: 48,
          targetRoles: ["ADMIN"],
        },
        {
          name: "Inspection Overdue - Level 1 (QC Inspector)",
          eventType: "INSPECTION_OVERDUE",
          level: 1,
          thresholdHours: 4,
          targetRoles: ["QUALITY_INSPECTOR"],
        },
        {
          name: "Inspection Overdue - Level 2 (Quality Manager)",
          eventType: "INSPECTION_OVERDUE",
          level: 2,
          thresholdHours: 12,
          targetRoles: ["QUALITY_INSPECTOR", "PRODUCTION_MANAGER"],
        },
        {
          name: "Inspection Overdue - Level 3 (Plant Admin)",
          eventType: "INSPECTION_OVERDUE",
          level: 3,
          thresholdHours: 24,
          targetRoles: ["ADMIN"],
        },
        {
          name: "Critical Defect - Immediate Escalation",
          eventType: "CRITICAL_DEFECT",
          level: 1,
          thresholdHours: 0,
          targetRoles: ["QUALITY_INSPECTOR", "PRODUCTION_MANAGER", "ADMIN"],
        },
      ],
    });
    console.log("Default escalation rules successfully seeded!");
  }

  const notifCount = await prisma.notification.count();
  const ruleCount = await prisma.escalationRule.count();
  console.log("Verification:", { notifCount, ruleCount });
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
