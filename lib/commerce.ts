export type CartLine = { productId: string; quantity: number };
export const shippingFor = (subtotal: number) => (subtotal >= 5000 ? 0 : 500);
export function validateCheckout(input: unknown): {
  customer: string;
  items: CartLine[];
  requestKey: string;
} {
  if (!input || typeof input !== "object") throw new Error("INVALID_BODY");
  const b = input as Record<string, unknown>;
  if (
    typeof b.customer !== "string" ||
    !b.customer.trim() ||
    b.customer.trim().length > 40
  )
    throw new Error("INVALID_CUSTOMER");
  if (
    typeof b.requestKey !== "string" ||
    !/^[a-zA-Z0-9-]{16,80}$/.test(b.requestKey)
  )
    throw new Error("INVALID_KEY");
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 6)
    throw new Error("INVALID_ITEMS");
  const seen = new Set<string>();
  const items = b.items
    .map((line: unknown) => {
      if (!line || typeof line !== "object") throw new Error("INVALID_ITEMS");
      const l = line as Record<string, unknown>;
      if (
        typeof l.productId !== "string" ||
        !Number.isInteger(l.quantity) ||
        (l.quantity as number) < 1 ||
        (l.quantity as number) > 10 ||
        seen.has(l.productId)
      )
        throw new Error("INVALID_QUANTITY");
      seen.add(l.productId);
      return { productId: l.productId, quantity: l.quantity as number };
    })
    .sort((a, b) => a.productId.localeCompare(b.productId));
  return { customer: b.customer.trim(), requestKey: b.requestKey, items };
}
