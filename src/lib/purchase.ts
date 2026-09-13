import "server-only";
import { prisma } from "@/lib/prisma";
import { generateProvisionalPassword, hashPassword } from "@/lib/auth/password";
import { sendAccessEmail, sendProductUnlockedEmail } from "@/lib/email";

export async function grantProductAccess(params: {
  productId: string;
  productName: string;
  buyerEmail: string;
  buyerName: string;
  transactionId: string;
  purchaseDate: Date;
}) {
  const { productId, productName, buyerEmail, buyerName, transactionId, purchaseDate } = params;

  const existingByTransaction = await prisma.userProduct.findUnique({ where: { transactionId } });
  if (existingByTransaction) {
    return { alreadyProcessed: true as const };
  }

  let user = await prisma.user.findUnique({ where: { email: buyerEmail } });
  let isNewUser = false;
  let provisionalPassword: string | null = null;

  if (!user) {
    isNewUser = true;
    provisionalPassword = generateProvisionalPassword();
    const passwordHash = await hashPassword(provisionalPassword);
    user = await prisma.user.create({
      data: {
        name: buyerName || buyerEmail,
        email: buyerEmail,
        passwordHash,
        mustChangePassword: true,
        role: "CUSTOMER",
      },
    });
  } else if (user.status !== "ACTIVE") {
    user = await prisma.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
  }

  const existingProductAccess = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existingProductAccess) {
    await prisma.userProduct.update({
      where: { id: existingProductAccess.id },
      data: { status: "ACTIVE", transactionId, purchaseDate, accessStart: purchaseDate },
    });
  } else {
    await prisma.userProduct.create({
      data: { userId: user.id, productId, transactionId, purchaseDate, accessStart: purchaseDate, status: "ACTIVE" },
    });
  }

  if (isNewUser && provisionalPassword) {
    await sendAccessEmail({ name: user.name, email: user.email, password: provisionalPassword, productName });
  } else if (!existingProductAccess) {
    await sendProductUnlockedEmail({ name: user.name, email: user.email, productName });
  }

  return { alreadyProcessed: false as const, userId: user.id, isNewUser };
}

export async function revokeProductAccess(transactionId: string, status: "REFUNDED" | "CANCELED") {
  const userProduct = await prisma.userProduct.findUnique({ where: { transactionId } });
  if (!userProduct) return { found: false as const };
  await prisma.userProduct.update({ where: { id: userProduct.id }, data: { status } });
  return { found: true as const };
}
