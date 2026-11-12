import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useGetScholarshipSessionsQuery,
  useGetScholarshipQuery,
  useSaveScholarshipAwardMutation,
  useSaveScholarshipAwardBulkMutation,
  useSaveScholarshipCgpaMutation,
  useImportScholarshipCgpaMutation,
  useImportScholarshipAwardsMutation,
  usePostScholarshipDropMutation,
  useReverseScholarshipPostMutation,
} from "../app/api";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";

const FEE_COLUMN_KEY = "scholarship.feeColumn";

const STATUS_META = {
  Dropped: { label: "DROPPED", cls: "bg-red-600 text-white" },
  Eligible: { label: "Eligible", cls: "bg-green-100 text-green-800" },
  Pending: { label: "Pending CGPA", cls: "bg-amber-100 text-amber-800" },
  NoScholarship: { label: "No Scholarship", cls: "bg-gray-100 text-gray-600" },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "Dropped", label: "Dropped" },
  { key: "Eligible", label: "Eligible" },
  { key: "Pending", label: "Pending CGPA" },
  { key: "NoScholarship", label: "No Scholarship" },
];

const money = (n) =>
  n === null || n === undefined ? "—" : Number(n).toLocaleString();

const errMsg = (err, fallback) => {
  const m = err?.data?.message;
  return (typeof m === "string" ? m : m?.message) || fallback;
};

// Table ke andar seedha likhne wala cell. Blur ya Enter par save hota hai.
function EditableCell({ value, onSave, disabled, suffix, width = "w-20" }) {
  const shown = value === null || value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);

  if (disabled) {
    return (
      <span>
        {shown === "" ? "—" : shown}
        {shown !== "" && suffix}
      </span>
    );
  }
  const commit = () => {
    if (draft.trim() !== shown) onSave(draft.trim());
  };
  return (
    <span className="inline-flex items-center gap-1">
      <input
        className={`input ${width} px-2 py-1`}
        value={draft}
        placeholder="—"
        inputMode="decimal"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
      {suffix}
    </span>
  );
}

export default function DropOfScholarship() {
  const user = useSelector((state) => state.auth.user);
  const canEdit = ["Manager", "AccountsManager"].includes(user?.role);

  const { data: sessions = [] } = useGetScholarshipSessionsQuery();
  const [session, setSession] = useState("");
  const [feeColumn, setFeeColumn] = useState(
    () => localStorage.getItem(FEE_COLUMN_KEY) || "",
  );

  // Pehla (sab se naya) session khud chun lo
  useEffect(() => {
    if (!session && sessions.length) setSession(sessions[0]);
  }, [sessions, session]);

  const { data, isFetching } = useGetScholarshipQuery(
    { session, feeColumn },
    { skip: !session },
  );
  const rows = data?.rows || [];
  const summary = data?.summary;

  const [saveAward] = useSaveScholarshipAwardMutation();
  const [saveAwardBulk] = useSaveScholarshipAwardBulkMutation();
  const [saveCgpa] = useSaveScholarshipCgpaMutation();
  const [importCgpa, { isLoading: importingCgpa }] =
    useImportScholarshipCgpaMutation();
  const [importAwards, { isLoading: importingAwards }] =
    useImportScholarshipAwardsMutation();
  const [postDrop, { isLoading: posting }] = usePostScholarshipDropMutation();
  const [reversePost] = useReverseScholarshipPostMutation();

  // ---- filters ----
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [section, setSection] = useState("");
  const [awardFilter, setAwardFilter] = useState("all"); // all | has | none
  const [maintFilter, setMaintFilter] = useState("all"); // all | has | none
  const [cgpaFilter, setCgpaFilter] = useState("all"); // all | has | none
  const [postedFilter, setPostedFilter] = useState("all"); // all | posted | notPosted

  const programs = useMemo(
    () => [...new Set(rows.map((r) => r.program).filter(Boolean))].sort(),
    [rows],
  );
  const sectionsList = useMemo(
    () => [...new Set(rows.map((r) => r.section).filter(Boolean))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (q && !`${r.enrollmentNumber} ${r.name}`.toLowerCase().includes(q))
        return false;
      if (program && r.program !== program) return false;
      if (section && r.section !== section) return false;
      if (awardFilter === "has" && !(r.percent > 0)) return false;
      if (awardFilter === "none" && r.percent > 0) return false;
      if (maintFilter === "has" && r.maintainedCgpa === null) return false;
      if (maintFilter === "none" && r.maintainedCgpa !== null) return false;
      if (cgpaFilter === "has" && r.currentCgpa === null) return false;
      if (cgpaFilter === "none" && r.currentCgpa !== null) return false;
      if (postedFilter === "posted" && !(r.postedAmount > 0)) return false;
      if (postedFilter === "notPosted" && r.postedAmount > 0) return false;
      return true;
    });
  }, [
    rows,
    tab,
    search,
    program,
    section,
    awardFilter,
    maintFilter,
    cgpaFilter,
    postedFilter,
  ]);

  const { page, setPage, totalPages, totalItems, pageSize, paginatedItems } =
    usePagination(filtered, 25);

  // ---- selection ----
  const [selected, setSelected] = useState(new Set());
  useEffect(() => setSelected(new Set()), [session]);
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.studentId));
  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(
      allFilteredSelected
        ? new Set()
        : new Set(filtered.map((r) => r.studentId)),
    );

  const selectedRows = rows.filter((r) => selected.has(r.studentId));
  const postableSelected = selectedRows.filter(
    (r) => r.status === "Dropped" && r.postedAmount === 0 && r.dropAmount > 0,
  );

  const [bulkPercent, setBulkPercent] = useState("");
  const [bulkMaintained, setBulkMaintained] = useState("");

  // ---- handlers ----
  const handleAwardField = async (row, field, value) => {
    try {
      await saveAward({ studentId: row.studentId, [field]: value }).unwrap();
    } catch (err) {
      toast.error(errMsg(err, "Save failed"));
    }
  };

  const handleCgpa = async (row, value) => {
    try {
      await saveCgpa({
        studentId: row.studentId,
        semesterId: row.semesterId,
        cgpa: value,
      }).unwrap();
    } catch (err) {
      toast.error(errMsg(err, "Save failed"));
    }
  };

  const handleBulkApply = async () => {
    if (bulkPercent === "" && bulkMaintained === "") {
      toast.error("Scholarship % ya Maintained CGPA likho");
      return;
    }
    const body = { studentIds: [...selected] };
    if (bulkPercent !== "") body.percent = bulkPercent;
    if (bulkMaintained !== "") body.maintainedCgpa = bulkMaintained;
    try {
      const res = await saveAwardBulk(body).unwrap();
      toast.success(`${res.updated} students updated`);
      setBulkPercent("");
      setBulkMaintained("");
    } catch (err) {
      toast.error(errMsg(err, "Bulk update failed"));
    }
  };

  const runPost = async (list) => {
    if (!list.length) return;
    const total = list.reduce((s, r) => s + r.dropAmount, 0);
    if (
      !window.confirm(
        `${list.length} student(s) ka "Drop of scholarship" Fee page mein post hoga.\nKul rakam: Rs ${money(total)}\n\nJari rakhein?`,
      )
    )
      return;
    try {
      const res = await postDrop({
        session,
        feeColumn: data?.feeColumnUsed || undefined,
        studentIds: list.map((r) => r.studentId),
      }).unwrap();
      toast.success(`${res.postedCount} drop(s) Fee page mein post ho gaye`);
      if (res.skipped?.length) {
        toast.info(`${res.skipped.length} skip hue (${res.skipped[0].reason})`);
      }
      setSelected(new Set());
    } catch (err) {
      toast.error(errMsg(err, "Post failed"));
    }
  };

  const handleReverse = async (row) => {
    if (
      !window.confirm(
        `${row.name}: Rs ${money(row.postedAmount)} ka posted drop wapas hata dein?`,
      )
    )
      return;
    try {
      await reversePost({
        studentId: row.studentId,
        semesterId: row.semesterId,
      }).unwrap();
      toast.success("Posted drop reverse ho gaya");
    } catch (err) {
      toast.error(errMsg(err, "Reverse failed"));
    }
  };

  // ---- Excel import ----
  const cgpaFileRef = useRef(null);
  const awardFileRef = useRef(null);
  const [importResult, setImportResult] = useState(null);

  const handleImport = async (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      let res;
      if (kind === "cgpa") {
        if (session) formData.append("semesterLabel", session);
        res = await importCgpa(formData).unwrap();
        setImportResult({
          title: "CGPA import",
          summary: `${res.created} naye, ${res.updated} update, ${res.skippedCount} skip`,
          skipped: res.skipped,
        });
      } else {
        res = await importAwards(formData).unwrap();
        setImportResult({
          title: "Scholarship import",
          summary: `${res.updated} students update, ${res.skippedCount} skip`,
          skipped: res.skipped,
        });
      }
      toast.success("Import complete");
    } catch (err) {
      toast.error(errMsg(err, "Import failed"));
    }
  };

  // ---- CSV export (jo filter laga hai wahi nikalega) ----
  const exportCsv = () => {
    const head = [
      "Enrollment",
      "Name",
      "Session",
      "Semester",
      "Scholarship %",
      "Fee After Scholarship",
      "Fee After Drop",
      "Drop Amount",
      "Maintained CGPA",
      "Current CGPA",
      "Status",
      "Posted Amount",
    ];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = filtered.map((r) =>
      [
        r.enrollmentNumber,
        r.name,
        r.session,
        r.semesterNo,
        r.percent,
        r.feeAfterScholarship,
        r.feeAfterDrop,
        r.dropAmount,
        r.maintainedCgpa,
        r.currentCgpa,
        STATUS_META[r.status].label,
        r.postedAmount,
      ]
        .map(esc)
        .join(","),
    );
    const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drop-of-scholarship-${session.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFeeColumnChange = (value) => {
    setFeeColumn(value);
    try {
      localStorage.setItem(FEE_COLUMN_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const counts = {
    all: summary?.total || 0,
    Dropped: summary?.Dropped || 0,
    Eligible: summary?.Eligible || 0,
    Pending: summary?.Pending || 0,
    NoScholarship: summary?.NoScholarship || 0,
  };

  return (
    <div className="space-y-4">
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Drop of Scholarship</h1>
          <p className="text-sm text-gray-500">
            Fee aur CGPA ki base par scholarship drop ki session-wise list.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Session</label>
            <select
              className="input"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              {sessions.length === 0 && (
                <option value="">No fee data yet</option>
              )}
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Fee column (Fee tab se)
            </label>
            <select
              className="input"
              value={data?.feeColumnUsed || ""}
              onChange={(e) => onFeeColumnChange(e.target.value)}
            >
              {!data?.feeColumnUsed && <option value="">Fee amount</option>}
              {(data?.feeColumns || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {canEdit && (
            <>
              <button
                className="btn-secondary"
                disabled={importingCgpa || !session}
                onClick={() => cgpaFileRef.current?.click()}
              >
                {importingCgpa ? "Importing…" : "Import CGPA Excel"}
              </button>
              <button
                className="btn-secondary"
                disabled={importingAwards}
                onClick={() => awardFileRef.current?.click()}
              >
                {importingAwards ? "Importing…" : "Import Scholarship Excel"}
              </button>
            </>
          )}
          <button
            className="btn-secondary"
            onClick={exportCsv}
            disabled={!filtered.length}
          >
            Download CSV
          </button>
          <input
            ref={cgpaFileRef}
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={(e) => handleImport(e, "cgpa")}
          />
          <input
            ref={awardFileRef}
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={(e) => handleImport(e, "award")}
          />
        </div>
      </div>

      {data && !data.feeColumnUsed && (
        <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
          Fee ka koi column nahi mila (FEE / Total Fee / Grand Total). Abhi Fee
          ka total amount use ho raha hai. Upar "Fee column" se sahi column chun
          lein.
        </div>
      )}

      {importResult && (
        <div className="card text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">
              {importResult.title}: {importResult.summary}
            </p>
            <button
              className="text-xs text-gray-500 underline"
              onClick={() => setImportResult(null)}
            >
              Close
            </button>
          </div>
          {importResult.skipped?.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-auto text-xs text-gray-600 space-y-0.5">
              {importResult.skipped.slice(0, 50).map((s, i) => (
                <li key={i}>
                  Row {s.row} — {s.enrollment}: {s.reason}
                </li>
              ))}
              {importResult.skipped.length > 50 && (
                <li>… aur {importResult.skipped.length - 50} rows</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* ---------- Summary / tabs ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`card text-left transition ${
              tab === t.key ? "ring-2 ring-primary-500" : ""
            } ${t.key === "Dropped" && counts.Dropped > 0 ? "border-red-300 bg-red-50" : ""}`}
          >
            <p
              className={`text-xs ${t.key === "Dropped" ? "text-red-700" : "text-gray-500"}`}
            >
              {t.label}
            </p>
            <p
              className={`text-2xl font-semibold ${t.key === "Dropped" ? "text-red-700" : ""}`}
            >
              {counts[t.key]}
            </p>
          </button>
        ))}
      </div>
      {summary && summary.Dropped > 0 && (
        <p className="text-sm text-gray-600">
          Drop ka kul farq:{" "}
          <b className="text-red-700">Rs {money(summary.totalDropAmount)}</b>
          {" — "}Fee page mein post ho chuka:{" "}
          <b>Rs {money(summary.totalPosted)}</b>
        </p>
      )}

      {/* ---------- Filters ---------- */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <input
            className="input col-span-2"
            placeholder="Search enrollment ya name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          >
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            <option value="">All sections</option>
            {sectionsList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={awardFilter}
            onChange={(e) => setAwardFilter(e.target.value)}
          >
            <option value="all">Scholarship: sab</option>
            <option value="has">Scholarship hai</option>
            <option value="none">Scholarship nahi / data baqi</option>
          </select>
          <select
            className="input"
            value={maintFilter}
            onChange={(e) => setMaintFilter(e.target.value)}
          >
            <option value="all">Maintained CGPA: sab</option>
            <option value="has">Maintained CGPA likha hai</option>
            <option value="none">Maintained CGPA nahi likha</option>
          </select>
          <select
            className="input"
            value={cgpaFilter}
            onChange={(e) => setCgpaFilter(e.target.value)}
          >
            <option value="all">Current CGPA: sab</option>
            <option value="has">Current CGPA hai</option>
            <option value="none">Current CGPA nahi aya</option>
          </select>
          <select
            className="input"
            value={postedFilter}
            onChange={(e) => setPostedFilter(e.target.value)}
          >
            <option value="all">Fee mein post: sab</option>
            <option value="posted">Post ho chuka</option>
            <option value="notPosted">Post nahi hua</option>
          </select>
        </div>
      </div>

      {/* ---------- Bulk bar ---------- */}
      {canEdit && selected.size > 0 && (
        <div className="card flex flex-wrap items-end gap-3 border-primary-200 bg-primary-50">
          <p className="text-sm font-medium">{selected.size} selected</p>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Scholarship %
            </label>
            <input
              className="input w-24"
              value={bulkPercent}
              onChange={(e) => setBulkPercent(e.target.value)}
              placeholder="20"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Maintained CGPA
            </label>
            <input
              className="input w-24"
              value={bulkMaintained}
              onChange={(e) => setBulkMaintained(e.target.value)}
              placeholder="3.0"
            />
          </div>
          <button className="btn-primary" onClick={handleBulkApply}>
            Apply to selected
          </button>
          <button
            className="btn-danger"
            disabled={posting || postableSelected.length === 0}
            onClick={() => runPost(postableSelected)}
          >
            Post {postableSelected.length} drop(s) to Fee
          </button>
          <button
            className="btn-secondary"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      {/* ---------- Table ---------- */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {canEdit && (
                <th>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    title="Filter wale sab select karein"
                  />
                </th>
              )}
              <th>Enrollment</th>
              <th>Name</th>
              <th>Session</th>
              <th>Sem</th>
              <th>Scholarship</th>
              <th>Fee (after scholarship)</th>
              <th>Fee after drop</th>
              <th>Maintained CGPA</th>
              <th>Current CGPA</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isFetching && rows.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center text-gray-500 py-8">
                  Loading…
                </td>
              </tr>
            )}
            {!isFetching && filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center text-gray-500 py-8">
                  Koi student nahi mila
                </td>
              </tr>
            )}
            {paginatedItems.map((r) => {
              const meta = STATUS_META[r.status];
              const dropped = r.status === "Dropped";
              return (
                <tr key={r.studentId} className={dropped ? "bg-red-50" : ""}>
                  {canEdit && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(r.studentId)}
                        onChange={() => toggleOne(r.studentId)}
                      />
                    </td>
                  )}
                  <td className="whitespace-nowrap font-medium">
                    {r.enrollmentNumber}
                  </td>
                  <td className="whitespace-nowrap">{r.name}</td>
                  <td className="whitespace-nowrap">{r.session}</td>
                  <td>{r.semesterNo ?? "—"}</td>
                  <td>
                    <EditableCell
                      value={r.percent > 0 ? r.percent : ""}
                      suffix="%"
                      width="w-16"
                      disabled={!canEdit}
                      onSave={(v) => handleAwardField(r, "percent", v)}
                    />
                  </td>
                  <td className="whitespace-nowrap">
                    {money(r.feeAfterScholarship)}
                  </td>
                  <td className="whitespace-nowrap">
                    {dropped ? (
                      <span className="font-semibold text-red-700">
                        {money(r.feeAfterDrop)}
                        <span className="block text-xs font-normal">
                          + {money(r.dropAmount)}
                        </span>
                      </span>
                    ) : (
                      money(r.feeAfterDrop)
                    )}
                  </td>
                  <td>
                    <EditableCell
                      value={r.maintainedCgpa}
                      disabled={!canEdit}
                      onSave={(v) => handleAwardField(r, "maintainedCgpa", v)}
                    />
                  </td>
                  <td>
                    <EditableCell
                      value={r.currentCgpa}
                      disabled={!canEdit}
                      onSave={(v) => handleCgpa(r, v)}
                    />
                    {r.cgpaSource === "fee" && (
                      <span
                        className="ml-1 text-[10px] text-gray-400"
                        title="Ye CGPA Fee Excel ke column se aya hai"
                      >
                        fee
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {dropped && r.postedAmount === 0 && canEdit && (
                        <button
                          className="btn-danger px-3 py-1 text-xs"
                          disabled={posting || !(r.dropAmount > 0)}
                          onClick={() => runPost([r])}
                        >
                          Post to Fee
                        </button>
                      )}
                      {dropped && r.postedAmount > 0 && (
                        <>
                          <span className="text-xs text-green-700 font-medium">
                            Posted ✓
                          </span>
                          {canEdit && (
                            <button
                              className="text-xs text-red-600 underline"
                              onClick={() => handleReverse(r)}
                            >
                              Reverse
                            </button>
                          )}
                        </>
                      )}
                      <Link
                        className="text-xs text-primary-700 underline"
                        to={`/students/${r.studentId}/fee`}
                      >
                        Fee
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
