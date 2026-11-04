import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import QRCode from "qrcode";
import {
  useLazySearchClearanceStudentQuery,
  useGenerateClearanceSlipMutation,
} from "../app/api";
const DEFAULT_TERM = "Final Term Spring-2026";
const DEFAULT_BG = "#f5a623"; // matches the orange sample slip

// Slip background image: public/assets/clearance-slip-bg.png
const CLEARANCE_BG_URL = "/assets/clearance-slip-bg.png";
const CLEARANCE_ASPECT_RATIO = "2109 / 746";

function escHtml(value) {
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

// Fine slip ki tarah: sirf ye slip ek alag print window mein khulti hai,
// is liye app ka sidebar/layout print mein nahi aata aur blank page nahi banta.
function printClearanceSlip(slip, canvas) {
  if (!slip) return;
  const qrDataUrl = canvas ? canvas.toDataURL("image/png") : "";
  const bgUrl = `${window.location.origin}${CLEARANCE_BG_URL}`;
  const validTill = new Date(slip.expiresAt).toLocaleDateString();

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Clearance Slip</title>
<style>
  @page { margin: 6mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111111; }
  .slip {
    position: relative;
    width: 100%;
    max-width: 900px;
    aspect-ratio: ${CLEARANCE_ASPECT_RATIO};
    container-type: inline-size;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .bg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .text {
    position: absolute; left: 24%; top: 11%; width: 56%; height: 74%;
    display: flex; flex-direction: column; justify-content: center;
  }
  h2 { text-align: center; font-size: 3.4cqw; font-weight: 700; margin: 0; line-height: 1.2; }
  .term { text-align: center; font-weight: 600; font-size: 1.9cqw; margin: 0.6cqw 0 2.2cqw; }
  .body { font-size: 1.8cqw; line-height: 1.75; margin: 0; }
  .u { font-weight: 600; border-bottom: 1px solid #444; padding: 0 0.4cqw; }
  .qr {
    position: absolute; left: 83%; top: 28.5%; width: 15%; height: 39%;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4cqw;
  }
  .qr img { width: 74%; height: auto; }
  .qr p { font-size: 0.95cqw; font-weight: 600; margin: 0; }
  .valid { position: absolute; left: 24%; bottom: 8%; margin: 0; font-size: 1.1cqw; color: #333333; }
</style>
</head>
<body>
  <div class="slip">
    <img class="bg" src="${bgUrl}" alt="" />
    <div class="text">
      <h2>Clearance Slip</h2>
      <p class="term">${escHtml(slip.term)}</p>
      <p class="body">
        This is to certify that Mr./Ms.
        <span class="u">${escHtml(slip.student.name)}</span>,
        Roll Number <span class="u">${escHtml(slip.student.rollNumber)}</span>
        Department <span class="u">${escHtml(slip.student.department || "—")}</span>,
        has cleared all outstanding dues and is allowed to appear in the
        ${escHtml(slip.term)} examination.
      </p>
    </div>
    <div class="qr">
      <img src="${qrDataUrl}" alt="QR" />
      <p>Accounts Manager</p>
    </div>
    <p class="valid">Valid till ${escHtml(validTill)} · Scan once per day to verify</p>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=980,height=460");
  if (!win) {
    alert(
      "Popup blocked — is site ke liye popups allow karein taake slip print ho sake.",
    );
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();

  // Image load hone ke baad hi print, warna blank/black print aata hai
  win.onload = () => {
    win.focus();
    setTimeout(() => win.print(), 60);
  };
  win.onafterprint = () => win.close();
}

function SlipPreview({ slip }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!slip || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, slip.token, {
      width: 400,
      margin: 0,
      color: { dark: "#111111", light: "#ffffff" },
    }).catch(() => {});
  }, [slip]);

  if (!slip) return null;

  const validTill = new Date(slip.expiresAt).toLocaleDateString();

  return (
    <div className="space-y-3">
      <div
        id="clearance-slip-printable"
        className="mx-auto relative overflow-hidden"
        style={{
          width: "900px",
          maxWidth: "100%",
          aspectRatio: CLEARANCE_ASPECT_RATIO,
          backgroundImage: `url('${CLEARANCE_BG_URL}')`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          containerType: "inline-size",
          color: "#111111",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* Text area (beech ka hissa) */}
        <div
          style={{
            position: "absolute",
            left: "24%",
            top: "11%",
            width: "56%",
            height: "74%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "3.4cqw",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Clearance Slip
          </h2>
          <p
            style={{
              textAlign: "center",
              fontWeight: 600,
              fontSize: "1.9cqw",
              margin: "0.6cqw 0 2.2cqw",
            }}
          >
            {slip.term}
          </p>

          <p style={{ fontSize: "1.8cqw", lineHeight: 1.75, margin: 0 }}>
            This is to certify that Mr./Ms.{" "}
            <span className="font-semibold border-b border-gray-700 px-1">
              {slip.student.name}
            </span>
            , Roll Number{" "}
            <span className="font-semibold border-b border-gray-700 px-1">
              {slip.student.rollNumber}
            </span>{" "}
            Department{" "}
            <span className="font-semibold border-b border-gray-700 px-1">
              {slip.student.department || "—"}
            </span>
            , has cleared all outstanding dues and is allowed to appear in the{" "}
            {slip.term} examination.
          </p>
        </div>

        {/* QR code: design ke right side wale box ke andar */}
        <div
          style={{
            position: "absolute",
            left: "83%",
            top: "28.5%",
            width: "15%",
            height: "39%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4cqw",
          }}
        >
          <canvas ref={canvasRef} className="!w-[74%] !h-auto" />
          <p style={{ fontSize: "0.95cqw", fontWeight: 600, margin: 0 }}>
            Accounts Manager
          </p>
        </div>

        {/* Neeche left: validity */}
        <p
          style={{
            position: "absolute",
            left: "24%",
            bottom: "8%",
            margin: 0,
            fontSize: "1.1cqw",
            color: "#333333",
          }}
        >
          Valid till {validTill} · Scan once per day to verify
        </p>
      </div>

      <div className="flex justify-center gap-2 print:hidden">
        <button
          className="btn-primary"
          onClick={() => printClearanceSlip(slip, canvasRef.current)}
        >
          🖨️ Print Slip
        </button>
      </div>
    </div>
  );
}

export default function ClearanceSlip() {
  const user = useSelector((state) => state.auth.user);
  const [enrollment, setEnrollment] = useState("");
  const [term, setTerm] = useState(DEFAULT_TERM);
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [generatedSlip, setGeneratedSlip] = useState(null);

  const [search, { data, isFetching, error }] =
    useLazySearchClearanceStudentQuery();
  const [generateSlip, { isLoading: generating }] =
    useGenerateClearanceSlipMutation();

  const canGenerate = ["Manager", "AccountsManager"].includes(user?.role);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!enrollment.trim()) return;
    setGeneratedSlip(null);
    search(enrollment.trim());
  };

  const handleGenerate = async () => {
    if (!data?.student) return;
    try {
      const res = await generateSlip({
        studentId: data.student.id,
        term: term.trim() || DEFAULT_TERM,
        backgroundColor: bgColor,
      }).unwrap();
      setGeneratedSlip(res);
      toast.success("Clearance slip generated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to generate slip");
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold dark:text-gray-100 print:hidden">
        Generate Clearance Slip
      </h1>

      <form
        onSubmit={handleSearch}
        className="card flex flex-wrap items-end gap-2 print:hidden"
      >
        <div>
          <label className="text-xs text-gray-500">Enrollment Number</label>
          <input
            className="input mt-1 w-64"
            placeholder="e.g. 2021-BSCS-045"
            value={enrollment}
            onChange={(e) => setEnrollment(e.target.value)}
          />
        </div>
        <button className="btn-primary" disabled={isFetching}>
          {isFetching ? "Searching…" : "🔍 Search"}
        </button>
      </form>

      {error && (
        <p className="text-red-600 text-sm print:hidden">
          Student not found for this enrollment number.
        </p>
      )}

      {data?.student && !generatedSlip && (
        <div className="card space-y-4 print:hidden">
          <div>
            <h2 className="font-semibold">{data.student.name}</h2>
            <p className="text-sm text-gray-500">
              Roll #: {data.student.rollNo || data.student.enrollmentNumber} ·{" "}
              {data.student.program}
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-400">Total Fee</p>
              <p className="text-lg font-bold text-primary-700">
                Rs {data.totalFee.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Paid</p>
              <p className="text-lg font-bold text-green-700">
                Rs {data.totalPaid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Unpaid</p>
              <p className="text-lg font-bold text-red-700">
                Rs {data.totalUnpaid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Fine</p>
              <p className="text-lg font-bold text-amber-700">
                Rs {data.totalFine.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Fine</th>
                </tr>
              </thead>
              <tbody>
                {data.semesters.map((bucket) => {
                  const paid = bucket.fees.reduce(
                    (s, f) => s + (Number(f.paidAmount) || 0),
                    0,
                  );
                  return (
                    <tr key={bucket.semester.id}>
                      <td>{bucket.semester.label}</td>
                      <td>Rs {bucket.semesterTotal.toLocaleString()}</td>
                      <td>Rs {paid.toLocaleString()}</td>
                      <td>
                        Rs {(bucket.semesterTotal - paid).toLocaleString()}
                      </td>
                      <td>Rs {bucket.semesterFineTotal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {canGenerate ? (
            data.totalUnpaid > 0 ? (
              <p className="text-sm text-red-600">
                ⚠️ Is student ka Rs {data.totalUnpaid.toLocaleString()} baqaya
                hai. Clearance slip generate karne se pehle confirm kar lo ke
                dues clear hain.
              </p>
            ) : null
          ) : null}

          {canGenerate && (
            <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="text-xs text-gray-500">
                  Term / Session Label
                </label>
                <input
                  className="input mt-1 w-56"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block">
                  Background Color
                </label>
                <input
                  type="color"
                  className="mt-1 h-9 w-14 rounded cursor-pointer border border-gray-200 dark:border-gray-700"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </div>
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? "Generating…" : "✅ Generate Slip"}
              </button>
            </div>
          )}
        </div>
      )}

      {generatedSlip && (
        <div className="space-y-3">
          <button
            className="text-sm text-primary-600 hover:underline print:hidden"
            onClick={() => setGeneratedSlip(null)}
          >
            ← Search another student
          </button>
          <SlipPreview slip={generatedSlip} />
        </div>
      )}
    </div>
  );
}
