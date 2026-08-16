import { CATEGORY_OPTIONS } from "../lib/constants";

export default function EstimateMeta({ fields, setField }) {
  return (
    <section className="estimate-meta">
      <div className="meta-block">
        <h2>From</h2>
        <input
          type="text" placeholder="Your Company Name"
          value={fields.companyName} onChange={(e) => setField("companyName", e.target.value)}
        />
        <input
          type="text" placeholder="Phone / Email"
          value={fields.companyContact} onChange={(e) => setField("companyContact", e.target.value)}
        />
        <input
          type="text" placeholder="Address"
          value={fields.companyAddress} onChange={(e) => setField("companyAddress", e.target.value)}
        />
      </div>

      <div className="meta-block">
        <h2>Estimate For</h2>
        <input
          type="text" placeholder="Client Name"
          value={fields.clientName} onChange={(e) => setField("clientName", e.target.value)}
        />
        <input
          type="text" placeholder="Job Site Address"
          value={fields.jobAddress} onChange={(e) => setField("jobAddress", e.target.value)}
        />
        <input
          type="text" placeholder="Phone / Email"
          value={fields.clientContact} onChange={(e) => setField("clientContact", e.target.value)}
        />
      </div>

      <div className="meta-block">
        <h2>Details</h2>
        <label>
          Category
          <input
            type="text" list="categoryOptions" placeholder="e.g. Plumbing, Roofing, Remodel"
            value={fields.jobCategory} onChange={(e) => setField("jobCategory", e.target.value)}
          />
          <datalist id="categoryOptions">
            {CATEGORY_OPTIONS.map((cat) => <option value={cat} key={cat} />)}
          </datalist>
        </label>
        <label>
          Estimate #
          <input
            type="text" placeholder="EST-1001"
            value={fields.estimateNumber} onChange={(e) => setField("estimateNumber", e.target.value)}
          />
        </label>
        <label>
          Date
          <input type="date" value={fields.estimateDate} onChange={(e) => setField("estimateDate", e.target.value)} />
        </label>
        <label>
          Valid Until
          <input type="date" value={fields.validUntil} onChange={(e) => setField("validUntil", e.target.value)} />
        </label>
      </div>
    </section>
  );
}
