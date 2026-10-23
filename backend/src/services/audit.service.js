import prisma from "../db/prisma.js";

export class AuditService {
  /**
   * Records an audit log entry for any critical state mutation
   */
  static async record({
    userId = null,
    action,
    entityType,
    entityId,
    before = null,
    after = null,
    ipAddress = null,
    client = prisma,
  }) {
    try {
      return await client.auditLog.create({
        data: {
          userId: userId ? Number(userId) : null,
          action,
          entityType,
          entityId: String(entityId),
          before: before ? JSON.parse(JSON.stringify(before)) : null,
          after: after ? JSON.parse(JSON.stringify(after)) : null,
          ipAddress: ipAddress ? String(ipAddress) : null,
        },
      });
    } catch (err) {
      // Audit log failures should not crash the transaction if non-blocking,
      // but if inside a transaction, client will handle rollbacks if required.
      console.error(`[AuditService Error] Failed to record audit log for ${entityType}:${entityId}`, err);
      return null;
    }
  }

  /**
   * Retrieves audit history for an entity
   */
  static async getHistory(entityType, entityId) {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId: String(entityId),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Safely map BigInt id to string for JSON responses
    return logs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));
  }
}

export default AuditService;
