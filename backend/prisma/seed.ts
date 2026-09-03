import prisma from "../src/modules/shared/db/prisma.js";
import { hashPassword } from "../src/modules/shared/utils/security.js";

async function main() {
  console.log("Seeding database with initial department and dummy employees...");

  // 1. Ensure default Department exists
  let engineeringDept = await prisma.department.findFirst({
    where: { departmentName: "Engineering" },
  });

  if (!engineeringDept) {
    engineeringDept = await prisma.department.create({
      data: {
        departmentName: "Engineering",
        obsolete: false,
      },
    });
    console.log(`Created Department: Engineering (ID: ${engineeringDept.departmentId})`);
  }

  // 2. Dummy Employees Configuration
  const dummyEmployees = [
    {
      firstName: "Alice",
      lastName: "Stone",
      email: "alice.admin@example.com",
      password: "AdminPassword123!",
      role: "admin",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
    },
    {
      firstName: "Bob",
      lastName: "Smith",
      email: "bob.employee@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
    },
    {
      firstName: "Charlie",
      lastName: "Vance",
      email: "charlie.guest@example.com",
      password: "GuestPassword123!",
      role: "guest_admin",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
    },
  ];

  for (const emp of dummyEmployees) {
    const existing = await prisma.employee.findUnique({
      where: { email: emp.email },
    });

    const passwordHash = await hashPassword(emp.password);

    if (!existing) {
      const created = await prisma.employee.create({
        data: {
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          passwordHash,
          role: emp.role,
          departmentId: emp.departmentId,
          status: emp.status,
          obsolete: false,
        },
      });
      console.log(`Created ${emp.role}: ${created.firstName} ${created.lastName} (${created.email})`);
    } else {
      await prisma.employee.update({
        where: { email: emp.email },
        data: {
          passwordHash,
          role: emp.role,
          status: emp.status,
          obsolete: false,
        },
      });
      console.log(`Updated ${emp.role}: ${existing.firstName} ${existing.lastName} (${existing.email})`);
    }
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
