export function formatBRL(cents?: number | null) {
  if (cents == null) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
