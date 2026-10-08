import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useGetLeaveApplicationsQuery,
  useCreateLeaveApplicationMutation,
  useLazySearchLeaveStudentsQuery,
  getErrorMessage,
} from "../app/api";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";

export const LEAVE_STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const EMPTY_FORM = { title: "", fromDate: "", toDate: "", reason: "" };

const calcDays = (from, to) => {
  if (!from || !to) return 0;
  const diff = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24);
  return Math.floor(diff) + 1;
};

const StudentInfo = ({ s }) => (
  <div className="text-sm">
    <p>
      <b>Name:</b> {s.name}
      {s.fatherName ? ` (S/D of ${s.fatherName})` : ""}
    </p>
    <p>
      <b>Enrollment #:</b> {s.enrollmentNumber}
      {s.rollNo ? ` · Roll No: ${s.rollNo}` : ""}
    </p>
    <p>
      <b>Department:</b> {s.program || "—"}
    </p>
    <p>
      <b>Email:</b> {s.email || "—"}
    </p>
  </div>
);

export default function LeaveApplications() {
  const { data: leaves = [], isLoading } = useGetLeaveApplicationsQuery();
  const [createLeave, { isLoading: submitting }] =
    useCreateLeaveApplicationMutation();
  const [triggerSearch, { data: results = [], isFetching, isError, error }] =
    useLazySearchLeaveStudentsQuery();

  // Create flow
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // List filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSelectedStudent(null);
    setSearched(true);
    triggerSearch(query.trim());
  };

  const students = searched && !isError ? results : [];

  const resetCreate = () => {
    setQuery("");
    setSearched(false);
    setSelectedStudent(null);
    setForm(EMPTY_FORM);
  };

  const days = calcDays(form.fromDate, form.toDate);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return toast.error("Pehle student select karein");
    if (!form.title.trim()) return toast.error("Title likhein");
    if (!form.fromDate || !form.toDate)
      return toast.error("From aur To date select karein");
    if (days < 1)
      return toast.error("To date, From date se pehle nahi ho sakti");
    if (!form.reason.trim()) return toast.error("Reason likhein");

    try {
      await createLeave({
        studentId: selectedStudent.id,
        title: form.title.trim(),
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason.trim(),
      }).unwrap();
      toast.success("Leave application create ho gayi (Pending)");
      resetCreate();
    } catch (err) {
      toast.error(
        getErrorMessage(err?.data) || "Leave application create nahi ho saki",
      );
    }
  };

  const filtered = leaves.filter((l) => {
    if (statusFilter && l.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [l.enrollmentNumber, l.title, l.studentName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const { page, setPage, totalPages, totalItems, pageSize, paginatedItems } =
    usePagination(filtered, 10);

  const counts = {
    Pending: leaves.filter((l) => l.status === "Pending").length,
    Approved: leaves.filter((l) => l.status === "Approved").length,
    Rejected: leaves.filter((l) => l.status === "Rejected").length,
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Leave Applications</h1>

      {/* ---------- Create ---------- */}
      <div className="card max-w-xl">
        <h2 className="font-semibold mb-3">Step 1 — Find Student</h2>

        {!selectedStudent && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="input"
              placeholder="Enrollment Number / Roll Number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn-primary" disabled={isFetching}>
              {isFetching ? "Searching…" : "Search"}
            </button>
          </form>
        )}

        {!selectedStudent && searched && isError && !isFetching && (
          <p className="text-sm text-red-600 mt-2">
            {getErrorMessage(error?.data) ||
              "Search nahi ho saka, dobara koshish karein."}
          </p>
        )}

        {!selectedStudent &&
          searched &&
          !isError &&
          !isFetching &&
          students.length === 0 && (
            <p className="text-sm text-red-600 mt-2">
              Is enrollment / roll number se koi student database mein nahi mila
              — leave application nahi ban sakti.
            </p>
          )}

        {!selectedStudent && students.length > 0 && !isFetching && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-400">
              {students.length} student(s) mile — jis ki leave banani hai usko
              select karein:
            </p>
            {students.map((s) => (
              <div
                key={s.id}
                className="bg-primary-50 rounded-lg p-3 flex items-start justify-between gap-3"
              >
                <StudentInfo s={s} />
                <button
                  type="button"
                  className="btn-primary shrink-0"
                  onClick={() => setSelectedStudent(s)}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedStudent && (
          <div className="bg-primary-50 rounded-lg p-3 flex items-start justify-between gap-3">
            <StudentInfo s={selectedStudent} />
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={resetCreate}
            >
              Change
            </button>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="card max-w-xl">
          <h2 className="font-semibold mb-3">Step 2 — Leave Details</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Title</label>
              <input
                type="text"
                name="title"
                className="input"
                maxLength={150}
                placeholder="Jaise: Sick leave, Shadi, Hajj…"
                value={form.title}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-500">From</label>
                <input
                  type="date"
                  name="fromDate"
                  className="input"
                  value={form.fromDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">To</label>
                <input
                  type="date"
                  name="toDate"
                  className="input"
                  min={form.fromDate}
                  value={form.toDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            {days > 0 && (
              <p className="text-sm text-primary-700">
                Requested days: <b>{days}</b>
              </p>
            )}
            <div>
              <label className="text-sm text-gray-500">Reason</label>
              <textarea
                name="reason"
                rows={3}
                className="input"
                placeholder="Leave ki wajah likhein…"
                value={form.reason}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create Leave Application"}
            </button>
          </form>
        </div>
      )}

      {/* ---------- List ---------- */}
      <div className="grid grid-cols-3 gap-3 max-w-xl">
        {Object.entries(counts).map(([label, n]) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold">{n}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="input max-w-sm"
          placeholder="Search by enrollment no, title or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input max-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Enrollment No</th>
              <th>Title</th>
              <th>From</th>
              <th>To</th>
              <th>Requested Days</th>
              <th>Approved Days</th>
              <th>Status</th>
              <th>Applied On</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={10} className="text-center text-gray-400 py-6">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-gray-400 py-6">
                  No leave applications found
                </td>
              </tr>
            )}
            {paginatedItems.map((l) => (
              <tr key={l.id}>
                <td className="font-medium">{l.studentName}</td>
                <td>{l.enrollmentNumber}</td>
                <td>{l.title}</td>
                <td>{l.fromDate}</td>
                <td>{l.toDate}</td>
                <td>{l.days}</td>
                <td>
                  {l.status === "Approved" ? (
                    <span className="font-semibold text-green-700">
                      {l.approvedDays}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${LEAVE_STATUS_COLORS[l.status]}`}
                  >
                    {l.status}
                  </span>
                </td>
                <td>{l.appliedOn}</td>
                <td>
                  <Link
                    to={`/leave-applications/${l.id}`}
                    className="text-primary-600 text-sm hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
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
