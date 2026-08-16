(function () {
  const STORAGE_KEY = "contractorEstimate";

  const laborBody = document.getElementById("laborBody");
  const materialBody = document.getElementById("materialBody");
  const laborRowTemplate = document.getElementById("laborRowTemplate");
  const materialRowTemplate = document.getElementById("materialRowTemplate");

  const fields = [
    "companyName", "companyContact", "companyAddress",
    "clientName", "jobAddress", "clientContact",
    "estimateNumber", "estimateDate", "validUntil", "jobCategory",
    "jobDescription", "notes", "markupPct", "taxPct", "marketArea", "pricingZip"
  ];

  const DEFAULT_MARKET_AREA = "Chicagoland (Chicago Metro Area), IL";
  const DEFAULT_PRICING_ZIP = "60463";
  const JOBS_STORAGE_KEY = "contractorEstimateJobsList";

  let currentJobId = null;

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

  function buildStateSnapshot() {
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

    return state;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildStateSnapshot()));
  }

  function applyStateToForm(state) {
    fields.forEach((id) => {
      const el = document.getElementById(id);
      el.value = state.fields && state.fields[id] !== undefined ? state.fields[id] : "";
    });

    laborBody.innerHTML = "";
    materialBody.innerHTML = "";
    (state.labor || []).forEach((item) => addLaborRow(item));
    (state.materials || []).forEach((item) => addMaterialRow(item));
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

    applyStateToForm(state);

    return (state.labor && state.labor.length > 0) || (state.materials && state.materials.length > 0);
  }

  function resetAll() {
    if (!confirm("Start a new job? Any unsaved changes to the current form will be lost (use \"Save Job\" first if you want to keep them).")) return;
    localStorage.removeItem(STORAGE_KEY);
    currentJobId = null;
    fields.forEach((id) => {
      const el = document.getElementById(id);
      if (id === "markupPct" || id === "taxPct") {
        el.value = "0";
      } else if (id === "marketArea") {
        el.value = DEFAULT_MARKET_AREA;
      } else if (id === "pricingZip") {
        el.value = DEFAULT_PRICING_ZIP;
      } else {
        el.value = "";
      }
    });
    laborBody.innerHTML = "";
    materialBody.innerHTML = "";
    addLaborRow();
    addMaterialRow();
    recalcAll();
    updateJobStatus("");
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

  const marketAreaField = document.getElementById("marketArea");
  if (!marketAreaField.value.trim()) {
    marketAreaField.value = DEFAULT_MARKET_AREA;
  }
  const pricingZipField = document.getElementById("pricingZip");
  if (!pricingZipField.value.trim()) {
    pricingZipField.value = DEFAULT_PRICING_ZIP;
  }

  recalcAll();

  // --- Job Management (My Jobs) ---

  const myJobsBtn = document.getElementById("myJobsBtn");
  const saveJobBtn = document.getElementById("saveJobBtn");
  const jobsPanel = document.getElementById("jobsPanel");
  const jobsList = document.getElementById("jobsList");
  const jobsFilter = document.getElementById("jobsFilter");
  const closeJobsPanel = document.getElementById("closeJobsPanel");
  const jobStatus = document.getElementById("jobStatus");

  function loadJobs() {
    try {
      const raw = localStorage.getItem(JOBS_STORAGE_KEY);
      const jobs = raw ? JSON.parse(raw) : [];
      return Array.isArray(jobs) ? jobs : [];
    } catch (e) {
      return [];
    }
  }

  function persistJobs(jobs) {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  }

  function generateJobId() {
    return window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : "job-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function calcGrandTotalFromState(state) {
    const laborTotal = (state.labor || []).reduce(
      (sum, l) => sum + (parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0), 0
    );
    const materialTotal = (state.materials || []).reduce(
      (sum, m) => sum + (parseFloat(m.qty) || 0) * (parseFloat(m.cost) || 0), 0
    );
    const subtotal = laborTotal + materialTotal;
    const markupPct = parseFloat(state.fields.markupPct) || 0;
    const taxPct = parseFloat(state.fields.taxPct) || 0;
    const markupAmount = subtotal * (markupPct / 100);
    const taxableBase = subtotal + markupAmount;
    const taxAmount = taxableBase * (taxPct / 100);
    return taxableBase + taxAmount;
  }

  function updateJobStatus(message) {
    jobStatus.textContent = message || "";
  }

  function refreshJobsFilterOptions(jobs) {
    const categories = Array.from(new Set(jobs.map((j) => j.category).filter(Boolean))).sort();
    const current = jobsFilter.value;
    jobsFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      jobsFilter.appendChild(opt);
    });
    if (categories.includes(current)) {
      jobsFilter.value = current;
    }
  }

  function renderJobsList() {
    const allJobs = loadJobs();
    refreshJobsFilterOptions(allJobs);

    const filter = jobsFilter.value;
    const jobs = allJobs
      .filter((j) => !filter || j.category === filter)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    jobsList.innerHTML = "";

    if (jobs.length === 0) {
      const p = document.createElement("p");
      p.className = "jobs-empty";
      p.textContent = allJobs.length === 0
        ? 'No saved jobs yet. Fill out an estimate, pick a category, and click "Save Job".'
        : "No jobs in this category.";
      jobsList.appendChild(p);
      return;
    }

    jobs.forEach((job) => {
      const card = document.createElement("div");
      card.className = "job-card" + (job.id === currentJobId ? " job-card-active" : "");

      const info = document.createElement("div");
      info.className = "job-card-info";

      const titleRow = document.createElement("div");
      titleRow.className = "job-card-title";
      if (job.category) {
        const tag = document.createElement("span");
        tag.className = "category-tag";
        tag.textContent = job.category;
        titleRow.appendChild(tag);
      }
      const name = document.createElement("span");
      name.textContent = job.clientName || job.estimateNumber || "Untitled Job";
      titleRow.appendChild(name);
      info.appendChild(titleRow);

      const meta = document.createElement("div");
      meta.className = "job-card-meta";
      const savedDate = job.savedAt ? new Date(job.savedAt).toLocaleDateString() : "";
      meta.textContent = [job.jobAddress, currency(job.total || 0), savedDate].filter(Boolean).join(" · ");
      info.appendChild(meta);

      card.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "job-card-actions";

      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "btn btn-secondary";
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", () => openJob(job.id));
      actions.appendChild(openBtn);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-danger";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => deleteJob(job.id));
      actions.appendChild(delBtn);

      card.appendChild(actions);
      jobsList.appendChild(card);
    });
  }

  function openJob(id) {
    const jobs = loadJobs();
    const job = jobs.find((j) => j.id === id);
    if (!job) return;

    applyStateToForm(job.state);
    currentJobId = id;
    recalcAll();
    renderJobsList();
    jobsPanel.classList.add("hidden");
    updateJobStatus(`Opened "${job.clientName || job.category || "job"}".`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteJob(id) {
    if (!confirm("Delete this saved job? This cannot be undone.")) return;
    const jobs = loadJobs().filter((j) => j.id !== id);
    persistJobs(jobs);
    if (currentJobId === id) currentJobId = null;
    renderJobsList();
  }

  function saveCurrentJob() {
    const state = buildStateSnapshot();
    const jobs = loadJobs();
    const summary = {
      category: state.fields.jobCategory || "",
      clientName: state.fields.clientName || "",
      jobAddress: state.fields.jobAddress || "",
      estimateNumber: state.fields.estimateNumber || "",
      total: calcGrandTotalFromState(state),
    };

    const existingIdx = currentJobId ? jobs.findIndex((j) => j.id === currentJobId) : -1;
    if (existingIdx >= 0) {
      jobs[existingIdx] = { ...jobs[existingIdx], ...summary, state, savedAt: new Date().toISOString() };
    } else {
      currentJobId = generateJobId();
      jobs.push({ id: currentJobId, ...summary, state, savedAt: new Date().toISOString() });
    }

    persistJobs(jobs);
    renderJobsList();
    updateJobStatus(
      `Saved${summary.category ? " " + summary.category : ""} job${summary.clientName ? " for " + summary.clientName : ""}.`
    );
  }

  myJobsBtn.addEventListener("click", () => {
    const opening = jobsPanel.classList.contains("hidden");
    jobsPanel.classList.toggle("hidden");
    if (opening) renderJobsList();
  });
  closeJobsPanel.addEventListener("click", () => jobsPanel.classList.add("hidden"));
  jobsFilter.addEventListener("change", renderJobsList);
  saveJobBtn.addEventListener("click", saveCurrentJob);

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
          marketArea: document.getElementById("marketArea").value.trim(),
          pricingZip: document.getElementById("pricingZip").value.trim(),
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

    const fragment = document.createDocumentFragment();
    fragment.appendChild(row);

    if (kind === "material" && item.source) {
      const source = document.createElement("div");
      source.className = "suggestion-source";
      source.textContent = item.source === "estimated" ? "Estimated (no exact match found)" : `Priced from ${item.source}`;
      fragment.appendChild(source);
    }

    return fragment;
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
