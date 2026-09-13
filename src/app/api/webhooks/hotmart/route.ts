import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyHottok,
  extractPurchaseInfo,
  GRANTS_ACCESS_EVENTS,
  REVOKES_ACCESS_EVENTS,
  type HotmartWebhookPayload,
} from "@/lib/hotmart";
import { grantProductAccess, revokeProductAccess } from "@/lib/purchase";

export async function POST(req: Request) {
  const hottok = req.headers.get("x-hotmart-hottok");
  if (!verifyHottok(hottok)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: HotmartWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const info = extractPurchaseInfo(payload);

  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      provider: "hotmart",
      eventType: info.event || "UNKNOWN",
      transactionId: info.transactionId,
      buyerEmail: info.buyerEmail,
      rawPayload: payload as object,
      status: "RECEIVED",
    },
  });

  try {
    if (GRANTS_ACCESS_EVENTS.includes(info.event)) {
      if (!info.buyerEmail || !info.transactionId || !info.productHotmartId) {
        await prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { status: "ERROR", errorMessage: "Payload sem e-mail, transação ou produto.", processedAt: new Date() },
        });
        return NextResponse.json({ received: true });
      }

      const product = await prisma.product.findUnique({ where: { hotmartProductId: info.productHotmartId } });
      if (!product) {
        await prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            status: "ERROR",
            errorMessage: `Nenhum produto cadastrado com Hotmart Product ID "${info.productHotmartId}".`,
            processedAt: new Date(),
          },
        });
        return NextResponse.json({ received: true });
      }

      const result = await grantProductAccess({
        productId: product.id,
        productName: product.name,
        buyerEmail: info.buyerEmail,
        buyerName: info.buyerName || info.buyerEmail,
        transactionId: info.transactionId,
        purchaseDate: info.purchaseDate,
      });

      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: "PROCESSED",
          errorMessage: result.alreadyProcessed ? "Transação já processada anteriormente (idempotente)." : null,
          processedAt: new Date(),
        },
      });
      return NextResponse.json({ received: true });
    }

    if (REVOKES_ACCESS_EVENTS.includes(info.event)) {
      if (!info.transactionId) {
        await prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { status: "ERROR", errorMessage: "Payload sem transação.", processedAt: new Date() },
        });
        return NextResponse.json({ received: true });
      }

      const status = info.event === "PURCHASE_CANCELED" ? "CANCELED" : "REFUNDED";
      const result = await revokeProductAccess(info.transactionId, status);

      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: result.found ? "PROCESSED" : "IGNORED",
          errorMessage: result.found ? null : "Transação não encontrada para revogar acesso.",
          processedAt: new Date(),
        },
      });
      return NextResponse.json({ received: true });
    }

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "IGNORED", processedAt: new Date() },
    });
    return NextResponse.json({ received: true });
  } catch (err) {
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: "ERROR",
        errorMessage: err instanceof Error ? err.message : "Erro desconhecido.",
        processedAt: new Date(),
      },
    });
    // 200 para evitar tempestade de retries da Hotmart; o erro fica visível no admin.
    return NextResponse.json({ received: true });
  }
}
