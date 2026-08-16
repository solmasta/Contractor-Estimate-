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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error("Failed to autosave estimate:", err);
    return false;
  }
}

export function clearAutosave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear autosaved estimate:", err);
  }
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
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch (err) {
    console.error("Failed to save jobs list:", err);
    return false;
  }
}
