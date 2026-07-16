import { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  useLazyGetStudentByEnrollmentQuery,
  useGetStudentsQuery,
  useGetStudentQuery,
  useUpdateStudentMutation,
  useGetAcademicRecordsByStudentQuery,
  useCreateAcademicRecordMutation,
  useUpdateAcademicRecordMutation,
  useDeleteAcademicRecordMutation,
  useGetLettersByStudentQuery,
  useCreateLetterMutation,
  useUpdateLetterMutation,
  useDeleteLetterMutation,
  useGetStudentFeesQuery,
  useGetSemestersQuery,
  useGenerateSemestersMutation,
  useExtendSemestersMutation,
  useAddFeeMutation,
  useUpdateFeeMutation,
  useUpdateFeeStatusMutation,
  useGetFeeCustomFieldsQuery,
} from '../app/api';

const LEVELS = ['Matric', 'Intermediate', 'Degree'];
const STATUS_TABS = [
  { key: 'drop', label: 'Drop' },
  { key: 'dpt', label: 'DPT' },
  { key: 'bar', label: 'Bar' },
  { key: 'cancel', label: 'Cancel' },
  { key: 'dropOfScholarship', label: 'Drop Scholarship' },
];
const PAID_STATUS_OPTIONS = ['unpaid', 'partial', 'paid'];

/* ---------------- Student search / verify gate ---------------- */

function StudentSearch({ onSelect }) {
  const [enrollment, setEnrollment] = useState('');
  const [fetchByEnrollment, { data: exactStudent, isFetching: verifying, isError: notFound }] =
    useLazyGetStudentByEnrollmentQuery();
  const [nameSearch, setNameSearch] = useState('');
  const { data: nameResults = [], isLoading: searchingByName } = useGetStudentsQuery(
    nameSearch ? { search: nameSearch } : undefined,
    { skip: !nameSearch },
  );

  const handleVerify = (e) => {
    e.preventDefault();
    if (!enrollment.trim()) return toast.error('Enrollment number likhein');
    fetchByEnrollment(enrollment.trim());
  };

  return (
    <div className="card space-y-3">
      <h1 className="text-xl font-bold">Student Full Profile</h1>
      <p className="text-sm text-gray-500">
        Kisi bhi student ka poora record — basic detail, academic record, fee/fine aur letters — ek hi page par
        dekhein aur update karein. Pehle student ko <b>Enrollment Number</b> se search karein.
      </p>
      <form onSubmit={handleVerify} className="flex flex-wrap gap-2 items-end">
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
          {verifying ? 'Searching…' : 'Search Student'}
        </button>
      </form>
      {notFound && !verifying && enrollment && (
        <p className="text-sm text-red-600">
          Is enrollment number ka koi student database mein nahi mila — dobara check karein.
        </p>
      )}
      {exactStudent && !notFound && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <p className="text-sm text-green-700">
            ✓ Mil gaya: <b>{exactStudent.name}</b> ({exactStudent.enrollmentNumber})
          </p>
          <button className="btn-primary" onClick={() => onSelect(exactStudent.id)}>
            Open Full Record →
          </button>
        </div>
      )}

      <div className="pt-2 border-t">
        <label className="text-xs text-gray-500">Ya naam / registration ID / CNIC / roll no se search karein</label>
        <input
          className="input mt-1 max-w-md"
          placeholder="Search by name, registration ID, CNIC, roll no…"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />
        {nameSearch && (
          <div className="border rounded-lg divide-y max-h-64 overflow-y-auto mt-2">
            {searchingByName && <p className="p-3 text-sm text-gray-400">Searching…</p>}
            {!searchingByName && nameResults.length === 0 && (
              <p className="p-3 text-sm text-gray-400">Koi student database mein nahi mila</p>
            )}
            {nameResults.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full text-left p-3 text-sm hover:bg-gray-50"
                onClick={() => onSelect(s.id)}
              >
                <span className="font-medium">{s.name}</span>{' '}
                <span className="text-gray-400">
                  — {s.enrollmentNumber} {s.registrationId ? `· Reg# ${s.registrationId}` : ''}{' '}
                  {s.cnic ? `· CNIC ${s.cnic}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Basic Info ---------------- */

function BasicInfoSection({ student }) {
  const [updateStudent, { isLoading: saving }] = useUpdateStudentMutation();
  const [form, setForm] = useState({
    registrationId: student.registrationId || '',
    cnic: student.cnic || '',
    rollNo: student.rollNo || '',
    fatherName: student.fatherName || '',
    program: student.program || '',
    section: student.section || '',
    semesterSystem: student.semesterSystem || '',
    email: student.email || '',
    matricBoard: student.matricBoard || '',
    matricRollNo: student.matricRollNo || '',
    matricYear: student.matricYear || '',
    interBoard: student.interBoard || '',
    interRollNo: student.interRollNo || '',
    interYear: student.interYear || '',
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateStudent({
        id: student.id,
        ...form,
        matricYear: form.matricYear ? Number(form.matricYear) : undefined,
        interYear: form.interYear ? Number(form.interYear) : undefined,
        semesterSystem: form.semesterSystem || undefined,
      }).unwrap();
      toast.success('Student record updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update student');
    }
  };

  const handleToggleCategory = async () => {
    const next = student.studentCategory === 'NewAdmission' ? 'Continuing' : 'NewAdmission';
    try {
      await updateStudent({ id: student.id, studentCategory: next }).unwrap();
      toast.success(next === 'Continuing' ? 'Moved to Study (Continuing) list' : 'Moved back to New Admission list');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to change category');
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold">Basic / Admission Detail</h2>
        <button className="btn-secondary" type="button" onClick={handleToggleCategory}>
          {student.studentCategory === 'NewAdmission' ? 'Move to Study List' : 'Move back to New Admission'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Identity</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <input className="input" placeholder="Registration ID" value={form.registrationId} onChange={set('registrationId')} />
            <input className="input" placeholder="CNIC / B-Form" value={form.cnic} onChange={set('cnic')} />
            <input className="input" placeholder="Roll No" value={form.rollNo} onChange={set('rollNo')} />
            <input className="input" placeholder="Father Name" value={form.fatherName} onChange={set('fatherName')} />
            <input type="email" className="input md:col-span-2" placeholder="Email" value={form.email} onChange={set('email')} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Program</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <input className="input" placeholder="Program" value={form.program} onChange={set('program')} />
            <input className="input" placeholder="Section" value={form.section} onChange={set('section')} />
            <select className="input" value={form.semesterSystem} onChange={set('semesterSystem')}>
              <option value="">Program Duration</option>
              <option value="4-year">4-year (8 semesters)</option>
              <option value="5-year">5-year (10 semesters)</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Matric Detail</p>
          <div className="grid grid-cols-3 gap-2">
            <input className="input" placeholder="Board" value={form.matricBoard} onChange={set('matricBoard')} />
            <input className="input" placeholder="Roll No" value={form.matricRollNo} onChange={set('matricRollNo')} />
            <input type="number" className="input" placeholder="Year" value={form.matricYear} onChange={set('matricYear')} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Intermediate Detail</p>
          <div className="grid grid-cols-3 gap-2">
            <input className="input" placeholder="Board" value={form.interBoard} onChange={set('interBoard')} />
            <input className="input" placeholder="Roll No" value={form.interRollNo} onChange={set('interRollNo')} />
            <input type="number" className="input" placeholder="Year" value={form.interYear} onChange={set('interYear')} />
          </div>
        </div>

        <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Basic Info'}</button>
      </form>
    </div>
  );
}

/* ---------------- Academic Records ---------------- */

function AcademicRecordRow({ record, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    sessionStartYear: record.sessionStartYear || '',
    sessionEndYear: record.sessionEndYear || '',
    totalMarks: record.totalMarks ?? '',
    obtainedMarks: record.obtainedMarks ?? '',
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSave = async () => {
    await onUpdate(record.id, {
      sessionStartYear: form.sessionStartYear ? Number(form.sessionStartYear) : undefined,
      sessionEndYear: form.sessionEndYear ? Number(form.sessionEndYear) : undefined,
      totalMarks: form.totalMarks !== '' ? Number(form.totalMarks) : undefined,
      obtainedMarks: form.obtainedMarks !== '' ? Number(form.obtainedMarks) : undefined,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <tr>
        <td>{record.level}</td>
        <td className="flex gap-1">
          <input type="number" className="input py-1 w-20" placeholder="Start" value={form.sessionStartYear} onChange={set('sessionStartYear')} />
          {record.level !== 'Degree' && (
            <input type="number" className="input py-1 w-20" placeholder="End" value={form.sessionEndYear} onChange={set('sessionEndYear')} />
          )}
        </td>
        <td><input type="number" className="input py-1 w-20" value={form.totalMarks} onChange={set('totalMarks')} /></td>
        <td><input type="number" className="input py-1 w-20" value={form.obtainedMarks} onChange={set('obtainedMarks')} /></td>
        <td>{record.enteredBy?.name || '—'}</td>
        <td className="space-x-2 whitespace-nowrap">
          <button className="text-green-600 text-sm hover:underline" onClick={handleSave}>Save</button>
          <button className="text-gray-500 text-sm hover:underline" onClick={() => setEditing(false)}>Cancel</button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{record.level}</td>
      <td>
        {record.sessionStartYear || '—'}
        {record.sessionEndYear ? ` - ${record.sessionEndYear}` : ''}
      </td>
      <td>{record.totalMarks ?? '—'}</td>
      <td>{record.obtainedMarks ?? '—'}</td>
      <td>{record.enteredBy?.name || '—'}</td>
      <td className="space-x-2 whitespace-nowrap">
        <button className="text-primary-600 text-sm hover:underline" onClick={() => setEditing(true)}>Edit</button>
        <button className="text-red-600 text-sm hover:underline" onClick={() => onDelete(record.id)}>Delete</button>
      </td>
    </tr>
  );
}

function AcademicRecordsSection({ studentId }) {
  const { data: records = [], refetch } = useGetAcademicRecordsByStudentQuery(studentId);
  const [createRecord, { isLoading: creating }] = useCreateAcademicRecordMutation();
  const [updateRecord] = useUpdateAcademicRecordMutation();
  const [deleteRecord] = useDeleteAcademicRecordMutation();
  const [form, setForm] = useState({ level: 'Matric', sessionStartYear: '', sessionEndYear: '', totalMarks: '', obtainedMarks: '' });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createRecord({
        studentId,
        level: form.level,
        sessionStartYear: form.sessionStartYear ? Number(form.sessionStartYear) : undefined,
        sessionEndYear: form.sessionEndYear ? Number(form.sessionEndYear) : undefined,
        totalMarks: form.totalMarks !== '' ? Number(form.totalMarks) : undefined,
        obtainedMarks: form.obtainedMarks !== '' ? Number(form.obtainedMarks) : undefined,
      }).unwrap();
      toast.success(`${form.level} record saved`);
      setForm({ level: 'Matric', sessionStartYear: '', sessionEndYear: '', totalMarks: '', obtainedMarks: '' });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save record');
    }
  };

  const handleUpdate = async (id, body) => {
    try {
      await updateRecord({ id, ...body }).unwrap();
      toast.success('Record updated');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update record');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this academic record?')) return;
    try {
      await deleteRecord(id).unwrap();
      toast.success('Record deleted');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete record');
    }
  };

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">Academic Records (Matric / Inter / Degree)</h2>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-gray-500">Level</label>
          <select className="input mt-1" value={form.level} onChange={set('level')}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">{form.level === 'Degree' ? 'Session Start Year' : 'Session Start'}</label>
          <input type="number" className="input mt-1 w-28" value={form.sessionStartYear} onChange={set('sessionStartYear')} />
        </div>
        {form.level !== 'Degree' && (
          <div>
            <label className="text-xs text-gray-500">Session End</label>
            <input type="number" className="input mt-1 w-28" value={form.sessionEndYear} onChange={set('sessionEndYear')} />
          </div>
        )}
        {form.level === 'Degree' && (
          <p className="text-xs text-gray-400 pb-2">End year auto-calculated from program duration.</p>
        )}
        <div>
          <label className="text-xs text-gray-500">Total Marks</label>
          <input type="number" className="input mt-1 w-24" value={form.totalMarks} onChange={set('totalMarks')} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Obtained Marks</label>
          <input type="number" className="input mt-1 w-24" value={form.obtainedMarks} onChange={set('obtainedMarks')} />
        </div>
        <button className="btn-primary" disabled={creating}>{creating ? 'Saving…' : '+ Add Record'}</button>
      </form>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Level</th>
              <th>Session</th>
              <th>Total</th>
              <th>Obtained</th>
              <th>Entered By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-6">Abhi koi academic record nahi hai</td></tr>
            )}
            {records.map((r) => (
              <AcademicRecordRow key={r.id} record={r} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Letters ---------------- */

function LettersSection({ studentId }) {
  const { data: letters = [], isLoading, refetch } = useGetLettersByStudentQuery(studentId);
  const [createLetter, { isLoading: creating }] = useCreateLetterMutation();
  const [updateLetter] = useUpdateLetterMutation();
  const [deleteLetter] = useDeleteLetterMutation();
  const [form, setForm] = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Letter ka title likhein');
    try {
      await createLetter({ studentId, ...form }).unwrap();
      toast.success('Letter record save ho gaya');
      setForm({ title: '', description: '' });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save letter');
    }
  };

  const startEdit = (l) => {
    setEditingId(l.id);
    setEditForm({ title: l.title, description: l.description || '' });
  };

  const handleUpdate = async (id) => {
    try {
      await updateLetter({ id, ...editForm }).unwrap();
      toast.success('Letter updated');
      setEditingId(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update letter');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Ye letter record delete karna hai?')) return;
    try {
      await deleteLetter(id).unwrap();
      toast.success('Letter deleted');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete letter');
    }
  };

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Letters Taken</h2>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
        <input className="input w-48" placeholder="Letter Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input w-60" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn-primary" disabled={creating}>{creating ? 'Saving…' : '+ Add Letter'}</button>
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
            {isLoading && <tr><td colSpan={5} className="text-center text-gray-400 py-4">Loading…</td></tr>}
            {!isLoading && letters.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-4">Koi letter nahi liya abhi tak</td></tr>
            )}
            {letters.map((l) =>
              editingId === l.id ? (
                <tr key={l.id}>
                  <td><input className="input py-1" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></td>
                  <td><input className="input py-1" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></td>
                  <td>{new Date(l.issuedDate).toLocaleDateString()}</td>
                  <td>{l.issuedBy?.name || '—'}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button className="text-green-600 text-sm hover:underline" onClick={() => handleUpdate(l.id)}>Save</button>
                    <button className="text-gray-500 text-sm hover:underline" onClick={() => setEditingId(null)}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={l.id}>
                  <td className="font-medium">{l.title}</td>
                  <td>{l.description || '—'}</td>
                  <td>{new Date(l.issuedDate).toLocaleDateString()}</td>
                  <td>{l.issuedBy?.name || '—'}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button className="text-primary-600 text-sm hover:underline" onClick={() => startEdit(l)}>Edit</button>
                    <button className="text-red-600 text-sm hover:underline" onClick={() => handleDelete(l.id)}>Delete</button>
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

/* ---------------- Fee / Fine ---------------- */

function EditableCell({ value, onSave, type = 'text', options = null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const startEdit = () => {
    setDraft(value ?? '');
    setEditing(true);
  };
  const commit = async () => {
    setEditing(false);
    if (draft === (value ?? '')) return;
    await onSave(draft);
  };
  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  if (!editing) {
    return (
      <td className="cursor-pointer hover:bg-gray-50" onClick={startEdit} title="Click to edit">
        {value === null || value === undefined || value === '' ? '—' : String(value)}
      </td>
    );
  }
  if (options) {
    return (
      <td>
        <select autoFocus className="input py-1 text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </td>
    );
  }
  return (
    <td>
      <input autoFocus type={type} className="input py-1 text-sm w-full min-w-[110px]" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }} />
    </td>
  );
}

function FeeSection({ student }) {
  const studentId = student.id;
  const { data: feeData, isLoading } = useGetStudentFeesQuery(studentId);
  const { data: semesters = [] } = useGetSemestersQuery(studentId);
  const { data: customFields = [] } = useGetFeeCustomFieldsQuery();
  const [generateSemesters] = useGenerateSemestersMutation();
  const [extendSemesters] = useExtendSemestersMutation();
  const [addFee] = useAddFeeMutation();
  const [updateFee] = useUpdateFeeMutation();
  const [updateStatus] = useUpdateFeeStatusMutation();

  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [feeForm, setFeeForm] = useState({ semesterId: '', feeType: 'tuition', amount: '', installmentNumber: 1 });

  const programYears = student?.semesterSystem === '4-year' ? 4 : 5;
  const programSemesters = programYears * 2;

  const overallStats = useMemo(() => {
    if (!feeData?.semesters) return { total: 0, paid: 0, remaining: 0, fine: 0 };
    let total = 0, paid = 0;
    feeData.semesters.forEach((bucket) => {
      bucket.fees.forEach((f) => {
        total += Number(f.amount) || 0;
        paid += Number(f.paidAmount) || 0;
      });
    });
    return { total, paid, remaining: total - paid, fine: feeData.grandFineTotal ?? 0 };
  }, [feeData]);

  const handleGenerate = async () => {
    if (!student?.semesterSystem) {
      toast.error('Pehle Basic Info mein Program Duration (4-year / 5-year) set karein');
      return;
    }
    try {
      await generateSemesters({ studentId, startYear: Number(startYear) }).unwrap();
      toast.success(`${programSemesters} semesters generated (${student.semesterSystem} program)`);
    } catch {
      toast.error('Failed to generate semesters');
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    if (!feeForm.semesterId) return toast.error('Select a semester first');
    try {
      await addFee({ studentId, ...feeForm, amount: Number(feeForm.amount), installmentNumber: Number(feeForm.installmentNumber) }).unwrap();
      toast.success('Fee added');
      setFeeForm({ semesterId: '', feeType: 'tuition', amount: '', installmentNumber: 1 });
    } catch {
      toast.error('Failed to add fee');
    }
  };

  const handleSaveField = async (feeId, field, value) => {
    try {
      await updateFee({ id: feeId, [field]: value }).unwrap();
      toast.success('Updated');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">Fee &amp; Fine Detail</h2>

      {feeData && (
        <div className="flex flex-wrap gap-6 bg-gray-50 rounded-lg p-3">
          <div>
            <p className="text-xs text-gray-400">Grand Total (all semesters)</p>
            <p className="text-lg font-bold text-primary-700">Rs {overallStats.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Paid</p>
            <p className="text-lg font-bold text-green-700">Rs {overallStats.paid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Remaining</p>
            <p className="text-lg font-bold text-red-700">Rs {overallStats.remaining.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Grand Total Fine (Fall + Spring)</p>
            <p className="text-lg font-bold text-amber-700">Rs {overallStats.fine.toLocaleString()}</p>
          </div>
        </div>
      )}

      {semesters.length === 0 && (
        <div className="flex flex-wrap items-end gap-3 border rounded-lg p-3">
          <div>
            <label className="text-sm text-gray-600">Starting Semester Year</label>
            <input type="number" className="input mt-1 w-40" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleGenerate}>
            Generate Semesters {student?.semesterSystem ? `(${student.semesterSystem}, ${programSemesters} semesters)` : '(set program duration first)'}
          </button>
        </div>
      )}

      {semesters.length > 0 && (
        <div className="border rounded-lg p-3">
          <p className="text-sm font-semibold mb-2">Add Fee Entry</p>
          <form onSubmit={handleAddFee} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-gray-500">Semester</label>
              <select className="input mt-1" value={feeForm.semesterId} onChange={(e) => setFeeForm({ ...feeForm, semesterId: e.target.value })}>
                <option value="">Select…</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Fee Type</label>
              <select className="input mt-1" value={feeForm.feeType} onChange={(e) => setFeeForm({ ...feeForm, feeType: e.target.value })}>
                <option value="tuition">Tuition</option>
                <option value="registration">Registration</option>
                <option value="capstone">Capstone Project Fee</option>
                <option value="custom">Custom Fee</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Amount</label>
              <input required type="number" className="input mt-1 w-32" value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Installment #</label>
              <select className="input mt-1" value={feeForm.installmentNumber} onChange={(e) => setFeeForm({ ...feeForm, installmentNumber: e.target.value })}>
                <option value={1}>1 (Full / 1st installment)</option>
                <option value={2}>2nd installment</option>
                <option value={3}>3rd installment</option>
                <option value={4}>4th installment</option>
              </select>
            </div>
            <button className="btn-primary">Add Fee</button>
          </form>
        </div>
      )}

      {isLoading && <p className="text-gray-400 text-sm">Loading fee detail…</p>}

      {feeData && feeData.semesters.map((bucket) => {
        let semPaid = 0, semTotal = 0;
        bucket.fees.forEach((f) => { semTotal += Number(f.amount) || 0; semPaid += Number(f.paidAmount) || 0; });
        const semRemaining = semTotal - semPaid;

        return (
          <div key={bucket.semester.id} className="border rounded-lg p-3 overflow-x-auto">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h3 className="font-semibold text-sm">
                {bucket.semester.label} <span className="text-xs font-normal text-gray-400">({bucket.semester.type})</span>
              </h3>
              <div className="flex gap-3 text-xs font-medium flex-wrap">
                <span className="text-primary-700">Total: Rs {semTotal.toLocaleString()}</span>
                <span className="text-green-700">Paid: Rs {semPaid.toLocaleString()}</span>
                <span className="text-red-700">Remaining: Rs {semRemaining.toLocaleString()}</span>
                <span className="text-amber-700">Fine ({bucket.semester.type}): Rs {(bucket.semesterFineTotal || 0).toLocaleString()}</span>
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
                  {customFields.map((cf) => <th key={cf.id}>{cf.name}</th>)}
                  <th>Status Tabs</th>
                </tr>
              </thead>
              <tbody>
                {bucket.fees.map((f) => {
                  const totalInstallmentsForType = bucket.fees.filter((x) => x.feeType === f.feeType).length;
                  return (
                    <tr key={f.id}>
                      <td className="capitalize">{f.feeType}</td>
                      <EditableCell value={Number(f.amount)} type="number" onSave={(v) => handleSaveField(f.id, 'amount', Number(v))} />
                      <td>{f.installmentNumber}/{totalInstallmentsForType}</td>
                      <EditableCell value={f.paidStatus} options={PAID_STATUS_OPTIONS} onSave={(v) => handleSaveField(f.id, 'paidStatus', v)} />
                      <EditableCell value={Number(f.paidAmount)} type="number" onSave={(v) => handleSaveField(f.id, 'paidAmount', Number(v))} />
                      <EditableCell value={f.dueDate ? String(f.dueDate).slice(0, 10) : ''} type="date" onSave={(v) => handleSaveField(f.id, 'dueDate', v)} />
                      {customFields.map((cf) => (
                        <EditableCell key={cf.id} value={f.customValues?.[cf.name]} onSave={(v) => handleSaveField(f.id, 'customValues', { [cf.name]: v })} />
                      ))}
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {STATUS_TABS.map((t) => (
                            <button key={t.key} onClick={() => updateStatus({ id: f.id, [t.key]: !f[t.key] })}
                              className={`text-xs px-2 py-1 rounded-full border ${f[t.key] ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-500'}`}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bucket.fees.length === 0 && (
                  <tr><td colSpan={7 + customFields.length} className="text-center text-gray-400 py-3">No fee entries yet for this semester</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })}

      {semesters.length > 0 && (
        <button className="btn-secondary" onClick={() => extendSemesters(studentId)}>
          Extend Semester Window (+{programYears} years / +{programSemesters} semesters)
        </button>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function StudentFullProfile() {
  const [studentId, setStudentId] = useState(null);
  const { data: liveStudent } = useGetStudentQuery(studentId, { skip: !studentId });

  return (
    <div className="space-y-5">
      <StudentSearch onSelect={(id) => setStudentId(id)} />

      {studentId && liveStudent && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold">{liveStudent.name}</h2>
              <p className="text-gray-500 text-sm">
                Enrollment: {liveStudent.enrollmentNumber} · Category:{' '}
                <span className={liveStudent.studentCategory === 'NewAdmission' ? 'text-amber-600' : 'text-green-600'}>
                  {liveStudent.studentCategory === 'NewAdmission' ? 'New Admission' : 'Continuing / Study'}
                </span>
              </p>
            </div>
            <button className="btn-secondary" onClick={() => setStudentId(null)}>Search Another Student</button>
          </div>

          <BasicInfoSection student={liveStudent} />
          <AcademicRecordsSection studentId={studentId} />
          <FeeSection student={liveStudent} />
          <LettersSection studentId={studentId} />
        </div>
      )}
    </div>
  );
}
