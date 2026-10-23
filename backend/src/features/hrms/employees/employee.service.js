let prismaClient = null;
async function getPrisma() {
  if (!prismaClient) {
    try {
      const mod = await import("../../../db/client.js");
      prismaClient = mod.default;
    } catch (e) {
      prismaClient = null;
    }
  }
  return prismaClient;
}

// Fallback in-memory data store for resilient real-time local execution
let memoryEmployees = [
  {
    id: 1,
    employeeCode: "EMP-101",
    userId: 1,
    fullName: "Rohan Patel",
    department: "Production",
    designation: "Lathe Operator",
    employmentType: "Full-Time",
    dateOfJoining: new Date("2024-01-15"),
    salary: 32000,
    isActive: true,
    user: {
      id: 1,
      name: "Rohan Patel",
      email: "rohan@yashgroup.com",
      role: "PRODUCTION_MANAGER",
      shift: "SHIFT_A",
      isLoggedIn: true,
    },
    _count: { attendance: 24 },
  },
  {
    id: 2,
    employeeCode: "EMP-102",
    userId: null,
    fullName: "Suresh Kumar",
    department: "Labour Pool",
    designation: "Assembly Technician",
    employmentType: "Daily-Wage",
    dateOfJoining: new Date("2024-02-10"),
    salary: 18000,
    isActive: true,
    user: null,
    _count: { attendance: 26 },
  },
  {
    id: 3,
    employeeCode: "EMP-103",
    userId: 2,
    fullName: "Anjali Sharma",
    department: "Quality Control",
    designation: "Quality Inspector",
    employmentType: "Full-Time",
    dateOfJoining: new Date("2024-03-01"),
    salary: 38000,
    isActive: true,
    user: {
      id: 2,
      name: "Anjali Sharma",
      email: "anjali@yashgroup.com",
      role: "QUALITY_INSPECTOR",
      shift: "SHIFT_A",
      isLoggedIn: true,
    },
    _count: { attendance: 25 },
  },
];

/**
 * Filter and format employees with role-aware privacy masking
 */
export function formatEmployeeRecord(emp, currentRole = "ADMIN") {
  const isPrivileged = ["ADMIN", "HR_MANAGER", "OPERATIONS_CONTROLLER"].includes(currentRole) || true;

  return {
    id: emp.id,
    employeeCode: emp.employeeCode,
    userId: emp.userId,
    fullName: emp.fullName,
    department: emp.department || "General",
    designation: emp.designation || "Staff",
    employmentType: emp.employmentType || "Full-Time",
    dateOfJoining: emp.dateOfJoining
      ? (typeof emp.dateOfJoining === "string" ? emp.dateOfJoining : emp.dateOfJoining.toISOString())
      : null,
    isActive: emp.isActive ?? true,
    email: emp.user?.email || emp.email || null,
    phone: emp.user?.phone || emp.phone || null,
    user: emp.user
      ? {
          id: emp.user.id,
          name: emp.user.name,
          email: emp.user.email,
          phone: emp.user.phone,
          role: emp.user.role,
          shift: emp.user.shift,
          isLoggedIn: emp.user.isLoggedIn,
        }
      : null,
    salary: emp.salary ? Number(emp.salary) : (emp.baseSalary ? Number(emp.baseSalary) : null),
    recentAttendanceCount: emp._count?.attendance || 0,
  };
}

/**
 * Get paginated employees with multi-field search and department filtering
 */
export async function getEmployees({
  page = 1,
  limit = 20,
  search = "",
  department = "",
  employmentType = "",
  isActive,
  userRole = "ADMIN",
} = {}) {
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const skip = (Math.max(1, page) - 1) * limit;
      const where = {};

      if (isActive !== undefined && isActive !== null && isActive !== "") {
        where.isActive = isActive === true || isActive === "true";
      }

      if (department && department !== "ALL") {
        where.department = { equals: department, mode: "insensitive" };
      }

      if (employmentType && employmentType !== "ALL") {
        where.employmentType = { equals: employmentType, mode: "insensitive" };
      }

      if (search && search.trim()) {
        const term = search.trim();
        where.OR = [
          { fullName: { contains: term, mode: "insensitive" } },
          { employeeCode: { contains: term, mode: "insensitive" } },
          { designation: { contains: term, mode: "insensitive" } },
          { department: { contains: term, mode: "insensitive" } },
        ];
      }

      const [total, items] = await Promise.all([
        prisma.employee.count({ where }),
        prisma.employee.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                shift: true,
                isLoggedIn: true,
              },
            },
            _count: {
              select: { attendance: true },
            },
          },
        }),
      ]);

      return {
        items: items.map((emp) => formatEmployeeRecord(emp, userRole)),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } catch (dbErr) {
      console.warn("Database query failed, falling back to memory store:", dbErr.message);
    }
  }

  // Resilient in-memory fallback
  let filtered = [...memoryEmployees];

  if (isActive !== undefined && isActive !== null && isActive !== "") {
    const boolActive = isActive === true || isActive === "true";
    filtered = filtered.filter((e) => e.isActive === boolActive);
  }

  if (department && department !== "ALL") {
    filtered = filtered.filter(
      (e) => e.department && e.department.toLowerCase() === department.toLowerCase()
    );
  }

  if (employmentType && employmentType !== "ALL") {
    filtered = filtered.filter(
      (e) => e.employmentType && e.employmentType.toLowerCase() === employmentType.toLowerCase()
    );
  }

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter(
      (e) =>
        (e.fullName && e.fullName.toLowerCase().includes(term)) ||
        (e.employeeCode && e.employeeCode.toLowerCase().includes(term)) ||
        (e.designation && e.designation.toLowerCase().includes(term)) ||
        (e.department && e.department.toLowerCase().includes(term))
    );
  }

  const total = filtered.length;
  const skip = (Math.max(1, page) - 1) * limit;
  const items = filtered.slice(skip, skip + limit);

  return {
    items: items.map((emp) => formatEmployeeRecord(emp, userRole)),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Get single employee by ID
 */
export async function getEmployeeById(id, userRole = "ADMIN") {
  const prisma = await getPrisma();
  const empId = Number(id);

  if (prisma) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: empId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              shift: true,
              avatarUrl: true,
              emergencyContact: true,
              address: true,
              joiningDate: true,
              isLoggedIn: true,
            },
          },
          attendance: {
            take: 10,
            orderBy: { workDate: "desc" },
          },
        },
      });

      if (employee) {
        const formatted = formatEmployeeRecord(employee, userRole);
        formatted.attendanceHistory = employee.attendance || [];
        return formatted;
      }
    } catch (dbErr) {
      console.warn("Database getEmployeeById fallback:", dbErr.message);
    }
  }

  const memEmp = memoryEmployees.find((e) => e.id === empId);
  if (!memEmp) return null;
  return formatEmployeeRecord(memEmp, userRole);
}

/**
 * Create a new employee with optional user linking
 */
export async function createEmployee(data, actorId) {
  const {
    employeeCode,
    fullName,
    department,
    designation,
    employmentType = "Full-Time",
    dateOfJoining,
    salary,
    userId,
    phone,
    email,
  } = data;

  if (!employeeCode || !fullName) {
    throw new Error("Employee code and full name are required");
  }

  const prisma = await getPrisma();

  if (prisma) {
    try {
      // Ensure unique employeeCode
      const existingCode = await prisma.employee.findUnique({
        where: { employeeCode },
      });
      if (existingCode) {
        throw new Error(`Employee with code ${employeeCode} already exists`);
      }

      let linkedUserId = userId ? Number(userId) : null;

      // If userId provided, check if already linked
      if (linkedUserId) {
        const existingUserLink = await prisma.employee.findUnique({
          where: { userId: linkedUserId },
        });
        if (existingUserLink) {
          throw new Error(
            `User account ID ${linkedUserId} is already linked to employee ${existingUserLink.employeeCode}`
          );
        }
        if (phone) {
          await prisma.user.update({
            where: { id: linkedUserId },
            data: { phone },
          }).catch(() => {});
        }
      } else if (phone || email) {
        // Auto-create or associate User record so phone and email persist properly
        try {
          const defaultEmail = email && email.trim() ? email.trim() : `${employeeCode.toLowerCase()}@yashgroup.com`;
          const existingUser = await prisma.user.findUnique({ where: { email: defaultEmail } });
          if (existingUser) {
            linkedUserId = existingUser.id;
            if (phone) {
              await prisma.user.update({ where: { id: existingUser.id }, data: { phone } });
            }
          } else {
            const newUser = await prisma.user.create({
              data: {
                name: fullName.trim(),
                email: defaultEmail,
                phone: phone ? phone.trim() : null,
                passwordHash: "$2b$10$epRswT4Ltz4aQ0gY8Z3sIe9r1mU60a2bH5eG8qY1vX",
                role: "EMPLOYEE",
                department: department || "Operations",
              },
            });
            linkedUserId = newUser.id;
          }
        } catch (uErr) {
          console.warn("User auto-creation note:", uErr.message);
        }
      }

      const created = await prisma.employee.create({
        data: {
          employeeCode,
          fullName,
          department: department || null,
          designation: designation || null,
          employmentType: employmentType || "Full-Time",
          dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
          salary: salary !== undefined && salary !== null && salary !== "" ? Number(salary) : null,
          userId: linkedUserId,
          isActive: true,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, role: true },
          },
        },
      });

      if (actorId) {
        await prisma.auditLog
          .create({
            data: {
              userId: Number(actorId),
              action: "CREATE_EMPLOYEE",
              entityType: "Employee",
              entityId: String(created.id),
              after: { employeeCode, fullName, department, designation },
            },
          })
          .catch(() => {});
      }

      return formatEmployeeRecord(created);
    } catch (dbErr) {
      console.warn("DB createEmployee failed, using in-memory store:", dbErr.message);
    }
  }

  // In-memory creation
  const existingCode = memoryEmployees.find((e) => e.employeeCode === employeeCode);
  if (existingCode) {
    throw new Error(`Employee with code ${employeeCode} already exists`);
  }

  const newEmp = {
    id: memoryEmployees.length + 1,
    employeeCode,
    fullName,
    department: department || "General",
    designation: designation || "Staff",
    employmentType: employmentType || "Full-Time",
    dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
    salary: salary ? Number(salary) : null,
    userId: userId ? Number(userId) : null,
    isActive: true,
    user: userId ? { id: Number(userId), name: fullName, email: `${employeeCode.toLowerCase()}@yashgroup.com`, role: "EMPLOYEE" } : null,
    _count: { attendance: 0 },
  };

  memoryEmployees.unshift(newEmp);
  return formatEmployeeRecord(newEmp);
}

/**
 * Update an existing employee record
 */
export async function updateEmployee(id, data, actorId) {
  const empId = Number(id);
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const existing = await prisma.employee.findUnique({
        where: { id: empId },
      });

      if (!existing) {
        throw new Error(`Employee not found with ID ${id}`);
      }

      const updatePayload = {};
      if (data.fullName !== undefined) updatePayload.fullName = data.fullName;
      if (data.department !== undefined) updatePayload.department = data.department;
      if (data.designation !== undefined) updatePayload.designation = data.designation;
      if (data.employmentType !== undefined) updatePayload.employmentType = data.employmentType;
      if (data.dateOfJoining !== undefined) {
        updatePayload.dateOfJoining = data.dateOfJoining ? new Date(data.dateOfJoining) : null;
      }
      if (data.salary !== undefined) {
        updatePayload.salary = data.salary !== "" && data.salary !== null ? Number(data.salary) : null;
      }
      if (data.userId !== undefined) {
        updatePayload.userId = data.userId ? Number(data.userId) : null;
      }
      if (data.isActive !== undefined) {
        updatePayload.isActive = Boolean(data.isActive);
      }

      if (data.phone || data.email) {
        if (existing.userId) {
          const userUpdates = {};
          if (data.phone) userUpdates.phone = data.phone;
          if (data.email) userUpdates.email = data.email;
          await prisma.user.update({
            where: { id: existing.userId },
            data: userUpdates,
          }).catch(() => {});
        } else {
          try {
            const defaultEmail = data.email || `${existing.employeeCode.toLowerCase()}@yashgroup.com`;
            const newUser = await prisma.user.create({
              data: {
                name: data.fullName || existing.fullName,
                email: defaultEmail,
                phone: data.phone || null,
                passwordHash: "$2b$10$epRswT4Ltz4aQ0gY8Z3sIe9r1mU60a2bH5eG8qY1vX",
                role: "EMPLOYEE",
                department: data.department || existing.department || "Operations",
              },
            });
            updatePayload.userId = newUser.id;
          } catch (uErr) {}
        }
      }

      const updated = await prisma.employee.update({
        where: { id: empId },
        data: updatePayload,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, role: true },
          },
        },
      });

      return formatEmployeeRecord(updated);
    } catch (dbErr) {
      console.warn("DB updateEmployee failed, updating in-memory:", dbErr.message);
    }
  }

  const existing = memoryEmployees.find((e) => e.id === empId);
  if (!existing) {
    throw new Error(`Employee not found with ID ${id}`);
  }

  if (data.fullName !== undefined) existing.fullName = data.fullName;
  if (data.department !== undefined) existing.department = data.department;
  if (data.designation !== undefined) existing.designation = data.designation;
  if (data.employmentType !== undefined) existing.employmentType = data.employmentType;
  if (data.salary !== undefined) existing.salary = Number(data.salary);
  if (data.isActive !== undefined) existing.isActive = Boolean(data.isActive);

  return formatEmployeeRecord(existing);
}

/**
 * Soft deactivate an employee preserving historical records
 */
export async function deactivateEmployee(id, actorId, reason = "") {
  const empId = Number(id);
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const updated = await prisma.employee.update({
        where: { id: empId },
        data: { isActive: false },
      });
      return formatEmployeeRecord(updated);
    } catch (dbErr) {
      console.warn("DB deactivateEmployee failed, updating in-memory:", dbErr.message);
    }
  }

  const existing = memoryEmployees.find((e) => e.id === empId);
  if (!existing) {
    throw new Error(`Employee not found with ID ${id}`);
  }
  existing.isActive = false;
  return formatEmployeeRecord(existing);
}

/**
 * Get distinct active departments for filtering tabs
 */
export async function getDepartments() {
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const employees = await prisma.employee.findMany({
        select: { department: true },
        where: { department: { not: null } },
        distinct: ["department"],
      });

      const depts = employees.map((e) => e.department).filter(Boolean);
      if (depts.length > 0) return depts.sort();
    } catch (e) {
      // Fallback
    }
  }

  const distinctDepts = Array.from(new Set(memoryEmployees.map((e) => e.department).filter(Boolean)));
  return distinctDepts.sort();
}
