(function () {
  const STORAGE_KEY = "contractorEstimate";

  const laborBody = document.getElementById("laborBody");
  const materialBody = document.getElementById("materialBody");
  const laborRowTemplate = document.getElementById("laborRowTemplate");
  const materialRowTemplate = document.getElementById("materialRowTemplate");

  const fields = [
    "companyName", "companyContact", "companyAddress",
    "clientName", "jobAddress", "clientContact",
    "estimateNumber", "estimateDate", "validUntil",
    "jobDescription", "notes", "markupPct", "taxPct"
  ];

  const currency = (n) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  function addLaborRow(data) {
    const row = laborRowTemplate.content.firstElementChild.cloneNode(true);
    if (data) {
      row.querySelector(".l-desc").value = data.desc || "";
      row.querySelector(".l-hours").value = data.hours ?? 0;
      row.querySelector(".l-rate").value = data.rate ?? 0;
    }
    laborBody.appendChild(row);
    wireRow(row, "labor");
    updateRowTotal(row, "labor");
  }

  function addMaterialRow(data) {
    const row = materialRowTemplate.content.firstElementChild.cloneNode(true);
    if (data) {
      row.querySelector(".m-desc").value = data.desc || "";
      row.querySelector(".m-qty").value = data.qty ?? 0;
      row.querySelector(".m-cost").value = data.cost ?? 0;
    }
    materialBody.appendChild(row);
    wireRow(row, "material");
    updateRowTotal(row, "material");
  }

  function wireRow(row, kind) {
    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        updateRowTotal(row, kind);
        recalcAll();
      });
    });
    row.querySelector(".row-remove").addEventListener("click", () => {
      row.remove();
      recalcAll();
    });
  }

  function updateRowTotal(row, kind) {
    if (kind === "labor") {
      const hours = parseFloat(row.querySelector(".l-hours").value) || 0;
      const rate = parseFloat(row.querySelector(".l-rate").value) || 0;
      row.querySelector(".l-total").textContent = currency(hours * rate);
    } else {
      const qty = parseFloat(row.querySelector(".m-qty").value) || 0;
      const cost = parseFloat(row.querySelector(".m-cost").value) || 0;
      row.querySelector(".m-total").textContent = currency(qty * cost);
    }
  }

  function recalcAll() {
    let laborTotal = 0;
    laborBody.querySelectorAll("tr").forEach((row) => {
      const hours = parseFloat(row.querySelector(".l-hours").value) || 0;
      const rate = parseFloat(row.querySelector(".l-rate").value) || 0;
      laborTotal += hours * rate;
    });

    let materialTotal = 0;
    materialBody.querySelectorAll("tr").forEach((row) => {
      const qty = parseFloat(row.querySelector(".m-qty").value) || 0;
      const cost = parseFloat(row.querySelector(".m-cost").value) || 0;
      materialTotal += qty * cost;
    });

    const subtotal = laborTotal + materialTotal;
    const markupPct = parseFloat(document.getElementById("markupPct").value) || 0;
    const taxPct = parseFloat(document.getElementById("taxPct").value) || 0;

    const markupAmount = subtotal * (markupPct / 100);
    const taxableBase = subtotal + markupAmount;
    const taxAmount = taxableBase * (taxPct / 100);
    const grandTotal = taxableBase + taxAmount;

    document.getElementById("laborSubtotal").textContent = currency(laborTotal);
    document.getElementById("materialSubtotal").textContent = currency(materialTotal);
    document.getElementById("tLabor").textContent = currency(laborTotal);
    document.getElementById("tMaterial").textContent = currency(materialTotal);
    document.getElementById("tSubtotal").textContent = currency(subtotal);
    document.getElementById("tMarkup").textContent = currency(markupAmount);
    document.getElementById("tTax").textContent = currency(taxAmount);
    document.getElementById("tGrand").textContent = currency(grandTotal);

    saveState();
  }

  function saveState() {
    const state = { fields: {}, labor: [], materials: [] };

    fields.forEach((id) => {
      state.fields[id] = document.getElementById(id).value;
    });

    laborBody.querySelectorAll("tr").forEach((row) => {
      state.labor.push({
        desc: row.querySelector(".l-desc").value,
        hours: row.querySelector(".l-hours").value,
        rate: row.querySelector(".l-rate").value,
      });
    });

    materialBody.querySelectorAll("tr").forEach((row) => {
      state.materials.push({
        desc: row.querySelector(".m-desc").value,
        qty: row.querySelector(".m-qty").value,
        cost: row.querySelector(".m-cost").value,
      });
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    let state;
    try {
      state = JSON.parse(raw);
    } catch (e) {
      return false;
    }

    fields.forEach((id) => {
      if (state.fields && state.fields[id] !== undefined) {
        document.getElementById(id).value = state.fields[id];
      }
    });

    (state.labor || []).forEach((item) => addLaborRow(item));
    (state.materials || []).forEach((item) => addMaterialRow(item));

    return (state.labor && state.labor.length > 0) || (state.materials && state.materials.length > 0);
  }

  function resetAll() {
    if (!confirm("Clear this estimate and start over?")) return;
    localStorage.removeItem(STORAGE_KEY);
    fields.forEach((id) => {
      const el = document.getElementById(id);
      el.value = id === "markupPct" || id === "taxPct" ? "0" : "";
    });
    laborBody.innerHTML = "";
    materialBody.innerHTML = "";
    addLaborRow();
    addMaterialRow();
    recalcAll();
  }

  document.getElementById("addLaborRow").addEventListener("click", () => {
    addLaborRow();
    recalcAll();
  });
  document.getElementById("addMaterialRow").addEventListener("click", () => {
    addMaterialRow();
    recalcAll();
  });
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("markupPct").addEventListener("input", recalcAll);
  document.getElementById("taxPct").addEventListener("input", recalcAll);

  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el.tagName === "TEXTAREA" || el.type === "text" || el.type === "date") {
      el.addEventListener("input", saveState);
    }
  });

  const hadData = loadState();
  if (!hadData) {
    addLaborRow();
    addMaterialRow();
    const dateField = document.getElementById("estimateDate");
    if (!dateField.value) {
      dateField.value = new Date().toISOString().slice(0, 10);
    }
  }

  recalcAll();

  // --- AI Photo Estimate ---

  const photoInput = document.getElementById("photoInput");
  const photoPreview = document.getElementById("photoPreview");
  const photoContext = document.getElementById("photoContext");
  const analyzeBtn = document.getElementById("analyzePhotosBtn");
  const aiStatus = document.getElementById("aiStatus");
  const aiResults = document.getElementById("aiResults");
  const MAX_PHOTOS = 4;

  let selectedPhotos = [];

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  photoInput.addEventListener("change", async () => {
    selectedPhotos = [];
    photoPreview.innerHTML = "";
    aiResults.innerHTML = "";
    aiStatus.textContent = "";
    aiStatus.className = "ai-status";

    const files = Array.from(photoInput.files).slice(0, MAX_PHOTOS);
    for (const file of files) {
      const dataUrl = await readFileAsDataURL(file);
      const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
      if (!match) continue;
      const [, mediaType, data] = match;
      selectedPhotos.push({ data, mediaType });

      const img = document.createElement("img");
      img.src = dataUrl;
      img.className = "photo-thumb";
      img.alt = file.name;
      img.title = file.name;
      photoPreview.appendChild(img);
    }
  });

  analyzeBtn.addEventListener("click", async () => {
    if (selectedPhotos.length === 0) {
      aiStatus.textContent = "Choose at least one photo first.";
      aiStatus.className = "ai-status ai-error";
      return;
    }

    aiStatus.textContent = "Analyzing photos...";
    aiStatus.className = "ai-status";
    aiResults.innerHTML = "";
    analyzeBtn.disabled = true;

    try {
      const res = await fetch("/api/estimate-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: selectedPhotos,
          context: photoContext.value.trim(),
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Request failed");
      }

      renderAiResults(payload);
      aiStatus.textContent = "";
    } catch (err) {
      aiStatus.textContent =
        "Couldn't analyze photos: " + err.message +
        ". Make sure the app is running via 'npm start' with ANTHROPIC_API_KEY set.";
      aiStatus.className = "ai-status ai-error";
    } finally {
      analyzeBtn.disabled = false;
    }
  });

  function buildSuggestionRow(item, kind) {
    const row = document.createElement("div");
    row.className = "suggestion-row";
    row.dataset.kind = kind;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    row.appendChild(checkbox);

    const desc = document.createElement("input");
    desc.type = "text";
    desc.className = "s-desc";
    desc.value = item.description || "";
    row.appendChild(desc);

    if (kind === "labor") {
      const hours = document.createElement("input");
      hours.type = "number";
      hours.className = "s-hours";
      hours.step = "0.25";
      hours.min = "0";
      hours.value = item.hours ?? 0;
      row.appendChild(hours);

      const rate = document.createElement("input");
      rate.type = "number";
      rate.className = "s-rate";
      rate.step = "0.01";
      rate.min = "0";
      rate.value = item.rate ?? 0;
      row.appendChild(rate);
    } else {
      const qty = document.createElement("input");
      qty.type = "number";
      qty.className = "s-qty";
      qty.step = "1";
      qty.min = "0";
      qty.value = item.qty ?? 0;
      row.appendChild(qty);

      const cost = document.createElement("input");
      cost.type = "number";
      cost.className = "s-cost";
      cost.step = "0.01";
      cost.min = "0";
      cost.value = item.unitCost ?? 0;
      row.appendChild(cost);
    }

    return row;
  }

  function buildSuggestionGroup(title, items, kind) {
    const wrap = document.createElement("div");
    wrap.className = "suggestion-group";

    const h3 = document.createElement("h3");
    h3.textContent = title;
    wrap.appendChild(h3);

    items.forEach((item) => wrap.appendChild(buildSuggestionRow(item, kind)));

    return wrap;
  }

  function renderAiResults(payload) {
    aiResults.innerHTML = "";

    if (payload.summary) {
      const p = document.createElement("p");
      p.className = "ai-summary";
      p.textContent = payload.summary;
      aiResults.appendChild(p);
    }

    const laborItems = payload.labor || [];
    const materialItems = payload.materials || [];

    if (laborItems.length === 0 && materialItems.length === 0) {
      const p = document.createElement("p");
      p.textContent = "No suggestions found for these photos.";
      aiResults.appendChild(p);
      return;
    }

    const suggestionsWrap = document.createElement("div");
    suggestionsWrap.className = "ai-suggestions";

    if (laborItems.length) {
      suggestionsWrap.appendChild(buildSuggestionGroup("Suggested Labor", laborItems, "labor"));
    }
    if (materialItems.length) {
      suggestionsWrap.appendChild(buildSuggestionGroup("Suggested Materials", materialItems, "material"));
    }

    aiResults.appendChild(suggestionsWrap);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary";
    addBtn.textContent = "Add Selected to Estimate";
    addBtn.addEventListener("click", () => {
      let addedCount = 0;
      suggestionsWrap.querySelectorAll(".suggestion-row").forEach((row) => {
        const checkbox = row.querySelector("input[type=checkbox]");
        if (!checkbox.checked) return;
        const kind = row.dataset.kind;
        const desc = row.querySelector(".s-desc").value;

        if (kind === "labor") {
          const hours = parseFloat(row.querySelector(".s-hours").value) || 0;
          const rate = parseFloat(row.querySelector(".s-rate").value) || 0;
          addLaborRow({ desc, hours, rate });
        } else {
          const qty = parseFloat(row.querySelector(".s-qty").value) || 0;
          const cost = parseFloat(row.querySelector(".s-cost").value) || 0;
          addMaterialRow({ desc, qty, cost });
        }
        addedCount++;
      });

      recalcAll();
      aiStatus.textContent = addedCount > 0
        ? `Added ${addedCount} item(s) to the estimate below.`
        : "No items were selected.";
      aiStatus.className = addedCount > 0 ? "ai-status ai-success" : "ai-status ai-error";
    });

    aiResults.appendChild(addBtn);
  }
})();
