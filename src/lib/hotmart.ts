import "server-only";

/**
 * Estrutura baseada na documentação pública da Hotmart (webhook v2.0.0 - evento de compra).
 * Acesso direto a developers.hotmart.com não foi possível neste ambiente (egress bloqueado),
 * então o parsing abaixo é deliberadamente defensivo: nunca lança se um campo opcional
 * estiver ausente, e o payload bruto é sempre persistido em `webhook_events` para
 * conferência/ajuste manual caso a Hotmart real envie um formato ligeiramente diferente.
 */
export type HotmartWebhookPayload = {
  id?: string;
  event?: string;
  creation_date?: number;
  version?: string;
  data?: {
    product?: { id?: number | string; name?: string; ucode?: string };
    buyer?: { email?: string; name?: string };
    purchase?: {
      transaction?: string;
      status?: string;
      approved_date?: number;
      order_date?: number;
    };
  };
};

export const HOTMART_EVENTS = {
  PURCHASE_APPROVED: "PURCHASE_APPROVED",
  PURCHASE_COMPLETE: "PURCHASE_COMPLETE",
  PURCHASE_CANCELED: "PURCHASE_CANCELED",
  PURCHASE_REFUNDED: "PURCHASE_REFUNDED",
  PURCHASE_CHARGEBACK: "PURCHASE_CHARGEBACK",
  PURCHASE_EXPIRED: "PURCHASE_EXPIRED",
} as const;

/** Eventos que liberam acesso ao produto. */
export const GRANTS_ACCESS_EVENTS: string[] = [
  HOTMART_EVENTS.PURCHASE_APPROVED,
  HOTMART_EVENTS.PURCHASE_COMPLETE,
];

/** Eventos que devem revogar um acesso já concedido. */
export const REVOKES_ACCESS_EVENTS: string[] = [
  HOTMART_EVENTS.PURCHASE_CANCELED,
  HOTMART_EVENTS.PURCHASE_REFUNDED,
  HOTMART_EVENTS.PURCHASE_CHARGEBACK,
];

export function verifyHottok(headerValue: string | null): boolean {
  const expected = process.env.HOTMART_HOTTOK;
  if (!expected) return false;
  if (!headerValue) return false;
  return timingSafeEqualString(headerValue, expected);
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function extractPurchaseInfo(payload: HotmartWebhookPayload) {
  const event = payload.event ?? "";
  const transactionId = payload.data?.purchase?.transaction ?? null;
  const buyerEmail = payload.data?.buyer?.email?.trim().toLowerCase() ?? null;
  const buyerName = payload.data?.buyer?.name ?? null;
  const productHotmartId = payload.data?.product?.id != null ? String(payload.data.product.id) : null;
  const productName = payload.data?.product?.name ?? null;
  const purchaseDateMs = payload.data?.purchase?.approved_date ?? payload.data?.purchase?.order_date ?? null;

  return {
    event,
    transactionId,
    buyerEmail,
    buyerName,
    productHotmartId,
    productName,
    purchaseDate: purchaseDateMs ? new Date(purchaseDateMs) : new Date(),
  };
}
