import { useState, useCallback } from "react";
import { loadJobs, persistJobs } from "../lib/storage";
import { calcTotals } from "../lib/calculations";

function generateJobId() {
  return window.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : "job-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

export function useJobs() {
  const [jobs, setJobs] = useState(() => loadJobs());

  const saveJob = useCallback((snapshot, existingId) => {
    const { fields, labor, materials } = snapshot;
    const totals = calcTotals({ labor, materials, markupPct: fields.markupPct, taxPct: fields.taxPct });
    const summary = {
      category: fields.jobCategory || "",
      clientName: fields.clientName || "",
      jobAddress: fields.jobAddress || "",
      estimateNumber: fields.estimateNumber || "",
      total: totals.grandTotal,
    };

    const current = loadJobs();
    const existingIdx = existingId ? current.findIndex((j) => j.id === existingId) : -1;
    const id = existingIdx >= 0 ? existingId : generateJobId();

    if (existingIdx >= 0) {
      current[existingIdx] = {
        ...current[existingIdx], ...summary, state: snapshot, savedAt: new Date().toISOString(),
      };
    } else {
      current.push({ id, ...summary, state: snapshot, savedAt: new Date().toISOString() });
    }

    const ok = persistJobs(current);
    if (ok) setJobs(current);
    return { id, ok };
  }, []);

  const deleteJob = useCallback((id) => {
    const next = loadJobs().filter((j) => j.id !== id);
    const ok = persistJobs(next);
    if (ok) setJobs(next);
    return ok;
  }, []);

  return { jobs, saveJob, deleteJob };
}
