export default function JobStatusBanner({ message }) {
  return <div className="job-status no-print">{message || ""}</div>;
}
