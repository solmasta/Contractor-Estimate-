import { useState, useCallback } from "react";
import { analyzePhotos } from "../lib/api";

const MAX_PHOTOS = 4;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
    for (const file of files) {
      const dataUrl = await readFileAsDataURL(file);
      const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
      if (!match) continue;
      const [, mediaType, data] = match;
      next.push({ data, mediaType, previewUrl: dataUrl, name: file.name });
    }
    setPhotos(next);
    setSummary("");
    setSuggestions([]);
    setStatus({ text: "", type: "" });
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
                      <div className="suggestion-row" key={s.id}>
                        <input
                          type="checkbox" checked={s.checked}
                          onChange={(e) => updateSuggestion(s.id, { checked: e.target.checked })}
                        />
                        <input
                          type="text" value={s.description}
                          onChange={(e) => updateSuggestion(s.id, { description: e.target.value })}
                        />
                        <input
                          type="number" min="0" step="0.25" value={s.hours}
                          onChange={(e) => updateSuggestion(s.id, { hours: e.target.value })}
                        />
                        <input
                          type="number" min="0" step="0.01" value={s.rate}
                          onChange={(e) => updateSuggestion(s.id, { rate: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {materialSuggestions.length > 0 && (
                  <div className="suggestion-group">
                    <h3>Suggested Materials</h3>
                    {materialSuggestions.map((s) => (
                      <div key={s.id}>
                        <div className="suggestion-row">
                          <input
                            type="checkbox" checked={s.checked}
                            onChange={(e) => updateSuggestion(s.id, { checked: e.target.checked })}
                          />
                          <input
                            type="text" value={s.description}
                            onChange={(e) => updateSuggestion(s.id, { description: e.target.value })}
                          />
                          <input
                            type="number" min="0" step="1" value={s.qty}
                            onChange={(e) => updateSuggestion(s.id, { qty: e.target.value })}
                          />
                          <input
                            type="number" min="0" step="0.01" value={s.unitCost}
                            onChange={(e) => updateSuggestion(s.id, { unitCost: e.target.value })}
                          />
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
