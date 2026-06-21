import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.createMany({
    data: [
      {
        email: 'customer@example.com',
        name: '测试客户',
        role: UserRole.customer,
        company: 'ABC科技有限公司',
        phone: '13800138001',
        passwordHash,
      },
      {
        email: 'sales@example.com',
        name: '张销售',
        role: UserRole.sales,
        phone: '13800138002',
        passwordHash,
      },
      {
        email: 'warehouse@example.com',
        name: '李仓管',
        role: UserRole.warehouse,
        phone: '13800138003',
        passwordHash,
      },
      {
        email: 'legal@example.com',
        name: '王法务',
        role: UserRole.legal,
        phone: '13800138004',
        passwordHash,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.sample.createMany({
    data: [
      {
        name: '智能路由器 Pro',
        model: 'RT-Pro-2024',
        serialNumber: 'SN001',
        description: '企业级双频千兆路由器，支持Mesh组网',
        value: 5000,
        depositAmount: 5000,
        status: 'available',
      },
      {
        name: 'IoT 开发板',
        model: 'IOT-DEV-V2',
        serialNumber: 'SN002',
        description: '支持WiFi6/BLE/Zigbee的多协议开发板',
        value: 3200,
        depositAmount: 3200,
        status: 'available',
      },
      {
        name: '5G 测试模组',
        model: '5G-MOD-X1',
        serialNumber: 'SN003',
        description: '高通X62芯片的5G工业级模组',
        value: 12000,
        depositAmount: 12000,
        status: 'available',
      },
      {
        name: '边缘计算网关',
        model: 'EDGE-GW-100',
        serialNumber: 'SN004',
        description: '支持Docker部署的工业边缘网关',
        value: 8500,
        depositAmount: 8500,
        status: 'available',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created successfully!');
  console.log('Test accounts:');
  console.log('  customer@example.com / password123');
  console.log('  sales@example.com / password123');
  console.log('  warehouse@example.com / password123');
  console.log('  legal@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
