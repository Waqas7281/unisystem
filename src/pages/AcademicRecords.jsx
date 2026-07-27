import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useGetStudentsQuery,
  useGetRecordRoomDashboardQuery,
  useGetLettersByStudentQuery,
  useCreateLetterMutation,
  useUpdateLetterMutation,
  useDeleteLetterMutation,
  useLazyGetStudentByEnrollmentQuery,
  useUpdateStudentMutation,
} from "../app/api";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";

const TABS = [
  { key: "NewAdmission", label: "New Admission" },
  { key: "Study", label: "Study (Continuing)" },
  { key: "Letters", label: "Letters" },
];

function LettersPanel({ tab, program }) {
  const [enrollment, setEnrollment] = useState("");
  const [
    fetchByEnrollment,
    { data: exactStudent, isFetching: verifying, isError: notFound },
  ] = useLazyGetStudentByEnrollmentQuery();
  const letterCategory =
    tab === "NewAdmission"
      ? "NewAdmission"
      : tab === "Study"
        ? "Continuing"
        : undefined;

  const [nameSearch, setNameSearch] = useState("");
  const { data: nameResults = [], isLoading: searchingByName } =
    useGetStudentsQuery(
      nameSearch
        ? {
            search: nameSearch,
            category: letterCategory,
            program: program || undefined,
          }
        : undefined,
      {
        skip: !nameSearch,
      },
    );
  const [manualPick, setManualPick] = useState(null);

  const handleVerify = (e) => {
    e.preventDefault();
    setManualPick(null);
    if (!enrollment.trim()) return toast.error("Enrollment number likhein");
    fetchByEnrollment(enrollment.trim());
  };

  // Data accuracy: sirf woh student select ho sakta hai jo actual DB record hai —
  // enrollment number ka exact match ya name-search list se pick.
  const selectedStudent =
    manualPick || (exactStudent && !notFound ? exactStudent : null);

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <p className="text-sm text-gray-500">
          Data accuracy ke liye letter sirf us student ke liye add hota hai jo
          database mein maujood ho. Pehle student ka <b>Enrollment Number</b> se
          verify karein — ya neeche naam se search karke list mein se select
          karein.
        </p>
        <form
          onSubmit={handleVerify}
          className="flex flex-wrap gap-2 items-end"
        >
          <div>
            <label className="text-xs text-gray-500">Enrollment Number</label>
            <input
              className="input mt-1 w-56"
              placeholder="e.g. 2026-CS-101"
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value)}
            />
          </div>
          <button className="btn-primary" disabled={verifying}>
            {verifying ? "Verifying…" : "Verify Student"}
          </button>
        </form>
        {notFound && !verifying && enrollment && (
          <p className="text-sm text-red-600">
            Is enrollment number ka koi student database mein nahi mila —
            enrollment number dobara check karein.
          </p>
        )}
        {exactStudent && !notFound && (
          <p className="text-sm text-green-700">
            ✓ Student database mein mil gaya: <b>{exactStudent.name}</b> (
            {exactStudent.enrollmentNumber})
          </p>
        )}

        <div className="pt-2 border-t">
          <label className="text-xs text-gray-500">
            Ya naam / registration ID / CNIC / roll no se search karein
          </label>
          <input
            className="input mt-1 max-w-md"
            placeholder="Search by name, registration ID, CNIC, roll no…"
            value={nameSearch}
            onChange={(e) => {
              setNameSearch(e.target.value);
              setManualPick(null);
            }}
          />
          {nameSearch && (
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto mt-2">
              {searchingByName && (
                <p className="p-3 text-sm text-gray-400">Searching…</p>
              )}
              {!searchingByName && nameResults.length === 0 && (
                <p className="p-3 text-sm text-gray-400">
                  Koi student database mein nahi mila
                </p>
              )}
              {nameResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`w-full text-left p-3 text-sm hover:bg-gray-50 ${
                    manualPick?.id === s.id ? "bg-primary-50" : ""
                  }`}
                  onClick={() => setManualPick(s)}
                >
                  <span className="font-medium">{s.name}</span>{" "}
                  <span className="text-gray-400">
                    — {s.enrollmentNumber}{" "}
                    {s.registrationId ? `· Reg# ${s.registrationId}` : ""}{" "}
                    {s.cnic ? `· CNIC ${s.cnic}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedStudent && <StudentLetters student={selectedStudent} />}
    </div>
  );
}

function StudentLetters({ student }) {
  const {
    data: letters = [],
    isLoading,
    refetch,
  } = useGetLettersByStudentQuery(student.id);
  const [createLetter, { isLoading: creating }] = useCreateLetterMutation();
  const [updateLetter] = useUpdateLetterMutation();
  const [deleteLetter] = useDeleteLetterMutation();
  const [form, setForm] = useState({ title: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Letter ka title likhein");
    try {
      await createLetter({ studentId: student.id, ...form }).unwrap();
      toast.success("Letter record save ho gaya");
      setForm({ title: "", description: "" });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save letter");
    }
  };

  const startEdit = (l) => {
    setEditingId(l.id);
    setEditForm({ title: l.title, description: l.description || "" });
  };

  const handleUpdate = async (id) => {
    try {
      await updateLetter({ id, ...editForm }).unwrap();
      toast.success("Letter updated");
      setEditingId(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update letter");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Ye letter record delete karna hai?")) return;
    try {
      await deleteLetter(id).unwrap();
      toast.success("Letter deleted");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete letter");
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold">{student.name}</h2>
          <p className="text-xs text-gray-500">
            Enrollment: {student.enrollmentNumber}{" "}
            {student.registrationId ? `· Reg# ${student.registrationId}` : ""}
          </p>
        </div>
        <Link
          to={`/academic-records/${student.id}`}
          className="text-primary-600 text-sm hover:underline"
        >
          Full Detail →
        </Link>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-gray-500">Letter Title</label>
          <input
            className="input mt-1 w-56"
            placeholder="e.g. Character Certificate"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Description</label>
          <input
            className="input mt-1 w-72"
            placeholder="Detail / reason (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <button className="btn-primary" disabled={creating}>
          {creating ? "Saving…" : "+ Add Letter"}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Date</th>
              <th>Issued By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-6">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && letters.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-6">
                  Is student ne abhi tak koi letter nahi liya
                </td>
              </tr>
            )}
            {letters.map((l) =>
              editingId === l.id ? (
                <tr key={l.id}>
                  <td>
                    <input
                      className="input py-1"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input py-1"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>{new Date(l.issuedDate).toLocaleDateString()}</td>
                  <td>{l.issuedBy?.name || "—"}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button
                      className="text-green-600 text-sm hover:underline"
                      onClick={() => handleUpdate(l.id)}
                    >
                      Save
                    </button>
                    <button
                      className="text-gray-500 text-sm hover:underline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={l.id}>
                  <td className="font-medium">{l.title}</td>
                  <td>{l.description || "—"}</td>
                  <td>{new Date(l.issuedDate).toLocaleDateString()}</td>
                  <td>{l.issuedBy?.name || "—"}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button
                      className="text-primary-600 text-sm hover:underline"
                      onClick={() => startEdit(l)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 text-sm hover:underline"
                      onClick={() => handleDelete(l.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentQuickEditRow({ student, colSpan, onClose }) {
  const [updateStudent, { isLoading: saving }] = useUpdateStudentMutation();
  const [form, setForm] = useState({
    registrationId: student.registrationId || "",
    cnic: student.cnic || "",
    rollNo: student.rollNo || "",
    fatherName: student.fatherName || "",
    program: student.program || "",
    matricBoard: student.matricBoard || "",
    matricRollNo: student.matricRollNo || "",
    matricYear: student.matricYear || "",
    interBoard: student.interBoard || "",
    interRollNo: student.interRollNo || "",
    interYear: student.interYear || "",
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateStudent({
        id: student.id,
        ...form,
        matricYear: form.matricYear ? Number(form.matricYear) : undefined,
        interYear: form.interYear ? Number(form.interYear) : undefined,
      }).unwrap();
      toast.success("Student ka record update ho gaya");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update student");
    }
  };

  return (
    <tr>
      <td colSpan={colSpan} className="bg-gray-50">
        <form onSubmit={handleSave} className="p-3 space-y-3">
          <p className="text-xs text-gray-500">
            <b>{student.name}</b> ({student.enrollmentNumber}) ki missing ya
            galat details yahin se update karein — save karte hi list mein
            turant reflect ho jayega.
          </p>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Identity</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                className="input"
                placeholder="Registration ID"
                value={form.registrationId}
                onChange={set("registrationId")}
              />
              <input
                className="input"
                placeholder="CNIC / B-Form"
                value={form.cnic}
                onChange={set("cnic")}
              />
              <input
                className="input"
                placeholder="Roll No"
                value={form.rollNo}
                onChange={set("rollNo")}
              />
              <input
                className="input"
                placeholder="Father Name"
                value={form.fatherName}
                onChange={set("fatherName")}
              />
              <input
                className="input"
                placeholder="Program"
                value={form.program}
                onChange={set("program")}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">
              Matric Detail
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-md">
              <input
                className="input"
                placeholder="Board"
                value={form.matricBoard}
                onChange={set("matricBoard")}
              />
              <input
                className="input"
                placeholder="Roll No"
                value={form.matricRollNo}
                onChange={set("matricRollNo")}
              />
              <input
                type="number"
                className="input"
                placeholder="Year"
                value={form.matricYear}
                onChange={set("matricYear")}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">
              Intermediate Detail
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-md">
              <input
                className="input"
                placeholder="Board"
                value={form.interBoard}
                onChange={set("interBoard")}
              />
              <input
                className="input"
                placeholder="Roll No"
                value={form.interRollNo}
                onChange={set("interRollNo")}
              />
              <input
                type="number"
                className="input"
                placeholder="Year"
                value={form.interYear}
                onChange={set("interYear")}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

export default function AcademicRecords() {
  const [tab, setTab] = useState("NewAdmission");
  const [search, setSearch] = useState("");
  const [missingMatric, setMissingMatric] = useState(false);
  const [missingInter, setMissingInter] = useState(false);
  const [program, setProgram] = useState("");
  const [editingStudentId, setEditingStudentId] = useState(null);

  const { data: summary } = useGetRecordRoomDashboardQuery();

  const filters = {
    search,
    program,
    // Backend enum literals:
    // StudentCategory.NEW_ADMISSION = 'NewAdmission'
    // StudentCategory.CONTINUING = 'Continuing'
    category:
      tab === "NewAdmission"
        ? "NewAdmission"
        : tab === "Study"
          ? "Continuing"
          : undefined,
    missingMatric,
    missingInter,
  };
  const { data: students = [], isLoading } = useGetStudentsQuery(filters, {
    skip: tab === "Letters",
  });

  const { page, setPage, totalPages, totalItems, pageSize, paginatedItems: paginatedStudents } =
    usePagination(students, 10);

  const cards = [
    { label: "Total Students", value: summary?.totalStudents ?? "—" },
    { label: "New Admissions", value: summary?.newAdmissions ?? "—" },
    { label: "Continuing (Study)", value: summary?.continuing ?? "—" },
    {
      label: "Missing Matric Result",
      value: summary?.missingMatricResult ?? "—",
      color: "text-amber-600",
    },
    {
      label: "Missing Inter Result",
      value: summary?.missingInterResult ?? "—",
      color: "text-amber-600",
    },
    {
      label: "Missing Degree Session",
      value: summary?.missingDegreeSession ?? "—",
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Academic Records — Record Room</h1>
        <p className="text-gray-500 text-sm">
          "New Admission" tab mein Admission Center ke register kiye students
          milte hain jinka record complete karna hai. "Study" tab mein pehle se
          enrolled students hain jinka matric/inter result ya degree session
          update karna hai. "Letters" tab mein kisi bhi student ko diye gaye
          letters ka record milta hai.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color || ""}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setTab(t.key);
              setEditingStudentId(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "Letters" ? (
        <LettersPanel tab={tab} program={program} />
      ) : (
        <>
          <div className="card space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                className="input max-w-xs"
                placeholder="Search enrollment #, reg ID, CNIC, name, roll no, father name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <input
                className="input max-w-[160px]"
                placeholder="Filter by Program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              />
              <label className="flex items-center gap-1 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={missingMatric}
                  onChange={(e) => setMissingMatric(e.target.checked)}
                />
                Missing Matric Result
              </label>
              <label className="flex items-center gap-1 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={missingInter}
                  onChange={(e) => setMissingInter(e.target.checked)}
                />
                Missing Inter Result
              </label>
            </div>
            {(missingMatric || missingInter) && (
              <p className="text-xs text-gray-400">
                Dono missing filters ek sath check karne par un students ki list
                milegi jinki matric <b>ya</b> inter mein se koi bhi result
                missing hai.
              </p>
            )}
          </div>

          <div className="card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Enrollment #</th>
                  <th>Registration ID</th>
                  <th>Name</th>
                  <th>Father Name</th>
                  <th>CNIC</th>
                  <th>Program</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-6">
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-6">
                      No student Found
                    </td>
                  </tr>
                )}
                {paginatedStudents.map((s) => (
                  <Fragment key={s.id}>
                    <tr>
                      <td className="font-medium">{s.enrollmentNumber}</td>
                      <td>{s.registrationId || "—"}</td>
                      <td>{s.name}</td>
                      <td>{s.fatherName || "—"}</td>
                      <td>{s.cnic || "—"}</td>
                      <td>{s.program || "—"}</td>
                      <td className="space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          className="text-primary-600 text-sm hover:underline"
                          onClick={() =>
                            setEditingStudentId(
                              editingStudentId === s.id ? null : s.id,
                            )
                          }
                        >
                          {editingStudentId === s.id ? "Close" : "Update"}
                        </button>
                        <Link
                          to={`/academic-records/${s.id}`}
                          className="text-primary-600 text-sm hover:underline"
                        >
                          Full Detail →
                        </Link>
                      </td>
                    </tr>
                    {editingStudentId === s.id && (
                      <StudentQuickEditRow
                        key={`${s.id}-edit`}
                        student={s}
                        colSpan={7}
                        onClose={() => setEditingStudentId(null)}
                      />
                    )}
                  </Fragment>
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
        </>
      )}
    </div>
  );
}
