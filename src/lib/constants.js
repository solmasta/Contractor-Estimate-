export const FIELD_IDS = [
  "companyName", "companyContact", "companyAddress",
  "clientName", "jobAddress", "clientContact",
  "estimateNumber", "estimateDate", "validUntil", "jobCategory",
  "jobDescription", "notes", "markupPct", "taxPct", "marketArea", "pricingZip",
];

export const DEFAULT_MARKET_AREA = "Chicagoland (Chicago Metro Area), IL";
export const DEFAULT_PRICING_ZIP = "60463";

export const CATEGORY_OPTIONS = [
  "Plumbing", "Electrical", "HVAC", "Roofing", "Remodeling",
  "Kitchen Remodel", "Bathroom Remodel", "Flooring", "Painting",
  "Drywall", "Concrete", "Landscaping", "Fencing / Decking",
  "Windows & Doors", "General Contracting", "Handyman",
];

export function emptyFields() {
  const fields = {};
  FIELD_IDS.forEach((id) => {
    fields[id] = id === "markupPct" || id === "taxPct" ? "0" : "";
  });
  return fields;
}

export function emptyLaborRow() {
  return { desc: "", hours: "0", rate: "0" };
}

export function emptyMaterialRow() {
  return { desc: "", qty: "0", cost: "0" };
}
