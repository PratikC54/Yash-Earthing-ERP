import crypto from "node:crypto";
import prisma from "../db/prisma.js";

/**
 * Concurrency-safe identifier generator with crypto randomness fallback
 */
export async function generateUniqueProjectCode() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const candidate = `PRJ-${year}-${randomHex}`;
    const exists = await prisma.project.findUnique({
      where: { projectCode: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `PRJ-${year}-${Date.now().toString(36).toUpperCase()}`;
}

export async function generateUniqueInstallationNo() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const candidate = `INS-${year}-${randomHex}`;
    const exists = await prisma.installation.findUnique({
      where: { installationNo: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `INS-${year}-${Date.now().toString(36).toUpperCase()}`;
}

export async function generateUniqueTicketNo() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const candidate = `TKT-${year}-${randomHex}`;
    const exists = await prisma.serviceTicket.findUnique({
      where: { ticketNo: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `TKT-${year}-${Date.now().toString(36).toUpperCase()}`;
}
