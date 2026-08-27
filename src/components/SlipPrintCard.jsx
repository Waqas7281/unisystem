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

// One label + bold underline row inside the printable slip.
function SlipField({ label, value }) {
  return (
    <p className="font-bold whitespace-nowrap">
      {label}:{" "}
      <span className="border-b-2 border-gray-900 px-1 font-bold inline-block min-w-[100px] print:min-w-[80px]">
        {value || "\u00A0"}
      </span>
    </p>
  );
}

// slip: { title, sessionType, sessionYear, rollNo, program, amount,
//         preparedBy, extra, serialNumber? }
// onChange: optional — pass to make session/year + hand-typed extra fields
//           editable (used on ApplicationDetail before a serial is issued).
//           Omit for a read-only historical slip (SlipLookup).
// onPrint: what happens when "Print Slip" is clicked (parent decides
//          whether that means "save then print" or just "print").
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

  const fieldValue = (key) => {
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
  };

  const fieldLabel = (key) =>
    key === "amount"
      ? layout.amountLabel
      : key === "detail"
        ? layout.detailLabel
        : FIELD_LABELS[key];

  // Which extra fields (not tied to existing app data) does this slip
  // need Data Entry to type in by hand?
  const editableKeys = [...layout.left, ...layout.right].filter((k) =>
    ["dsa", "totalAbsents", "courses", "detail"].includes(k),
  );

  return (
    <div className="card space-y-4">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #fine-slip-printable,
          #fine-slip-printable * {
            visibility: visible;
          }
          #fine-slip-printable {
            position: absolute;
            top: 0;
            left: 0;
            width: 700px !important;
            max-width: 100% !important;
            margin: 0;
            padding: 12px;
            border: none;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            margin: 6mm;
          }
        }
      `}</style>

      <div
        id="fine-slip-printable"
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
        <div className="relative h-full px-20 py-8 print:px-16 print:py-6 flex flex-col justify-center overflow-hidden">
          <div className="relative text-center mb-1">
            <h2 className="text-xl font-bold print:text-lg">
              University of South Asia
            </h2>
            <p className="font-bold underline text-sm mt-1">
              {slip.title} {slip.sessionType} {slip.sessionYear}
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-x-6 gap-y-3 mt-3 text-sm print:text-xs print:gap-y-2 print:mt-2">
            <div className="space-y-3 print:space-y-2">
              {layout.left.map((key) => (
                <SlipField
                  key={key}
                  label={fieldLabel(key)}
                  value={fieldValue(key)}
                />
              ))}
            </div>
            <div className="space-y-3 print:space-y-2">
              {layout.right.map((key) => (
                <SlipField
                  key={key}
                  label={fieldLabel(key)}
                  value={fieldValue(key)}
                />
              ))}
            </div>
          </div>

          {slip.serialNumber && (
            <p className="relative text-right text-xs font-bold mt-2 print:mt-1">
              Slip # {String(slip.serialNumber).padStart(6, "0")}
            </p>
          )}
        </div>
      </div>

      {editable && editableKeys.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
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

      <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
        {editable ? (
          <>
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
