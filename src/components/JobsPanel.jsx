import { useMemo, useState } from "react";
import { currency } from "../lib/format";

export default function JobsPanel({ jobs, currentJobId, onOpen, onDelete, onClose }) {
  const [filter, setFilter] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.category).filter(Boolean))).sort(),
    [jobs]
  );

  const visibleJobs = useMemo(() => {
    return jobs
      .filter((j) => !filter || j.category === filter)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  }, [jobs, filter]);

  return (
    <section className="jobs-panel no-print">
      <div className="jobs-panel-header">
        <h2>Saved Jobs</h2>
        <label className="jobs-filter-label">
          Category
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option value={cat} key={cat}>{cat}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>

      <div className="jobs-list">
        {visibleJobs.length === 0 ? (
          <p className="jobs-empty">
            {jobs.length === 0
              ? 'No saved jobs yet. Fill out an estimate, pick a category, and click "Save Job".'
              : "No jobs in this category."}
          </p>
        ) : (
          visibleJobs.map((job) => (
            <div className={"job-card" + (job.id === currentJobId ? " job-card-active" : "")} key={job.id}>
              <div className="job-card-info">
                <div className="job-card-title">
                  {job.category && <span className="category-tag">{job.category}</span>}
                  <span>{job.clientName || job.estimateNumber || "Untitled Job"}</span>
                </div>
                <div className="job-card-meta">
                  {[job.jobAddress, currency(job.total || 0), job.savedAt ? new Date(job.savedAt).toLocaleDateString() : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <div className="job-card-actions">
                <button type="button" className="btn btn-secondary" onClick={() => onOpen(job)}>Open</button>
                <button type="button" className="btn btn-danger" onClick={() => onDelete(job.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
