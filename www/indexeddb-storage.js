// Durable browser-side storage for survey records, using IndexedDB.
// Works identically whether Shiny is running on a live server or, as here,
// entirely client-side via shinylive - Shiny's JS<->R messaging channel is
// the same either way.

const HM_DB_NAME = "hauMoanaDB";
const HM_STORE_NAME = "records";

const hmDbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(HM_DB_NAME, 1);
  request.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(HM_STORE_NAME)) {
      db.createObjectStore(HM_STORE_NAME, { keyPath: "id", autoIncrement: true });
    }
  };
  request.onsuccess = (event) => resolve(event.target.result);
  request.onerror = (event) => reject(event.target.error);
});

function hmAddRecord(row) {
  return hmDbPromise.then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HM_STORE_NAME, "readwrite");
      tx.objectStore(HM_STORE_NAME).add(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function hmGetAllRecords() {
  return hmDbPromise.then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HM_STORE_NAME, "readonly");
      const req = tx.objectStore(HM_STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

function hmShowCsv(records, filename) {
  console.log("hmShowCsv called with", records.length, "records, filename:", filename);
  if (records.length === 0) {
    alert("No records saved yet - nothing to export.");
    return;
  }

  const cols = Object.keys(records[0]).filter((k) => k !== "id");
  const escape = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const header = cols.map(escape).join(",");
  const rows = records.map((r) => cols.map((c) => escape(r[c])).join(","));
  const csv = [header, ...rows].join("\n");

  // Build (or reuse) a full-screen panel showing the CSV as selectable text.
  // This works regardless of any download/clipboard permission restrictions -
  // worst case, the user reads or manually selects the text.
  let panel = document.getElementById("hm-export-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "hm-export-panel";
    panel.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:99999;" +
      "display:flex;flex-direction:column;padding:16px;box-sizing:border-box;";

    const toolbar = document.createElement("div");
    toolbar.style.cssText =
      "color:white;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;";
    toolbar.innerHTML = "<strong>Exported data - select all &amp; copy</strong>";

    const btnGroup = document.createElement("div");

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy to clipboard";
    copyBtn.style.cssText = "padding:8px 16px;margin-right:8px;";
    copyBtn.onclick = () => {
      const ta = document.getElementById("hm-export-textarea");
      ta.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).catch(() => document.execCommand("copy"));
      } else {
        document.execCommand("copy");
      }
    };

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.cssText = "padding:8px 16px;";
    closeBtn.onclick = () => panel.remove();

    btnGroup.appendChild(copyBtn);
    btnGroup.appendChild(closeBtn);
    toolbar.appendChild(btnGroup);

    const ta = document.createElement("textarea");
    ta.id = "hm-export-textarea";
    ta.readOnly = true;
    ta.style.cssText = "flex:1;width:100%;font-family:monospace;font-size:12px;box-sizing:border-box;";

    panel.appendChild(toolbar);
    panel.appendChild(ta);
    document.body.appendChild(panel);
  }

  const ta = document.getElementById("hm-export-textarea");
  ta.value = csv;
  ta.select();

  // Also attempt a normal download - harmless if blocked, convenient if not.
  try {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.warn("Automatic download failed - use the on-screen copy panel instead:", err);
  }
}

$(document).on("shiny:connected", function () {
  // R calls this after every record - persist it immediately.
  Shiny.addCustomMessageHandler("hm_save_record", function (row) {
    hmAddRecord(row);
  });

  // R calls this when the "Export CSV" button is pressed.
  Shiny.addCustomMessageHandler("hm_export_csv", function (msg) {
    console.log("hm_export_csv message received from R:", msg);
    hmGetAllRecords().then((records) => hmShowCsv(records, msg.filename));
  });

  // On every page load, hand back whatever's already stored so the on-screen
  // table can be rebuilt - this is what makes a reload mid-survey non-scary.
  // Sent as a JSON string (not a raw object array) so R parses it explicitly
  // with simplifyDataFrame = FALSE, rather than relying on Shiny's default
  // input-value simplification, which behaves differently depending on how
  // many records there are and was silently crashing the session.
  hmGetAllRecords().then((records) => {
    Shiny.setInputValue("restored_records_json", JSON.stringify(records));
  });
});
