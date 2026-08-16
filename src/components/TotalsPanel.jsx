import { currency } from "../lib/format";

export default function TotalsPanel({ fields, setField, totals }) {
  return (
    <section className="totals">
      <div className="totals-box">
        <div className="totals-row">
          <span>Labor Subtotal</span>
          <span>{currency(totals.laborTotal)}</span>
        </div>
        <div className="totals-row">
          <span>Materials Subtotal</span>
          <span>{currency(totals.materialTotal)}</span>
        </div>
        <div className="totals-row">
          <span>Subtotal</span>
          <span>{currency(totals.subtotal)}</span>
        </div>
        <div className="totals-row editable">
          <label htmlFor="markupPct">Markup / Overhead &amp; Profit (%)</label>
          <input
            id="markupPct" type="number" min="0" step="0.1"
            value={fields.markupPct} onChange={(e) => setField("markupPct", e.target.value)}
          />
        </div>
        <div className="totals-row">
          <span>Markup Amount</span>
          <span>{currency(totals.markupAmount)}</span>
        </div>
        <div className="totals-row editable">
          <label htmlFor="taxPct">Sales Tax (%)</label>
          <input
            id="taxPct" type="number" min="0" step="0.1"
            value={fields.taxPct} onChange={(e) => setField("taxPct", e.target.value)}
          />
        </div>
        <div className="totals-row">
          <span>Tax Amount</span>
          <span>{currency(totals.taxAmount)}</span>
        </div>
        <div className="totals-row grand-total">
          <span>Total Estimate</span>
          <span>{currency(totals.grandTotal)}</span>
        </div>
      </div>
    </section>
  );
}
