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
})();
