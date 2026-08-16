export default function JobDescription({ value, onChange }) {
  return (
    <section className="job-desc">
      <label htmlFor="jobDescription">Job Description / Scope of Work</label>
      <textarea
        id="jobDescription" rows={3} placeholder="Describe the work to be performed..."
        value={value} onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}
