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
  const [jobStatus, setJobStatus] = useState({ text: "", tone: "success" });
  // Bumped on New Job / Open Job so <AiPhotoEstimate key={...}> remounts and
  // drops any leftover photos/suggestions from the job that was just left —
  // otherwise "Add Selected to Estimate" could add a previous job's AI
  // suggestions into the new one.
  const [aiPanelResetKey, setAiPanelResetKey] = useState(0);

  const handleNewJob = useCallback(() => {
    const confirmed = window.confirm(
      'Start a new job? Any unsaved changes to the current form will be lost (use "Save Job" first if you want to keep them).'
    );
    if (!confirmed) return;
    estimate.startNewJob();
    setJobStatus({ text: "", tone: "success" });
    setAiPanelResetKey((k) => k + 1);
  }, [estimate]);

  const handleSaveJob = useCallback(() => {
    const snapshot = estimate.buildSnapshot();
    const { id, ok } = saveJob(snapshot, estimate.getCurrentJobId());
    if (!ok) {
      setJobStatus({
        text: "Couldn't save this job — your browser's storage is full or unavailable. Try deleting old jobs.",
        tone: "error",
      });
      return;
    }
    estimate.setCurrentJobId(id);
    const { jobCategory, clientName } = snapshot.fields;
    setJobStatus({
      text: `Saved${jobCategory ? " " + jobCategory : ""} job${clientName ? " for " + clientName : ""}.`,
      tone: "success",
    });
  }, [estimate, saveJob]);

  const handleOpenJob = useCallback((job) => {
    estimate.loadFromJobState(job.state, job.id);
    setJobsPanelOpen(false);
    setJobStatus({ text: `Opened "${job.clientName || job.category || "job"}".`, tone: "success" });
    setAiPanelResetKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [estimate]);

  const handleDeleteJob = useCallback((id) => {
    if (!window.confirm("Delete this saved job? This cannot be undone.")) return;
    const ok = deleteJob(id);
    if (!ok) {
      setJobStatus({
        text: "Couldn't delete this job — your browser's storage is unavailable.",
        tone: "error",
      });
      return;
    }
    if (estimate.getCurrentJobId() === id) estimate.setCurrentJobId(null);
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

      <JobStatusBanner message={jobStatus.text} tone={jobStatus.tone} />

      {estimate.autosaveError && (
        <div className="storage-warning no-print">
          Your browser's storage is full or unavailable — changes to this estimate aren't being
          saved automatically. Delete old jobs or free up storage, then keep working.
        </div>
      )}

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
          key={aiPanelResetKey}
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
