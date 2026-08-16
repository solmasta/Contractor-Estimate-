export function currency(n) {
  return (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
