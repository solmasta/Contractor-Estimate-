export default function JobStatusBanner({ message, tone = "success" }) {
  return (
    <div className={"job-status no-print" + (tone === "error" ? " job-status-error" : "")}>
      {message || ""}
    </div>
  );
}
