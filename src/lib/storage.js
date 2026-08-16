export const STORAGE_KEY = "contractorEstimate";
export const JOBS_STORAGE_KEY = "contractorEstimateJobsList";

export function loadAutosave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAutosave(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearAutosave() {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadJobs() {
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    const jobs = raw ? JSON.parse(raw) : [];
    return Array.isArray(jobs) ? jobs : [];
  } catch {
    return [];
  }
}

export function persistJobs(jobs) {
  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
}
