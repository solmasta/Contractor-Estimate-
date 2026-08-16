import { useState, useCallback } from "react";
import Header from "./components/Header";
import JobStatusBanner from "./components/JobStatusBanner";
import JobsPanel from "./components/JobsPanel";
import EstimateMeta from "./components/EstimateMeta";
import JobDescription from "./components/JobDescription";
import AiPhotoEstimate from "./components/AiPhotoEstimate";
import LineItemsSection from "./components/LineItemsSection";
import TotalsPanel from "./components/TotalsPanel";
import NotesSection from "./components/NotesSection";
import { useEstimate } from "./hooks/useEstimate";
import { useJobs } from "./hooks/useJobs";

export default function App() {
  const estimate = useEstimate();
  const { jobs, saveJob, deleteJob } = useJobs();
  const [jobsPanelOpen, setJobsPanelOpen] = useState(false);
  const [jobStatus, setJobStatus] = useState("");

  const handleNewJob = useCallback(() => {
    const confirmed = window.confirm(
      'Start a new job? Any unsaved changes to the current form will be lost (use "Save Job" first if you want to keep them).'
    );
    if (!confirmed) return;
    estimate.startNewJob();
    setJobStatus("");
  }, [estimate]);

  const handleSaveJob = useCallback(() => {
    const snapshot = estimate.buildSnapshot();
    const id = saveJob(snapshot, estimate.currentJobId);
    estimate.setCurrentJobId(id);
    const { jobCategory, clientName } = snapshot.fields;
    setJobStatus(`Saved${jobCategory ? " " + jobCategory : ""} job${clientName ? " for " + clientName : ""}.`);
  }, [estimate, saveJob]);

  const handleOpenJob = useCallback((job) => {
    estimate.loadFromJobState(job.state, job.id);
    setJobsPanelOpen(false);
    setJobStatus(`Opened "${job.clientName || job.category || "job"}".`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [estimate]);

  const handleDeleteJob = useCallback((id) => {
    if (!window.confirm("Delete this saved job? This cannot be undone.")) return;
    deleteJob(id);
    if (estimate.currentJobId === id) estimate.setCurrentJobId(null);
  }, [deleteJob, estimate]);

  return (
    <div className="page">
      <Header
        onAddLabor={() => estimate.addLaborRow()}
        onAddMaterial={() => estimate.addMaterialRow()}
        onToggleJobs={() => setJobsPanelOpen((v) => !v)}
        onSaveJob={handleSaveJob}
        onPrint={() => window.print()}
        onNewJob={handleNewJob}
      />

      <JobStatusBanner message={jobStatus} />

      {jobsPanelOpen && (
        <JobsPanel
          jobs={jobs}
          currentJobId={estimate.currentJobId}
          onOpen={handleOpenJob}
          onDelete={handleDeleteJob}
          onClose={() => setJobsPanelOpen(false)}
        />
      )}

      <main className="estimate">
        <EstimateMeta fields={estimate.fields} setField={estimate.setField} />

        <JobDescription
          value={estimate.fields.jobDescription}
          onChange={(v) => estimate.setField("jobDescription", v)}
        />

        <AiPhotoEstimate
          marketArea={estimate.fields.marketArea}
          pricingZip={estimate.fields.pricingZip}
          onSetMarketArea={(v) => estimate.setField("marketArea", v)}
          onSetPricingZip={(v) => estimate.setField("pricingZip", v)}
          onAddLabor={estimate.addLaborRow}
          onAddMaterial={estimate.addMaterialRow}
        />

        <LineItemsSection
          title="Labor" kind="labor"
          rows={estimate.labor}
          onUpdate={estimate.updateLaborRow}
          onRemove={estimate.removeLaborRow}
          subtotal={estimate.totals.laborTotal}
        />

        <LineItemsSection
          title="Materials" kind="material"
          rows={estimate.materials}
          onUpdate={estimate.updateMaterialRow}
          onRemove={estimate.removeMaterialRow}
          subtotal={estimate.totals.materialTotal}
        />

        <TotalsPanel fields={estimate.fields} setField={estimate.setField} totals={estimate.totals} />

        <NotesSection value={estimate.fields.notes} onChange={(v) => estimate.setField("notes", v)} />
      </main>

      <p className="save-hint no-print">Your entries are saved automatically in this browser.</p>
    </div>
  );
}
