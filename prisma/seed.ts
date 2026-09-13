import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@membershub.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@membershub.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      mustChangePassword: false,
      status: "ACTIVE",
    },
  });

  const volume1 = await prisma.product.upsert({
    where: { slug: "pack-de-figurinhas-vol-01" },
    update: {},
    create: {
      name: "Pack de Figurinhas — Volume 01",
      slug: "pack-de-figurinhas-vol-01",
      description:
        "Mais de 50 figurinhas exclusivas para você usar no WhatsApp, Telegram e onde quiser.",
      benefits: "+50 figurinhas exclusivas\nAtualizações liberadas aos poucos\nUso pessoal ilimitado",
      imageUrl: null,
      hotmartProductId: "1000001",
      checkoutUrl: "https://pay.hotmart.com/EXEMPLO-VOL01",
      priceCents: 2990,
      status: "ACTIVE",
      order: 0,
      contents: {
        create: [
          { name: "Volume 01", description: "As figurinhas principais do pack.", order: 0, releaseAfterDays: 0 },
          { name: "Volume 02", description: "Mais figurinhas para você.", order: 1, releaseAfterDays: 3 },
          { name: "Volume 03", description: "Continuação exclusiva.", order: 2, releaseAfterDays: 7 },
          { name: "Bônus", description: "Um presente especial.", order: 3, releaseAfterDays: 14 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "pack-de-figurinhas-vol-02" },
    update: {},
    create: {
      name: "Pack de Figurinhas — Volume 02",
      slug: "pack-de-figurinhas-vol-02",
      description: "A continuação do pack original, com temas totalmente novos.",
      benefits: "+60 figurinhas inéditas\nTemas exclusivos\nAcesso imediato após a compra",
      hotmartProductId: "1000002",
      checkoutUrl: "https://pay.hotmart.com/EXEMPLO-VOL02",
      priceCents: 2990,
      status: "ACTIVE",
      order: 1,
    },
  });

  await prisma.product.upsert({
    where: { slug: "pack-premium" },
    update: {},
    create: {
      name: "Pack Premium",
      slug: "pack-premium",
      description: "Nossa coleção mais completa, com todos os volumes e bônus exclusivos.",
      benefits: "Todos os volumes incluídos\nBônus vitalícios\nSuporte prioritário",
      hotmartProductId: "1000003",
      checkoutUrl: "https://pay.hotmart.com/EXEMPLO-PREMIUM",
      priceCents: 6990,
      status: "ACTIVE",
      order: 2,
    },
  });

  const demoPasswordHash = await bcrypt.hash("demo12345", 12);
  const purchaseDate = new Date();
  purchaseDate.setUTCDate(purchaseDate.getUTCDate() - 2); // comprou há 2 dias: Volume 01 liberado, resto em contagem

  const demoUser = await prisma.user.upsert({
    where: { email: "cliente@example.com" },
    update: {},
    create: {
      name: "Cliente Demonstração",
      email: "cliente@example.com",
      passwordHash: demoPasswordHash,
      role: "CUSTOMER",
      mustChangePassword: true,
      status: "ACTIVE",
    },
  });

  await prisma.userProduct.upsert({
    where: { userId_productId: { userId: demoUser.id, productId: volume1.id } },
    update: {},
    create: {
      userId: demoUser.id,
      productId: volume1.id,
      transactionId: "DEMO-TXN-0001",
      purchaseDate,
      accessStart: purchaseDate,
      status: "ACTIVE",
    },
  });

  console.log("Seed concluído:");
  console.log("  Admin:  admin@membershub.com / admin123");
  console.log("  Cliente demo: cliente@example.com / demo12345 (senha provisória)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
