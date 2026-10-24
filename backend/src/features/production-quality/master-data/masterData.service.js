import prisma from "../../../db/prisma.js";
import { ApiError } from "../../../utils/apiResponse.js";

export const DEFAULT_MASTER_DROPDOWNS = {
  productionLine: [
    "Line A · Continuous Coating",
    "Line B · Automated Threading",
    "Line C · Finishing & Inspection",
    "Line D · Chemical Treatment",
  ],
  machine: [
    "Line A · Continuous Coating",
    "Line B · Automated Threading",
    "Line C · Finishing & Inspection",
    "Line D · Chemical Treatment",
    "M-01 CNC Lathe",
    "M-02 Thread Roller",
    "Furnace-01",
  ],
  workCenter: [
    "Copper Bonding Station",
    "Thread Rolling Station",
    "Chemical Treatment Bay",
    "Final Quality & Packaging",
  ],
  downtimeReason: [
    "Tooling Changeover",
    "Mechanical Breakdown",
    "Electrical Fault",
    "Material Shortage",
    "Routine Maintenance",
    "Operator Break",
    "Quality Parameter Check",
  ],
  scrapReason: [
    "Surface Oxidation",
    "Diameter Tolerance Exceeded",
    "Thread Stripping",
    "Plating Peeling / Blistering",
    "Core Bending",
    "Handling Damage",
  ],
  defectType: [
    "Metallurgical Defect / Core Flaw",
    "Coating Adhesion Failure / Peeling",
    "Critical Dimensional Variance",
    "Electrical Resistance Exceeds Spec",
    "Severe Surface Porosity / Pitting",
  ],
  rejectionReason: [
    "Sub-optimal plating immersion timing or surface oxidation",
    "Thread pitch misalignment on rolling die",
    "Current density fluctuation during electrodeposition",
    "Minor surface porosity / burrs on terminal ends",
    "Core steel rod straightness deviation",
  ],
  correctiveAction: [
    "Re-dip in degreasing & electroplating bath",
    "Re-thread & calibrate die clearance",
    "Quarantine batch for metallurgical core test",
    "Scrap & log material loss report",
  ],
};

const ALLOWED_MASTER_CATEGORIES = Object.keys(DEFAULT_MASTER_DROPDOWNS);

export function normalizeCategory(category) {
  if (!category || typeof category !== "string") return "";
  const cleaned = category.trim().toLowerCase().replace(/[-_ ]/g, "");
  const match = ALLOWED_MASTER_CATEGORIES.find(
    (c) => c.toLowerCase() === cleaned
  );
  return match || category;
}

// Roles authorized to add custom master dropdown values
const AUTHORIZED_ROLES = [
  "ADMIN",
  "PRODUCTION_MANAGER",
  "QUALITY_ENGINEER",
  "OPERATIONS_DIRECTOR",
  "SUPER_ADMIN",
  "MANAGEMENT",
];

export class MasterDataService {
  /**
   * Retrieves dropdown options for a given category (or all categories if not specified)
   */
  static async getDropdownOptions(category) {
    const normCategory = category ? normalizeCategory(category) : undefined;
    if (normCategory && !ALLOWED_MASTER_CATEGORIES.includes(normCategory)) {
      throw ApiError.badRequest(
        `Invalid dropdown category '${category}'. Allowed categories: ${ALLOWED_MASTER_CATEGORIES.join(", ")}`
      );
    }

    const categoriesToFetch = normCategory ? [normCategory] : ALLOWED_MASTER_CATEGORIES;

    // Fetch custom options from database
    let customRows = [];
    try {
      if (normCategory) {
        customRows = await prisma.$queryRaw`
          SELECT id, category, label, value, description, "createdById", "createdAt"
          FROM "CustomDropdownOption"
          WHERE category = ${normCategory}
          ORDER BY label ASC
        `;
      } else {
        customRows = await prisma.$queryRaw`
          SELECT id, category, label, value, description, "createdById", "createdAt"
          FROM "CustomDropdownOption"
          ORDER BY category ASC, label ASC
        `;
      }
    } catch (err) {
      console.warn("Could not query CustomDropdownOption table:", err.message);
    }

    const result = {};

    for (const cat of categoriesToFetch) {
      const defaultList = DEFAULT_MASTER_DROPDOWNS[cat] || [];
      const customForCat = customRows.filter((r) => r.category === cat);

      // Merge defaults with custom values ensuring uniqueness
      const mergedOptions = [];
      const seen = new Set();

      for (const item of defaultList) {
        const key = item.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          mergedOptions.push({
            value: item,
            label: item,
            category: cat,
            isCustom: false,
          });
        }
      }

      for (const custom of customForCat) {
        const key = custom.value.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          mergedOptions.push({
            id: custom.id,
            value: custom.value,
            label: custom.label || custom.value,
            description: custom.description || null,
            category: cat,
            isCustom: true,
            createdAt: custom.createdAt,
          });
        }
      }

      result[cat] = mergedOptions;
    }

    return normCategory ? result[normCategory] : result;
  }

  /**
   * Creates a new custom dropdown option in the database
   */
  static async createDropdownOption(data, user) {
    // 1. Role permission check
    const userRole = (user?.role || "").toUpperCase();
    if (!AUTHORIZED_ROLES.includes(userRole)) {
      throw ApiError.forbidden("You do not have permission to add a new value.");
    }

    const rawCategory = normalizeCategory(data.category?.trim());
    const rawLabel = (data.label || data.value || "").trim();
    const rawDescription = data.description?.trim() || null;

    if (!rawCategory || !ALLOWED_MASTER_CATEGORIES.includes(rawCategory)) {
      throw ApiError.badRequest(
        `Invalid or missing category. Allowed categories: ${ALLOWED_MASTER_CATEGORIES.join(", ")}`
      );
    }

    if (!rawLabel) {
      throw ApiError.badRequest("Please enter a value.");
    }

    if (rawLabel.length < 2) {
      throw ApiError.badRequest("Custom value must be at least 2 characters long.");
    }

    if (rawLabel.length > 120) {
      throw ApiError.badRequest("Custom value cannot exceed 120 characters.");
    }

    // 2. Case-insensitive duplicate check against defaults
    const defaults = DEFAULT_MASTER_DROPDOWNS[rawCategory] || [];
    const lowerVal = rawLabel.toLowerCase();
    const duplicateDefault = defaults.find((d) => d.toLowerCase() === lowerVal);
    if (duplicateDefault) {
      throw ApiError.conflict("This value already exists.");
    }

    // 3. Case-insensitive duplicate check against database
    const existingDb = await prisma.$queryRaw`
      SELECT id, value FROM "CustomDropdownOption"
      WHERE category = ${rawCategory} AND LOWER(value) = ${lowerVal}
      LIMIT 1
    `;

    if (existingDb && existingDb.length > 0) {
      throw ApiError.conflict("This value already exists.");
    }

    // 4. Insert into database
    const createdById = user?.id ? Number(user.id) : null;
    const insertResult = await prisma.$queryRaw`
      INSERT INTO "CustomDropdownOption" ("category", "label", "value", "description", "createdById", "createdAt", "updatedAt")
      VALUES (${rawCategory}, ${rawLabel}, ${rawLabel}, ${rawDescription}, ${createdById}, NOW(), NOW())
      RETURNING id, category, label, value, description, "createdById", "createdAt"
    `;

    const created = insertResult[0];

    return {
      id: created.id,
      category: created.category,
      label: created.label,
      value: created.value,
      description: created.description,
      isCustom: true,
      createdAt: created.createdAt,
    };
  }
}
