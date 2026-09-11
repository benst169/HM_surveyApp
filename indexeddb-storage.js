// Durable browser-side storage for survey records, using IndexedDB.
// Works identically whether Shiny is running on a live server or, as here,
// entirely client-side via shinylive - Shiny's JS<->R messaging channel is
// the same either way.

// --- TEMPORARY on-screen debug log -----------------------------------
// Remote devtools access is blocked on the test tablet (organizational
// device policy), so this prints key checkpoints directly on screen
// instead of to the console. Safe to delete once diagnosis is done.
const hmPendingLogs = [];
function hmDebugInit() {
  if (document.getElementById("hm-debug-box")) return;
  const box = document.createElement("div");
  box.id = "hm-debug-box";
  box.style.cssText =
    "position:fixed;top:0;left:0;right:0;max-height:35vh;overflow-y:auto;" +
    "background:rgba(0,0,0,0.85);color:#0f0;font-family:monospace;" +
    "font-size:10px;z-index:999999;padding:4px;white-space:pre-wrap;";
  document.body.appendChild(box);
}
function hmDebug(msg) {
  const line = new Date().toLocaleTimeString() + " - " + msg;
  if (!document.body) {
    hmPendingLogs.push(line);
    return;
  }
  hmDebugInit();
  const box = document.getElementById("hm-debug-box");
  const div = document.createElement("div");
  div.textContent = line;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
document.addEventListener("DOMContentLoaded", function () {
  hmDebugInit();
  const box = document.getElementById("hm-debug-box");
  hmPendingLogs.forEach(function (line) {
    const div = document.createElement("div");
    div.textContent = line;
    box.appendChild(div);
  });
  hmPendingLogs.length = 0;
});
// --- end debug log helper ---------------------------------------------

hmDebug("indexeddb-storage.js script started executing");

const HM_DB_NAME = "hauMoanaDB";
const HM_STORE_NAME = "records";

const hmDbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(HM_DB_NAME, 1);
  request.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(HM_STORE_NAME)) {
      db.createObjectStore(HM_STORE_NAME, { keyPath: "id", autoIncrement: true });
    }
    hmDebug("IndexedDB onupgradeneeded ran (store created/verified)");
  };
  request.onsuccess = (event) => {
    hmDebug("IndexedDB opened successfully");
    resolve(event.target.result);
  };
  request.onerror = (event) => {
    hmDebug("IndexedDB open FAILED: " + event.target.error);
    reject(event.target.error);
  };
});

function hmAddRecord(row) {
  return hmDbPromise.then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HM_STORE_NAME, "readwrite");
      tx.objectStore(HM_STORE_NAME).add(row);
      tx.oncomplete = () => {
        hmDebug("Record saved to IndexedDB OK");
        resolve();
      };
      tx.onerror = () => {
        hmDebug("Record save FAILED: " + tx.error);
        reject(tx.error);
      };
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
  hmDebug("hmShowCsv called with " + records.length + " records");
  if (records.length === 0) {
    alert("No records saved yet - nothing to export.");
    return;
  }

  const cols = Object.keys(records[0]).filter((k) => k !== "id");
  const escape = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const header = cols.map(escape).join(",");
  const rows = records.map((r) => cols.map((c) => escape(r[c])).join(","));
  const csv = [header, ...rows].join("\n");

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
    hmDebug("Automatic download attempted");
  } catch (err) {
    hmDebug("Automatic download failed: " + err.message);
  }
}

hmDebug("Waiting for shiny:connected event...");

$(document).on("shiny:connected", function () {
  hmDebug("shiny:connected fired - registering message handlers");

  Shiny.addCustomMessageHandler("hm_save_record", function (row) {
    hmDebug("hm_save_record message received from R");
    hmAddRecord(row);
  });

  Shiny.addCustomMessageHandler("hm_export_csv", function (msg) {
    hmDebug("hm_export_csv message received from R");
    hmGetAllRecords().then((records) => hmShowCsv(records, msg.filename));
  });

  hmGetAllRecords().then((records) => {
    hmDebug("Restore check found " + records.length + " existing record(s)");
    Shiny.setInputValue("restored_records_json", JSON.stringify(records));
  }).catch((err) => {
    hmDebug("Restore check FAILED: " + err);
  });
});
