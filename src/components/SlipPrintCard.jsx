export const SLIP_TITLE_OPTIONS = [
  "Degree",
  "Transcript",
  "Letter",
  "Migration",
  "Late Fee Fine",
  "Summer Late Enrollment Fine",
  "Summer Enrollment",
  "Final Year Project",
  "Absence Fine Slip",
  "Other",
];

export const SESSION_TYPES = ["Fall", "Spring", "Summer"];

// Each real physical slip has slightly different fields (confirmed against
// the office's paper templates). This maps every slip title to exactly the
// rows it should show, in two columns, left-to-right, top-to-bottom —
// matching the paper originals field-for-field.
const SLIP_LAYOUTS = {
  "Absence Fine Slip": {
    amountLabel: "Total Amount",
    left: ["rollNo", "amount", "dsa"],
    right: ["program", "totalAbsents", "accountsManager"],
  },
  "Final Year Project": {
    amountLabel: "Amount",
    left: ["rollNo", "amount", "preparedBy"],
    right: ["program", "accountsManager"],
  },
  "Summer Enrollment": {
    amountLabel: "Amount",
    left: ["rollNo", "amount", "preparedBy"],
    right: ["program", "courses", "accountsManager"],
  },
  "Summer Late Enrollment Fine": {
    amountLabel: "Amount",
    left: ["rollNo", "amount", "preparedBy"],
    right: ["program", "accountsManager"],
  },
  Degree: {
    amountLabel: "Amount",
    left: ["rollNo", "amount", "preparedBy"],
    right: ["program", "detail", "accountsManager"],
    detailLabel: "Degree",
  },
  Transcript: {
    amountLabel: "Amount",
    left: ["rollNo", "amount", "preparedBy"],
    right: ["program", "detail", "accountsManager"],
    detailLabel: "Transcript",
  },
  Letter: {
    amountLabel: "Amount",
    left: ["rollNo", "amount", "preparedBy"],
    right: ["program", "detail", "accountsManager"],
    detailLabel: "Letter",
  },
  Migration: {
    amountLabel: "Amount",
    left: ["rollNo", "amount", "preparedBy"],
    right: ["program", "detail", "accountsManager"],
    detailLabel: "Migration",
  },
  "Late Fee Fine": {
    amountLabel: "Total Amount",
    left: ["rollNo", "amount", "preparedBy"],
    right: ["program", "accountsManager"],
  },
  Other: {
    amountLabel: "Amount",
    left: ["rollNo", "amount", "preparedBy"],
    right: ["program", "accountsManager"],
  },
};

const FIELD_LABELS = {
  rollNo: "Roll No",
  program: "Program",
  preparedBy: "Prepared by",
  accountsManager: "Accounts Manager",
  dsa: "DSA",
  totalAbsents: "Total Absents",
  courses: "courses",
};

function getSlipLayout(title) {
  return SLIP_LAYOUTS[(title || "").trim()] || SLIP_LAYOUTS.Other;
}

// Slip background image — public/assets/slip-bg.png.jfif (Vite serves
// everything under /public from the site root).
const SLIP_BG_URL = "/assets/slip-bg.png.jfif";
const SLIP_BG_ASPECT_RATIO = "1600 / 660";

// Same value/label rules used both on-screen (by the component below) and
// inside the plain-HTML print document (by printSlip() below) — kept as
// plain functions, not JSX, so there's exactly one source of truth for
// "what goes on the slip" instead of two copies that could drift apart.
function slipFieldValue(slip, key) {
  const extra = slip.extra || {};
  switch (key) {
    case "rollNo":
      return slip.rollNo;
    case "program":
      return slip.program || "—";
    case "amount":
      return `Rs ${Number(slip.amount || 0).toLocaleString()}`;
    case "preparedBy":
      return slip.preparedBy;
    case "accountsManager":
      return "";
    case "detail":
      return extra.detail || "";
    default:
      return extra[key] || "";
  }
}

function slipFieldLabel(layout, key) {
  return key === "amount"
    ? layout.amountLabel
    : key === "detail"
      ? layout.detailLabel
      : FIELD_LABELS[key];
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

// Opens a small, completely separate print-only window containing NOTHING
// but this one slip — no app layout, no sidebar, no other cards — and
// prints it there.
//
// This is what actually fixes the extra-blank-page / black-sheet /
// blank-print problems: those all came from trying to print just *part*
// of the current page while the rest of the app's layout (sidebar, long
// page content, min-height wrappers, etc.) interfered one way or another.
// A dedicated, self-contained document has none of that to interfere.
//
// Call this instead of window.print() wherever this slip needs to be
// printed (see ApplicationDetail.jsx's handlePrintSlip and
// SlipLookup.jsx).
export function printSlip(slip) {
  if (!slip) return;
  const layout = getSlipLayout(slip.title);
  const bgUrl = `${window.location.origin}${SLIP_BG_URL}`;

  const fieldRow = (key) => `
    <p class="field">${escapeHtml(slipFieldLabel(layout, key))}:
      <span>${escapeHtml(slipFieldValue(slip, key)) || "&nbsp;"}</span>
    </p>`;

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Slip ${slip.serialNumber ? "#" + slip.serialNumber : ""}</title>
<style>
  @page { margin: 6mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111111; }
  .slip {
    width: 700px;
    max-width: 100%;
    aspect-ratio: ${SLIP_BG_ASPECT_RATIO};
    background-image: url('${bgUrl}');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .inner {
    height: 100%;
    padding: 32px 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  h2 { text-align: center; font-size: 20px; font-weight: bold; margin: 0 0 4px; }
  .subtitle { text-align: center; font-weight: bold; text-decoration: underline; font-size: 14px; margin: 0 0 16px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; font-size: 14px; }
  .field { font-weight: bold; white-space: nowrap; margin: 0 0 12px; }
  .field span { border-bottom: 2px solid #111; padding: 0 4px; display: inline-block; min-width: 100px; }
  .serial { text-align: right; font-size: 12px; font-weight: bold; margin-top: 8px; }
</style>
</head>
<body>
  <div class="slip">
    <div class="inner">
      <h2>University of South Asia</h2>
      <p class="subtitle">${escapeHtml(slip.title)} ${escapeHtml(slip.sessionType)} ${escapeHtml(slip.sessionYear)}</p>
      <div class="cols">
        <div>${layout.left.map(fieldRow).join("")}</div>
        <div>${layout.right.map(fieldRow).join("")}</div>
      </div>
      ${
        slip.serialNumber
          ? `<p class="serial">Slip # ${escapeHtml(String(slip.serialNumber).padStart(6, "0"))}</p>`
          : ""
      }
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=820,height=460");
  if (!win) {
    alert(
      "Popup blocked — is site ke liye popups allow karein taake slip print ho sake.",
    );
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();

  // Wait for the new window to fully load (including the background
  // image) before printing — printing too early, before the image had
  // loaded, is exactly what caused the earlier black/blank print.
  win.onload = () => {
    win.focus();
    setTimeout(() => win.print(), 60);
  };
  win.onafterprint = () => win.close();
}

// slip: { title, sessionType, sessionYear, rollNo, program, amount,
//         preparedBy, extra, serialNumber? }
// onChange: optional — pass to make title/program/session/year + hand-typed
//           extra fields editable (used on ApplicationDetail before a
//           serial is issued). Omit for a read-only historical slip
//           (SlipLookup).
// onPrint: what happens when "Print Slip" is clicked (parent decides
//          whether that means "save then print" or just "print" — the
//          actual printing itself should call printSlip(slip), exported
//          above, instead of window.print()).
// onClose: optional — shows a Close button.
// printing: shows a "Saving…" state on the print button.
export default function SlipPrintCard({
  slip,
  onChange,
  onClose,
  onPrint,
  printing,
}) {
  if (!slip) return null;
  const layout = getSlipLayout(slip.title);
  const extra = slip.extra || {};
  const editable = !!onChange && !slip.serialNumber;

  const fieldValue = (key) => slipFieldValue(slip, key);
  const fieldLabel = (key) => slipFieldLabel(layout, key);

  // Which extra fields (not tied to existing app data) does this slip
  // need Data Entry to type in by hand?
  const editableKeys = [...layout.left, ...layout.right].filter((k) =>
    ["dsa", "totalAbsents", "courses", "detail"].includes(k),
  );

  return (
    <div className="card space-y-4">
      <div
        id="fine-slip-preview"
        className="mx-auto"
        style={{
          width: "700px",
          maxWidth: "100%",
          aspectRatio: SLIP_BG_ASPECT_RATIO,
          backgroundImage: `url('${SLIP_BG_URL}')`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          color: "#111111",
          overflow: "hidden",
        }}
      >
        <div className="relative h-full px-20 py-8 flex flex-col justify-center overflow-hidden">
          <div className="relative text-center mb-1">
            <h2 className="text-xl font-bold">University of South Asia</h2>
            <p className="font-bold underline text-sm mt-1">
              {slip.title} {slip.sessionType} {slip.sessionYear}
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-x-6 gap-y-3 mt-3 text-sm">
            <div className="space-y-3">
              {layout.left.map((key) => (
                <p key={key} className="font-bold whitespace-nowrap">
                  {fieldLabel(key)}:{" "}
                  <span className="border-b-2 border-gray-900 px-1 font-bold inline-block min-w-[100px]">
                    {fieldValue(key) || "\u00A0"}
                  </span>
                </p>
              ))}
            </div>
            <div className="space-y-3">
              {layout.right.map((key) => (
                <p key={key} className="font-bold whitespace-nowrap">
                  {fieldLabel(key)}:{" "}
                  <span className="border-b-2 border-gray-900 px-1 font-bold inline-block min-w-[100px]">
                    {fieldValue(key) || "\u00A0"}
                  </span>
                </p>
              ))}
            </div>
          </div>

          {slip.serialNumber && (
            <p className="relative text-right text-xs font-bold mt-2">
              Slip # {String(slip.serialNumber).padStart(6, "0")}
            </p>
          )}
        </div>
      </div>

      {editable && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <input
            className="input w-64"
            placeholder="Program (chota/short form likho agar bara hai)"
            value={slip.program || ""}
            onChange={(e) => onChange({ ...slip, program: e.target.value })}
          />
        </div>
      )}

      {editable && editableKeys.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {editableKeys.map((key) => (
            <input
              key={key}
              className="input w-auto"
              placeholder={fieldLabel(key)}
              value={extra[key] || ""}
              onChange={(e) =>
                onChange({
                  ...slip,
                  extra: { ...extra, [key]: e.target.value },
                })
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {editable ? (
          <>
            <input
              className="input w-48"
              placeholder="Slip Title"
              value={slip.title}
              onChange={(e) => onChange({ ...slip, title: e.target.value })}
            />
            <select
              className="input w-auto"
              value={slip.sessionType}
              onChange={(e) =>
                onChange({ ...slip, sessionType: e.target.value })
              }
            >
              {SESSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              className="input w-24"
              type="number"
              value={slip.sessionYear}
              onChange={(e) =>
                onChange({ ...slip, sessionYear: e.target.value })
              }
            />
          </>
        ) : (
          <span className="text-xs text-gray-400">
            {slip.sessionType} {slip.sessionYear}
          </span>
        )}
        <button className="btn-primary" onClick={onPrint} disabled={printing}>
          {printing
            ? "Saving…"
            : slip.serialNumber
              ? "🖨️ Print Slip"
              : "🖨️ Print & Save Slip"}
        </button>
        {onClose && (
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
