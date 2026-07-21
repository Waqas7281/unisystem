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

function SlipPreview({ slip }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!slip || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, slip.token, {
      width: 110,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff00" },
    }).catch(() => {});
  }, [slip]);

  if (!slip) return null;

  const validTill = new Date(slip.expiresAt).toLocaleDateString();

  return (
    <div className="space-y-3">
      <div
        id="clearance-slip-printable"
        className="mx-auto rounded-lg shadow-md p-8 relative"
        style={{
          background: slip.backgroundColor || DEFAULT_BG,
          width: "700px",
          maxWidth: "100%",
          minHeight: "260px",
          color: "#1a1a1a",
        }}
      >
        <h2 className="text-center text-2xl font-bold mb-1">Clearance Slip</h2>
        <p className="text-center font-semibold mb-6">{slip.term}</p>

        <p className="leading-8 text-[15px]">
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

        <div className="absolute right-8 bottom-6 flex flex-col items-center">
          <canvas ref={canvasRef} />
          <p className="text-xs font-semibold mt-1">Accounts Manager</p>
        </div>

        <p className="absolute left-8 bottom-6 text-[10px] text-gray-700">
          Valid till {validTill} · Scan once per day to verify
        </p>
      </div>

      <div className="flex justify-center gap-2 print:hidden">
        <button className="btn-primary" onClick={() => window.print()}>
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
