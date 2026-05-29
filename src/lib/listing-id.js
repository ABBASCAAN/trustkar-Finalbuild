/** Public listing reference: TK-L-XXXXXX */
export function generateListingId() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TK-L-${rand}`;
}
