import { PrismaClient, Role, PhaseType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      plan: 'professional',
    },
  });

  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      emailVerified: true,
      organizationId: org.id,
    },
  });

  const facilitatorHash = await bcrypt.hash('facilitator123', 12);
  const facilitator = await prisma.user.upsert({
    where: { email: 'facilitator@acme.com' },
    update: {},
    create: {
      email: 'facilitator@acme.com',
      name: 'Jane Facilitator',
      passwordHash: facilitatorHash,
      role: Role.FACILITATOR,
      emailVerified: true,
      organizationId: org.id,
    },
  });

  const logisticsArea = await prisma.organizationArea.upsert({
    where: { name_organizationId: { name: 'Logistics', organizationId: org.id } },
    update: {},
    create: { name: 'Logistics', organizationId: org.id },
  });

  const qualityCategory = await prisma.projectCategory.upsert({
    where: { name_organizationId: { name: 'Quality', organizationId: org.id } },
    update: {},
    create: { name: 'Quality', color: '#111111', organizationId: org.id },
  });

  const project = await prisma.project.upsert({
    where: { code_organizationId: { code: 'PDCA-2024-001', organizationId: org.id } },
    update: {},
    create: {
      code: 'PDCA-2024-001',
      name: 'Reduce Delivery Lead Time',
      description: 'Reduce average delivery lead time from 5 days to 2 days using Lean tools.',
      problemStatement: 'Average delivery lead time is 5 days, causing customer dissatisfaction.',
      goals: 'Reduce delivery lead time to 2 days within 90 days.',
      methodology: 'PDCA',
      currentPhase: PhaseType.PLAN,
      organizationId: org.id,
      ownerId: facilitator.id,
      categoryId: qualityCategory.id,
      areaId: logisticsArea.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: {},
    create: { projectId: project.id, userId: admin.id, role: Role.MANAGER },
  });

  for (const phase of [PhaseType.PLAN, PhaseType.DO, PhaseType.CHECK, PhaseType.ACT]) {
    await prisma.projectPhase.upsert({
      where: { projectId_phase: { projectId: project.id, phase } },
      update: {},
      create: {
        projectId: project.id,
        phase,
        status: phase === PhaseType.PLAN ? 'IN_PROGRESS' : 'NOT_STARTED',
      },
    });
  }

  console.log('✅ Database seeded successfully');
  console.log(`   Admin:       admin@acme.com / admin123`);
  console.log(`   Facilitator: facilitator@acme.com / facilitator123`);
  console.log(`   Org:         ${org.name} (${org.slug})`);
  console.log(`   Project:     ${project.code} — ${project.name}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
