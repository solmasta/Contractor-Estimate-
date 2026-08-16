export default function Header({ onAddLabor, onAddMaterial, onToggleJobs, onSaveJob, onPrint, onNewJob }) {
  return (
    <header className="app-header no-print">
      <h1>Job Estimate Builder</h1>
      <div className="header-actions">
        <button type="button" className="btn btn-secondary" onClick={onAddLabor}>+ Labor Line</button>
        <button type="button" className="btn btn-secondary" onClick={onAddMaterial}>+ Material Line</button>
        <button type="button" className="btn btn-secondary" onClick={onToggleJobs}>My Jobs</button>
        <button type="button" className="btn btn-secondary" onClick={onSaveJob}>Save Job</button>
        <button type="button" className="btn btn-primary" onClick={onPrint}>Print / Save PDF</button>
        <button type="button" className="btn btn-danger" onClick={onNewJob}>New Job</button>
      </div>
    </header>
  );
}
