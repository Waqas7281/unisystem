import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  useGetStudentQuery,
  useGetStudentFeesQuery,
  useGetSemestersQuery,
  useGenerateSemestersMutation,
  useExtendSemestersMutation,
  useAddFeeMutation,
  useUpdateFeeMutation,
  useUpdateFeeStatusMutation,
  useGetFeeCustomFieldsQuery,
  useCreateFeeCustomFieldMutation,
  useUpdateStudentMutation,
} from "../app/api";

// Recognizes "Spring 2022", "Fall-2022", "FALL 2022", "spring2022", etc. — same
// pattern SemestersService.parseSessionLabel uses on the backend, kept in sync so
// the Fee page can preview/prefill from a student's "Adm Session" custom field
// (captured at Admission Excel import time) without an extra API round trip.
const SESSION_LABEL_PATTERN = /(fall|spring)\s*[-\s]?\s*(\d{4})/i;
const WORD_YEARS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

// Punctuation/whitespace-tolerant key match, e.g. "Adm Session", "Admission
// Session", "Adm. Session" and "AdmSession" all resolve the same custom field.
const normalizeKey = (k) =>
  String(k)
    .replace(/[\s.]+/g, "")
    .toLowerCase();

function findCustomFieldValue(customFields, matcher) {
  if (!customFields) return undefined;
  for (const [key, value] of Object.entries(customFields)) {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      matcher(normalizeKey(key))
    ) {
      return value;
    }
  }
  return undefined;
}

function parseSessionLabel(raw) {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const match = str.match(SESSION_LABEL_PATTERN);
  if (!match) return null;
  const type = match[1].toLowerCase() === "spring" ? "Spring" : "Fall";
  return { type, year: Number(match[2]) };
}

function parseDegreeYears(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" && raw > 0) return Math.round(raw);
  const str = String(raw).trim();
  if (!str) return null;
  const numMatch = str.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    const n = parseFloat(numMatch[1]);
    if (n > 0) return Math.round(n);
  }
  const wordMatch = str
    .toLowerCase()
    .match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/);
  if (wordMatch) return WORD_YEARS[wordMatch[1]];
  return null;
}

const STATUS_TABS = [
  { key: "drop", label: "Drop" },
  { key: "dpt", label: "DPT" },
  { key: "bar", label: "Bar" },
  { key: "cancel", label: "Cancel" },
  { key: "dropOfScholarship", label: "Drop Scholarship" },
];

const PAID_STATUS_OPTIONS = ["unpaid", "partial", "paid"];

function EditableCell({
  value,
  onSave,
  type = "text",
  options = null,
  disabled = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const startEdit = () => {
    if (disabled) return;
    setDraft(value ?? "");
    setEditing(true);
  };

  const commit = async () => {
    setEditing(false);
    if (draft === (value ?? "")) return;
    await onSave(draft);
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  if (!editing) {
    return (
      <td
        className={disabled ? "" : "cursor-pointer hover:bg-gray-50"}
        onClick={startEdit}
        title={disabled ? "" : "Click to edit"}
      >
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value)}
      </td>
    );
  }

  if (options) {
    return (
      <td>
        <select
          autoFocus
          className="input py-1 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
    );
  }

  return (
    <td>
      <input
        autoFocus
        type={type}
        className="input py-1 text-sm w-full min-w-[110px]"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
      />
    </td>
  );
}

export default function StudentFeePage() {
  const { id } = useParams();
  const user = useSelector((state) => state.auth.user);
  const { data: student } = useGetStudentQuery(id);
  const { data: feeData, isLoading } = useGetStudentFeesQuery(id);
  const { data: semesters = [] } = useGetSemestersQuery(id);
  const { data: customFields = [] } = useGetFeeCustomFieldsQuery();
  const [generateSemesters] = useGenerateSemestersMutation();
  const [extendSemesters] = useExtendSemestersMutation();
  const [addFee] = useAddFeeMutation();
  const [updateFee] = useUpdateFeeMutation();
  const [updateStatus] = useUpdateFeeStatusMutation();
  const [createCustomField] = useCreateFeeCustomFieldMutation();
  const [updateStudent] = useUpdateStudentMutation();

  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [startType, setStartType] = useState("Fall");
  const [admissionAutoFilled, setAdmissionAutoFilled] = useState(false);
  const [durationAutoApplied, setDurationAutoApplied] = useState(false);
  const [feeForm, setFeeForm] = useState({
    semesterId: "",
    feeType: "tuition",
    amount: "",
    installmentNumber: 1,
  });
  const [newColumnName, setNewColumnName] = useState("");

  const canAddFee = ["Manager", "AccountsManager"].includes(user?.role);
  const canEditCells = ["Manager", "AccountsManager"].includes(user?.role);
  const canUpdateStatus = [
    "Manager",
    "AccountsManager",
    "StudentAffair",
  ].includes(user?.role);

  // Pulled straight from the student's own record — "Adm Session" (e.g. "Fall
  // 2025") and a duration-ish field, both captured verbatim at Admission Excel
  // import time and stored under customFields.
  const admSessionRaw = findCustomFieldValue(student?.customFields, (k) =>
    /^adm(ission)?session$/.test(k),
  );
  const degreeYearsRaw = findCustomFieldValue(
    student?.customFields,
    (k) =>
      /^degreeyears?$/.test(k) ||
      /^programyears?$/.test(k) ||
      /^programduration(years)?$/.test(k),
  );
  const parsedAdmSession = useMemo(
    () => parseSessionLabel(admSessionRaw),
    [admSessionRaw],
  );
  const parsedDegreeYears = useMemo(
    () => parseDegreeYears(degreeYearsRaw),
    [degreeYearsRaw],
  );

  // Prefill "Starting Semester Year" + type from the student's real Adm Session —
  // only once, and only before any semesters exist, so it never fights a value the
  // Manager has already typed or generated.
  useEffect(() => {
    if (admissionAutoFilled || !parsedAdmSession || semesters.length > 0)
      return;
    setStartYear(parsedAdmSession.year);
    setStartType(parsedAdmSession.type);
    setAdmissionAutoFilled(true);
  }, [admissionAutoFilled, parsedAdmSession, semesters.length]);

  // Auto-set Program Duration from the Excel's own duration column when the
  // student doesn't already have one — the Manager can still override it any time
  // from the Fee Detail list.
  useEffect(() => {
    if (
      durationAutoApplied ||
      !student ||
      student.programDurationYears ||
      !parsedDegreeYears
    )
      return;
    setDurationAutoApplied(true);
    updateStudent({ id: student.id, programDurationYears: parsedDegreeYears })
      .unwrap()
      .then(() =>
        toast.success(
          `Program duration Excel se auto-set: ${parsedDegreeYears} years`,
        ),
      )
      .catch(() => {});
  }, [durationAutoApplied, student, parsedDegreeYears, updateStudent]);

  const programYears =
    student?.programDurationYears ||
    (student?.semesterSystem === "4-year" ? 4 : 5);
  const programSemesters = programYears * 2;

  // --- Compute overall totals from feeData ---
  const overallStats = useMemo(() => {
    if (!feeData?.semesters)
      return { total: 0, paid: 0, remaining: 0, fine: 0 };
    let total = 0;
    let paid = 0;
    feeData.semesters.forEach((bucket) => {
      bucket.fees.forEach((f) => {
        total += Number(f.amount) || 0;
        paid += Number(f.paidAmount) || 0;
      });
    });
    return {
      total,
      paid,
      remaining: total - paid,
      fine: feeData.grandFineTotal ?? 0,
    };
  }, [feeData]);

  const handleGenerate = async () => {
    if (!student?.semesterSystem && !student?.programDurationYears) {
      toast.error(
        "Pehle student ki Program Duration set karein — Fee Detail list se, ya Excel mein Degree Years ka column ho to khud-b-khud set ho jayegi",
      );
      return;
    }
    try {
      await generateSemesters({
        studentId: id,
        startYear: Number(startYear),
        startType,
      }).unwrap();
      toast.success(
        `${programSemesters} semesters generated, starting ${startType} ${startYear}`,
      );
    } catch {
      toast.error("Failed to generate semesters");
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    if (!feeForm.semesterId) return toast.error("Select a semester first");
    try {
      await addFee({
        studentId: id,
        ...feeForm,
        amount: Number(feeForm.amount),
        installmentNumber: Number(feeForm.installmentNumber),
      }).unwrap();
      toast.success("Fee added");
      setFeeForm({
        semesterId: "",
        feeType: "tuition",
        amount: "",
        installmentNumber: 1,
      });
    } catch {
      toast.error("Failed to add fee");
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      await createCustomField({
        name: newColumnName,
        dataType: "text",
      }).unwrap();
      toast.success(`Column "${newColumnName}" added`);
      setNewColumnName("");
    } catch {
      toast.error("Failed to add column");
    }
  };

  const handleSaveField = async (feeId, field, value) => {
    try {
      await updateFee({ id: feeId, [field]: value }).unwrap();
      toast.success("Updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const handleSaveCustomValue = async (feeId, fieldName, value) => {
    try {
      await updateFee({
        id: feeId,
        customValues: { [fieldName]: value },
      }).unwrap();
      toast.success("Updated");
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">{student?.name}</h1>
        <p className="text-sm text-gray-500">
          Enrollment #: {student?.enrollmentNumber} · {student?.program}
        </p>
      </div>

      {feeData && (
        <div className="card flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-gray-400">Grand Total (all semesters)</p>
            <p className="text-lg font-bold text-primary-700">
              Rs {overallStats.total.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Paid</p>
            <p className="text-lg font-bold text-green-700">
              Rs {overallStats.paid.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Remaining</p>
            <p className="text-lg font-bold text-red-700">
              Rs {overallStats.remaining.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">
              Grand Total Fine (Fall + Spring)
            </p>
            <p className="text-lg font-bold text-amber-700">
              Rs {overallStats.fine.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="text-sm text-gray-600">
            Starting Semester Type
          </label>
          <select
            className="input mt-1 w-32"
            value={startType}
            onChange={(e) => setStartType(e.target.value)}
          >
            <option value="Fall">Fall</option>
            <option value="Spring">Spring</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">
            Starting Semester Year
          </label>
          <input
            type="number"
            className="input mt-1 w-40"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={handleGenerate}>
          {semesters.length > 0 ? "Generate / Fill Semester Roadmap" : "Generate Semesters"}{" "}
          {student?.semesterSystem || student?.programDurationYears
            ? `(${programYears}-year, ${programSemesters} semesters)`
            : "(set program duration first)"}
        </button>
        {parsedAdmSession && (
          <p className="text-xs text-gray-400 w-full">
            Excel ki Adm Session ("{admSessionRaw}") se{" "}
            {parsedAdmSession.type} {parsedAdmSession.year} auto-fill hui hai
            — chahe to badal sakte ho.
          </p>
        )}
        {semesters.length > 0 && (
          <p className="text-xs text-gray-400 w-full">
            Student jis semester/year se shuru hua tha wo select karke
            Generate dabao — poora {programSemesters}-semester roadmap ban
            jayega. Jo semester already maujood hai (jaise abhi ka imported
            fee record) uska data safe rahega, sirf uski position/naya label
            match hone par reuse hoga.
          </p>
        )}
      </div>

      {canAddFee && semesters.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Add Fee Entry</h2>
          <form
            onSubmit={handleAddFee}
            className="flex flex-wrap gap-2 items-end"
          >
            <div>
              <label className="text-xs text-gray-500">Semester</label>
              <select
                className="input mt-1"
                value={feeForm.semesterId}
                onChange={(e) =>
                  setFeeForm({ ...feeForm, semesterId: e.target.value })
                }
              >
                <option value="">Select…</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Fee Type</label>
              <select
                className="input mt-1"
                value={feeForm.feeType}
                onChange={(e) =>
                  setFeeForm({ ...feeForm, feeType: e.target.value })
                }
              >
                <option value="tuition">Tuition</option>
                <option value="registration">Registration</option>
                <option value="capstone">Capstone Project Fee</option>
                <option value="custom">Custom Fee</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Amount</label>
              <input
                required
                type="number"
                className="input mt-1 w-32"
                value={feeForm.amount}
                onChange={(e) =>
                  setFeeForm({ ...feeForm, amount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Installment #</label>
              <select
                className="input mt-1"
                value={feeForm.installmentNumber}
                onChange={(e) =>
                  setFeeForm({ ...feeForm, installmentNumber: e.target.value })
                }
              >
                <option value={1}>1 (Full / 1st installment)</option>
                <option value={2}>2nd installment</option>
                <option value={3}>3rd installment</option>
                <option value={4}>4th installment</option>
              </select>
            </div>
            <button className="btn-primary">Add Fee</button>
          </form>

          <div className="mt-4 flex items-center gap-2">
            <input
              className="input max-w-xs"
              placeholder="New custom fee column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
            <button
              className="btn-secondary"
              onClick={handleAddColumn}
              type="button"
            >
              + Add Column
            </button>
          </div>
        </div>
      )}

      {canEditCells && semesters.length > 0 && (
        <p className="text-xs text-gray-400">
          Tip: table ke kisi bhi cell par click karke edit kar sakte ho — Enter
          se save, Esc se cancel.
        </p>
      )}

      {isLoading && (
        <p className="text-gray-400 text-sm">Loading fee detail…</p>
      )}

      {feeData && (
        <div className="space-y-4">
          {feeData.semesters.map((bucket) => {
            // Compute per-semester stats
            let semPaid = 0;
            let semTotal = 0;
            bucket.fees.forEach((f) => {
              semTotal += Number(f.amount) || 0;
              semPaid += Number(f.paidAmount) || 0;
            });
            const semRemaining = semTotal - semPaid;

            return (
              <div key={bucket.semester.id} className="card overflow-x-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">
                    {bucket.semester.label}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({bucket.semester.type})
                    </span>
                  </h3>
                  <div className="flex gap-4 text-sm font-medium">
                    <span className="text-primary-700">
                      Total: Rs {semTotal.toLocaleString()}
                    </span>
                    <span className="text-green-700">
                      Paid: Rs {semPaid.toLocaleString()}
                    </span>
                    <span className="text-red-700">
                      Remaining: Rs {semRemaining.toLocaleString()}
                    </span>
                    <span className="text-amber-700">
                      Fine ({bucket.semester.type}): Rs{" "}
                      {(bucket.semesterFineTotal || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fee Type</th>
                      <th>Amount</th>
                      <th>Installment</th>
                      <th>Paid Status</th>
                      <th>Paid Amount</th>
                      <th>Due Date</th>
                      {customFields.map((cf) => (
                        <th key={cf.id}>{cf.name}</th>
                      ))}
                      {canUpdateStatus && <th>Status Tabs</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {bucket.fees.map((f) => {
                      const totalInstallmentsForType = bucket.fees.filter(
                        (x) => x.feeType === f.feeType,
                      ).length;
                      return (
                        <tr key={f.id}>
                          <td className="capitalize">{f.feeType}</td>
                          <EditableCell
                            value={Number(f.amount)}
                            type="number"
                            disabled={!canEditCells}
                            onSave={(v) =>
                              handleSaveField(f.id, "amount", Number(v))
                            }
                          />
                          <td>
                            {f.installmentNumber}/{totalInstallmentsForType}
                          </td>
                          <EditableCell
                            value={f.paidStatus}
                            options={PAID_STATUS_OPTIONS}
                            disabled={!canEditCells}
                            onSave={(v) =>
                              handleSaveField(f.id, "paidStatus", v)
                            }
                          />
                          <EditableCell
                            value={Number(f.paidAmount)}
                            type="number"
                            disabled={!canEditCells}
                            onSave={(v) =>
                              handleSaveField(f.id, "paidAmount", Number(v))
                            }
                          />
                          <EditableCell
                            value={
                              f.dueDate ? String(f.dueDate).slice(0, 10) : ""
                            }
                            type="date"
                            disabled={!canEditCells}
                            onSave={(v) => handleSaveField(f.id, "dueDate", v)}
                          />
                          {customFields.map((cf) => (
                            <EditableCell
                              key={cf.id}
                              value={f.customValues?.[cf.name]}
                              disabled={!canEditCells}
                              onSave={(v) =>
                                handleSaveCustomValue(f.id, cf.name, v)
                              }
                            />
                          ))}
                          {canUpdateStatus && (
                            <td>
                              <div className="flex flex-wrap gap-1">
                                {STATUS_TABS.map((t) => (
                                  <button
                                    key={t.key}
                                    onClick={() =>
                                      updateStatus({
                                        id: f.id,
                                        [t.key]: !f[t.key],
                                      })
                                    }
                                    className={`text-xs px-2 py-1 rounded-full border ${
                                      f[t.key]
                                        ? "bg-primary-600 text-white border-primary-600"
                                        : "border-gray-200 text-gray-500"
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {bucket.fees.length === 0 && (
                      <tr>
                        <td
                          colSpan={10 + customFields.length}
                          className="text-center text-gray-400 py-3"
                        >
                          No fee entries yet for this semester
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Overall Summary */}
          <div className="card flex flex-wrap items-center justify-between gap-4 bg-primary-50">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Grand Total</span>
              <span className="text-xl font-bold text-primary-700">
                Rs {overallStats.total.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Total Paid</span>
              <span className="text-xl font-bold text-green-700">
                Rs {overallStats.paid.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Remaining Balance</span>
              <span className="text-xl font-bold text-red-700">
                Rs {overallStats.remaining.toLocaleString()}
              </span>
            </div>
          </div>

          {semesters.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => extendSemesters(id)}
            >
              Extend Semester Window (+{programYears} years / +
              {programSemesters} semesters)
            </button>
          )}
        </div>
      )}
    </div>
  );
}