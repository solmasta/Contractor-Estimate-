import { useState, useEffect, useMemo, useCallback } from "react";
import { loadAutosave, saveAutosave, clearAutosave } from "../lib/storage";
import {
  FIELD_IDS, emptyFields, emptyLaborRow, emptyMaterialRow,
  DEFAULT_MARKET_AREA, DEFAULT_PRICING_ZIP,
} from "../lib/constants";
import { calcTotals } from "../lib/calculations";

function normalizeFields(saved) {
  const base = emptyFields();
  if (saved) {
    FIELD_IDS.forEach((id) => {
      if (saved[id] !== undefined) base[id] = saved[id];
    });
  }
  return base;
}

function normalizeLaborRows(rows) {
  return Array.isArray(rows)
    ? rows.map((r) => ({ desc: r.desc || "", hours: r.hours ?? "0", rate: r.rate ?? "0" }))
    : [];
}

function normalizeMaterialRows(rows) {
  return Array.isArray(rows)
    ? rows.map((r) => ({ desc: r.desc || "", qty: r.qty ?? "0", cost: r.cost ?? "0" }))
    : [];
}

function buildInitialState() {
  const saved = loadAutosave();
  const fields = normalizeFields(saved?.fields);
  let labor = normalizeLaborRows(saved?.labor);
  let materials = normalizeMaterialRows(saved?.materials);

  const hadData = labor.length > 0 || materials.length > 0;
  if (!hadData) {
    labor = [emptyLaborRow()];
    materials = [emptyMaterialRow()];
    if (!fields.estimateDate) {
      fields.estimateDate = new Date().toISOString().slice(0, 10);
    }
  }
  if (!fields.marketArea.trim()) fields.marketArea = DEFAULT_MARKET_AREA;
  if (!fields.pricingZip.trim()) fields.pricingZip = DEFAULT_PRICING_ZIP;

  return { fields, labor, materials };
}

export function useEstimate() {
  const [initial] = useState(buildInitialState);
  const [fields, setFieldsState] = useState(initial.fields);
  const [labor, setLabor] = useState(initial.labor);
  const [materials, setMaterials] = useState(initial.materials);
  const [currentJobId, setCurrentJobId] = useState(null);

  useEffect(() => {
    saveAutosave({ fields, labor, materials });
  }, [fields, labor, materials]);

  const setField = useCallback((id, value) => {
    setFieldsState((prev) => ({ ...prev, [id]: value }));
  }, []);

  const addLaborRow = useCallback((data) => {
    setLabor((prev) => [...prev, {
      desc: data?.desc || "",
      hours: data?.hours ?? 0,
      rate: data?.rate ?? 0,
    }]);
  }, []);

  const addMaterialRow = useCallback((data) => {
    setMaterials((prev) => [...prev, {
      desc: data?.desc || "",
      qty: data?.qty ?? 0,
      cost: data?.cost ?? 0,
    }]);
  }, []);

  const updateLaborRow = useCallback((index, patch) => {
    setLabor((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }, []);

  const updateMaterialRow = useCallback((index, patch) => {
    setMaterials((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }, []);

  const removeLaborRow = useCallback((index) => {
    setLabor((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeMaterialRow = useCallback((index) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const totals = useMemo(
    () => calcTotals({ labor, materials, markupPct: fields.markupPct, taxPct: fields.taxPct }),
    [labor, materials, fields.markupPct, fields.taxPct]
  );

  const startNewJob = useCallback(() => {
    clearAutosave();
    setCurrentJobId(null);
    const fresh = emptyFields();
    fresh.estimateDate = new Date().toISOString().slice(0, 10);
    fresh.marketArea = DEFAULT_MARKET_AREA;
    fresh.pricingZip = DEFAULT_PRICING_ZIP;
    setFieldsState(fresh);
    setLabor([emptyLaborRow()]);
    setMaterials([emptyMaterialRow()]);
  }, []);

  const loadFromJobState = useCallback((state, jobId) => {
    setFieldsState(normalizeFields(state.fields));
    setLabor(normalizeLaborRows(state.labor));
    setMaterials(normalizeMaterialRows(state.materials));
    setCurrentJobId(jobId);
  }, []);

  const buildSnapshot = useCallback(() => ({ fields, labor, materials }), [fields, labor, materials]);

  return {
    fields, setField,
    labor, materials,
    addLaborRow, addMaterialRow,
    updateLaborRow, updateMaterialRow,
    removeLaborRow, removeMaterialRow,
    totals,
    currentJobId, setCurrentJobId,
    startNewJob, loadFromJobState, buildSnapshot,
  };
}
