import { z } from "zod";

export const scheduleInstallationSchema = z.object({
  projectId: z.coerce.number().int().positive("Project ID is required"),
  installationNo: z.string().max(50).optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateInstallationStatusSchema = z.object({
  status: z.enum([
    "NOT_REQUIRED",
    "SURVEY_DUE",
    "PLANNED",
    "SCHEDULED",
    "IN_PROGRESS",
    "TESTING",
    "HANDOVER_PENDING",
    "COMPLETED",
    "BLOCKED"
  ]),
  notes: z.string().max(1000).optional().nullable(),
});

export const recordTestResultsSchema = z.object({
  earthResistanceOhms: z.coerce.number().min(0, "Earth resistance must be positive"),
  soilResistivity: z.coerce.number().optional().nullable(),
  pitCondition: z.enum(["EXCELLENT", "SATISFACTORY", "SUB_STANDARD"]),
  gridContinuityPassed: z.boolean(),
  mandatoryChecklist: z.object({
    pitExcavationVerified: z.boolean(),
    backfillCompoundApplied: z.boolean(),
    copperBondingInspected: z.boolean(),
    safetySignageInstalled: z.boolean(),
  }),
  testedBy: z.string().min(2, "Tester name is required"),
  correctiveActions: z.string().optional().nullable(),
});

export const completeHandoverSchema = z.object({
  customerSignoffName: z.string().min(2, "Customer signoff name is required"),
  customerSignedAt: z.coerce.date().default(() => new Date()),
  proofOfWork: z.any().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
