export default function NotesSection({ value, onChange }) {
  return (
    <section className="notes">
      <label htmlFor="notes">Notes / Terms</label>
      <textarea
        id="notes" rows={3} placeholder="Payment terms, exclusions, warranty, etc."
        value={value} onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}
