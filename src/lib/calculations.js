// Numeric fields (hours, rate, qty, cost, markup %, tax %) never make sense
// negative for a contractor estimate. Reject a negative value the instant a
// full number is typed, rather than letting it silently flow into totals.
export function clampNonNegative(value) {
  const num = parseFloat(value);
  if (!Number.isNaN(num) && num < 0) return "0";
  return value;
}

export function laborRowTotal(row) {
  return (parseFloat(row.hours) || 0) * (parseFloat(row.rate) || 0);
}

export function materialRowTotal(row) {
  return (parseFloat(row.qty) || 0) * (parseFloat(row.cost) || 0);
}

export function calcTotals({ labor, materials, markupPct, taxPct }) {
  const laborTotal = labor.reduce((sum, row) => sum + laborRowTotal(row), 0);
  const materialTotal = materials.reduce((sum, row) => sum + materialRowTotal(row), 0);
  const subtotal = laborTotal + materialTotal;
  const markupAmount = subtotal * ((parseFloat(markupPct) || 0) / 100);
  const taxableBase = subtotal + markupAmount;
  const taxAmount = taxableBase * ((parseFloat(taxPct) || 0) / 100);
  const grandTotal = taxableBase + taxAmount;

  return { laborTotal, materialTotal, subtotal, markupAmount, taxableBase, taxAmount, grandTotal };
}
