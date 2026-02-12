/**
 * Format a price number for display with Swedish locale (space as thousand separator).
 * Sale: "2 800 000 kr", Rent: "25 000 kr/mån"
 */
export function formatPrice(price: number, type: string): string {
  const formatted = price.toLocaleString("sv-SE");
  return type === "sale" ? `${formatted} kr` : `${formatted} kr/mån`;
}

/**
 * Format a raw numeric string with spaces as thousand separators for input display.
 * "2800000" → "2 800 000"
 */
export function formatPriceInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("sv-SE");
}

/**
 * Strip formatting from a price input string, returning raw digits.
 * "2 800 000" → "2800000"
 */
export function parsePriceInput(formatted: string): string {
  return formatted.replace(/\D/g, "");
}
