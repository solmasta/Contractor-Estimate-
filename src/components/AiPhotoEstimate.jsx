import { useState, useCallback } from "react";
import { analyzePhotos } from "../lib/api";
import { clampNonNegative } from "../lib/calculations";

const MAX_PHOTOS = 4;

// Claude's vision input is capped at ~1568px on the long edge internally: larger
// images are downscaled before analysis anyway, so resizing to this size client-side
// loses no analysis quality while cutting the base64 payload (and Vercel's 4.5MB /
// 60s limits) way down versus a full-resolution phone photo.
const MAX_DIMENSION = 1568;
const JPEG_QUALITY = 0.85;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function resizeImageFile(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    let { width, height } = img;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width >= height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function AiPhotoEstimate({
  marketArea, pricingZip, onSetMarketArea, onSetPricingZip, onAddLabor, onAddMaterial,
}) {
  const [photos, setPhotos] = useState([]);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: "", type: "" });
  const [summary, setSummary] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS);
    const next = [];
    const failed = [];
    for (const file of files) {
      try {
        const dataUrl = await resizeImageFile(file);
        const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
        if (!match) {
          failed.push(file.name);
          continue;
        }
        const [, mediaType, data] = match;
        next.push({ data, mediaType, previewUrl: dataUrl, name: file.name });
      } catch {
        failed.push(file.name);
      }
    }
    setPhotos(next);
    setSummary("");
    setSuggestions([]);
    setStatus(
      failed.length > 0
        ? { text: `Couldn't load ${failed.join(", ")}. Try a JPEG or PNG instead.`, type: "error" }
        : { text: "", type: "" }
    );
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (photos.length === 0) {
      setStatus({ text: "Choose at least one photo first.", type: "error" });
      return;
    }

    setLoading(true);
    setStatus({ text: "Analyzing photos...", type: "" });
    setSummary("");
    setSuggestions([]);

    try {
      const payload = await analyzePhotos({
        images: photos.map((p) => ({ data: p.data, mediaType: p.mediaType })),
        context: context.trim(),
        marketArea: marketArea.trim(),
        pricingZip: pricingZip.trim(),
      });

      setSummary(payload.summary || "");
      const laborItems = (payload.labor || []).map((item, i) => ({
        id: `labor-${i}`, kind: "labor", checked: true,
        description: item.description || "", hours: item.hours ?? 0, rate: item.rate ?? 0,
      }));
      const materialItems = (payload.materials || []).map((item, i) => ({
        id: `material-${i}`, kind: "material", checked: true,
        description: item.description || "", qty: item.qty ?? 0, unitCost: item.unitCost ?? 0, source: item.source || "",
      }));
      setSuggestions([...laborItems, ...materialItems]);
      setStatus({ text: "", type: "" });
    } catch (err) {
      setStatus({
        text: `Couldn't analyze photos: ${err.message}. Make sure the app is running via 'npm start' with ANTHROPIC_API_KEY set.`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [photos, context, marketArea, pricingZip]);

  const updateSuggestion = useCallback((id, patch) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const handleAddSelected = useCallback(() => {
    let added = 0;
    suggestions.forEach((s) => {
      if (!s.checked) return;
      if (s.kind === "labor") {
        onAddLabor({ desc: s.description, hours: parseFloat(s.hours) || 0, rate: parseFloat(s.rate) || 0 });
      } else {
        onAddMaterial({ desc: s.description, qty: parseFloat(s.qty) || 0, cost: parseFloat(s.unitCost) || 0 });
      }
      added++;
    });
    setStatus(
      added > 0
        ? { text: `Added ${added} item(s) to the estimate below.`, type: "success" }
        : { text: "No items were selected.", type: "error" }
    );
  }, [suggestions, onAddLabor, onAddMaterial]);

  const laborSuggestions = suggestions.filter((s) => s.kind === "labor");
  const materialSuggestions = suggestions.filter((s) => s.kind === "material");

  return (
    <section className="ai-photo-section no-print">
      <h2>AI Photo Estimate <span className="beta-tag">Beta</span></h2>
      <p className="ai-hint">
        Upload photos of the job site and let AI suggest labor and material line items, with
        material prices looked up live from Home Depot and Menards. Requires the app to be
        running via <code>npm start</code> with an Anthropic API key configured.
      </p>

      <div className="ai-controls">
        <label className="file-label" htmlFor="photoInput">Choose Photos</label>
        <input type="file" id="photoInput" accept="image/*" multiple onChange={handleFileChange} />

        {photos.length > 0 && (
          <div className="photo-preview">
            {photos.map((p) => (
              <img key={p.name} src={p.previewUrl} alt={p.name} title={p.name} className="photo-thumb" />
            ))}
          </div>
        )}

        <label htmlFor="marketArea">Market area (for labor pricing)</label>
        <input
          type="text" id="marketArea" placeholder="e.g. Chicagoland (Chicago Metro Area), IL"
          value={marketArea} onChange={(e) => onSetMarketArea(e.target.value)}
        />

        <label htmlFor="pricingZip">ZIP code (for Home Depot / Menards material pricing)</label>
        <input
          type="text" id="pricingZip" placeholder="e.g. 60463" inputMode="numeric" maxLength={10}
          value={pricingZip} onChange={(e) => onSetPricingZip(e.target.value)}
        />

        <label htmlFor="photoContext">Additional context (optional)</label>
        <textarea
          id="photoContext" rows={2} placeholder="e.g. Kitchen remodel, replacing cabinets and countertops"
          value={context} onChange={(e) => setContext(e.target.value)}
        />

        <button type="button" className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing…" : "Analyze Photos with AI"}
        </button>

        {status.text && (
          <div className={"ai-status" + (status.type ? " ai-" + status.type : "")}>{status.text}</div>
        )}
      </div>

      {(summary || suggestions.length > 0) && (
        <div className="ai-results">
          {summary && <p className="ai-summary">{summary}</p>}

          {suggestions.length === 0 ? (
            <p>No suggestions found for these photos.</p>
          ) : (
            <>
              <div className="ai-suggestions">
                {laborSuggestions.length > 0 && (
                  <div className="suggestion-group">
                    <h3>Suggested Labor</h3>
                    {laborSuggestions.map((s) => (
                      <div className="suggestion-card" key={s.id}>
                        <div className="suggestion-card-header">
                          <input
                            type="checkbox" checked={s.checked}
                            onChange={(e) => updateSuggestion(s.id, { checked: e.target.checked })}
                          />
                          <input
                            type="text" className="suggestion-desc" placeholder="Description"
                            value={s.description}
                            onChange={(e) => updateSuggestion(s.id, { description: e.target.value })}
                          />
                        </div>
                        <div className="suggestion-fields">
                          <label className="suggestion-field">
                            <span>Hours</span>
                            <input
                              type="number" min="0" step="0.25" value={s.hours}
                              onChange={(e) => updateSuggestion(s.id, { hours: clampNonNegative(e.target.value) })}
                            />
                          </label>
                          <label className="suggestion-field">
                            <span>Rate / hr</span>
                            <input
                              type="number" min="0" step="0.01" value={s.rate}
                              onChange={(e) => updateSuggestion(s.id, { rate: clampNonNegative(e.target.value) })}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {materialSuggestions.length > 0 && (
                  <div className="suggestion-group">
                    <h3>Suggested Materials</h3>
                    {materialSuggestions.map((s) => (
                      <div className="suggestion-card" key={s.id}>
                        <div className="suggestion-card-header">
                          <input
                            type="checkbox" checked={s.checked}
                            onChange={(e) => updateSuggestion(s.id, { checked: e.target.checked })}
                          />
                          <input
                            type="text" className="suggestion-desc" placeholder="Description"
                            value={s.description}
                            onChange={(e) => updateSuggestion(s.id, { description: e.target.value })}
                          />
                        </div>
                        <div className="suggestion-fields">
                          <label className="suggestion-field">
                            <span>Qty</span>
                            <input
                              type="number" min="0" step="1" value={s.qty}
                              onChange={(e) => updateSuggestion(s.id, { qty: clampNonNegative(e.target.value) })}
                            />
                          </label>
                          <label className="suggestion-field">
                            <span>Unit Cost</span>
                            <input
                              type="number" min="0" step="0.01" value={s.unitCost}
                              onChange={(e) => updateSuggestion(s.id, { unitCost: clampNonNegative(e.target.value) })}
                            />
                          </label>
                        </div>
                        {s.source && (
                          <div className="suggestion-source">
                            {s.source === "estimated" ? "Estimated (no exact match found)" : `Priced from ${s.source}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" className="btn btn-primary" onClick={handleAddSelected}>
                Add Selected to Estimate
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
