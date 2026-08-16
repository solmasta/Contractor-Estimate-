import { currency } from "../lib/format";
import { laborRowTotal, materialRowTotal, clampNonNegative } from "../lib/calculations";

export default function LineItemsSection({ title, kind, rows, onUpdate, onRemove, subtotal }) {
  const isLabor = kind === "labor";

  return (
    <section className="line-section">
      <h2>{title}</h2>
      <div className="table-scroll">
      <table className="line-table">
        <thead>
          <tr>
            <th className="col-desc">Description</th>
            <th className="col-num">{isLabor ? "Hours" : "Qty"}</th>
            <th className="col-num">{isLabor ? "Rate / hr" : "Unit Cost"}</th>
            <th className="col-num">Total</th>
            <th className="col-action no-print" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const total = isLabor ? laborRowTotal(row) : materialRowTotal(row);
            return (
              <tr key={i}>
                <td className="col-desc" data-label="Description">
                  <input
                    type="text"
                    placeholder={isLabor ? "e.g. Framing crew" : "e.g. 2x4 Lumber"}
                    value={row.desc}
                    onChange={(e) => onUpdate(i, { desc: e.target.value })}
                  />
                </td>
                <td className="col-num" data-label={isLabor ? "Hours" : "Qty"}>
                  <input
                    type="number" min="0" step={isLabor ? "0.25" : "1"}
                    value={isLabor ? row.hours : row.qty}
                    onChange={(e) => {
                      const v = clampNonNegative(e.target.value);
                      onUpdate(i, isLabor ? { hours: v } : { qty: v });
                    }}
                  />
                </td>
                <td className="col-num" data-label={isLabor ? "Rate / hr" : "Unit Cost"}>
                  <input
                    type="number" min="0" step="0.01"
                    value={isLabor ? row.rate : row.cost}
                    onChange={(e) => {
                      const v = clampNonNegative(e.target.value);
                      onUpdate(i, isLabor ? { rate: v } : { cost: v });
                    }}
                  />
                </td>
                <td className="col-num line-total" data-label="Total">{currency(total)}</td>
                <td className="col-action no-print">
                  <button type="button" className="row-remove" title="Remove row" onClick={() => onRemove(i)}>&times;</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <div className="section-subtotal">{title} Subtotal: {currency(subtotal)}</div>
    </section>
  );
}
