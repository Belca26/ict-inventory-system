import { PrismaClient, RoleName, DeviceCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ---------------------------------------------------------------------
  // Roles
  // ---------------------------------------------------------------------
  const roleDefs = [
    { name: RoleName.SYSTEM_ADMIN, description: 'Full system access, user & config management' },
    { name: RoleName.ICT_TECHNICIAN, description: 'Registers devices, performs and logs maintenance' },
    { name: RoleName.DEPARTMENT_REPRESENTATIVE, description: 'Views department assets, confirms maintenance' },
    { name: RoleName.AUDITOR, description: 'Read-only access to reports and records' },
  ];

  const roles: Record<string, string> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    roles[r.name] = role.id;
  }

  // ---------------------------------------------------------------------
  // Departments
  // ---------------------------------------------------------------------
  const departmentNames = ['ICT', 'Finance', 'Registry', 'Library', 'Engineering', 'Administration'];
  for (const name of departmentNames) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------------------
  // Buildings
  // ---------------------------------------------------------------------
  const buildingDefs = [
    { name: 'Main Administration Block', campus: 'Main Campus' },
    { name: 'ICT Building', campus: 'Main Campus' },
    { name: 'Library Complex', campus: 'Main Campus' },
  ];
  for (const b of buildingDefs) {
    await prisma.building.upsert({
      where: { name_campus: { name: b.name, campus: b.campus } },
      update: {},
      create: b,
    });
  }

  // ---------------------------------------------------------------------
  // Asset Types
  // ---------------------------------------------------------------------
  const assetTypeDefs: { name: string; category: DeviceCategory }[] = [
    { name: 'Desktop', category: DeviceCategory.COMPUTER },
    { name: 'Laptop', category: DeviceCategory.COMPUTER },
    { name: 'Server', category: DeviceCategory.COMPUTER },
    { name: 'Printer', category: DeviceCategory.PRINTER },
    { name: 'Scanner', category: DeviceCategory.SCANNER },
    { name: 'Switch', category: DeviceCategory.NETWORK_DEVICE },
    { name: 'Router', category: DeviceCategory.NETWORK_DEVICE },
    { name: 'Access Point', category: DeviceCategory.NETWORK_DEVICE },
    { name: 'UPS', category: DeviceCategory.UPS },
    { name: 'Projector', category: DeviceCategory.PROJECTOR },
  ];
  for (const at of assetTypeDefs) {
    await prisma.assetType.upsert({
      where: { name: at.name },
      update: {},
      create: at,
    });
  }

  // ---------------------------------------------------------------------
  // Manufacturers
  // ---------------------------------------------------------------------
  const manufacturers = ['HP', 'Dell', 'Lenovo', 'Cisco', 'TP-Link', 'MikroTik', 'Ubiquiti', 'APC', 'Canon', 'Epson'];
  for (const name of manufacturers) {
    await prisma.manufacturer.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------------------------------------------------
  // Procedure Types (standard checklist from the maintenance form)
  // ---------------------------------------------------------------------
  const procedureNames = [
    'Cleaning',
    'Antivirus Update',
    'OS Update',
    'Software Installation',
    'ERP Installation',
    'Backup',
    'Domain Configuration',
    'Network Configuration',
    'Hardware Replacement',
    'RAM Upgrade',
    'HDD Replacement',
    'SSD Upgrade',
    'Printer Servicing',
    'Switch Configuration',
    'Cable Replacement',
  ];
  for (const name of procedureNames) {
    await prisma.procedureType.upsert({
      where: { name },
      update: {},
      create: { name, isCustom: false },
    });
  }
  // One catch-all entry for ad-hoc/custom procedures a technician types in
  await prisma.procedureType.upsert({
    where: { name: 'Custom' },
    update: {},
    create: { name: 'Custom', isCustom: true },
  });

  // ---------------------------------------------------------------------
  // Default System Admin user
  // CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN.
  // ---------------------------------------------------------------------
  const adminPasswordHash = await bcrypt.hash('ChangeMe123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@university.ac.ke' },
    update: {},
    create: {
      email: 'admin@university.ac.ke',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      roleId: roles[RoleName.SYSTEM_ADMIN],
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
