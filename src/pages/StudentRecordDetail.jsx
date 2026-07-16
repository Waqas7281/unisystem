import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useGetStudentQuery,
  useUpdateStudentMutation,
  useGetAcademicRecordsByStudentQuery,
  useCreateAcademicRecordMutation,
  useUpdateAcademicRecordMutation,
  useDeleteAcademicRecordMutation,
  useGetLettersByStudentQuery,
  useCreateLetterMutation,
} from '../app/api';

const LEVELS = ['Matric', 'Intermediate', 'Degree'];

function BasicInfoForm({ student, onSave, saving }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      matricYear: form.matricYear ? Number(form.matricYear) : undefined,
      interYear: form.interYear ? Number(form.interYear) : undefined,
      semesterSystem: form.semesterSystem || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Identity</p>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="Registration ID" value={form.registrationId} onChange={set('registrationId')} />
          <input className="input" placeholder="CNIC / B-Form" value={form.cnic} onChange={set('cnic')} />
          <input className="input" placeholder="Roll No" value={form.rollNo} onChange={set('rollNo')} />
          <input className="input" placeholder="Father Name" value={form.fatherName} onChange={set('fatherName')} />
          <input type="email" className="input col-span-2" placeholder="Email" value={form.email} onChange={set('email')} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Program</p>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="Program" value={form.program} onChange={set('program')} />
          <input className="input" placeholder="Section" value={form.section} onChange={set('section')} />
          <select className="input col-span-2" value={form.semesterSystem} onChange={set('semesterSystem')}>
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
  );
}

function RecordRow({ record, onUpdate, onDelete }) {
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

function AddRecordForm({ studentId, onCreated }) {
  const [createRecord, { isLoading }] = useCreateAcademicRecordMutation();
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
      onCreated?.();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save record');
    }
  };

  return (
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
      <button className="btn-primary" disabled={isLoading}>{isLoading ? 'Saving…' : '+ Add Record'}</button>
    </form>
  );
}

function LettersCard({ studentId }) {
  const { data: letters = [], isLoading, refetch } = useGetLettersByStudentQuery(studentId);
  const [createLetter, { isLoading: creating }] = useCreateLetterMutation();
  const [form, setForm] = useState({ title: '', description: '' });

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

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Letters Taken</h2>
      <p className="text-xs text-gray-500">
        Is student ne pehle jo bhi letters liye hain wo yahan nazar aayenge — naya letter add karne ke liye neeche form bharein.
      </p>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
        <input
          className="input w-48"
          placeholder="Letter Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="input w-60"
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
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
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="text-center text-gray-400 py-4">Loading…</td></tr>}
            {!isLoading && letters.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-400 py-4">Koi letter nahi liya abhi tak</td></tr>
            )}
            {letters.map((l) => (
              <tr key={l.id}>
                <td className="font-medium">{l.title}</td>
                <td>{l.description || '—'}</td>
                <td>{new Date(l.issuedDate).toLocaleDateString()}</td>
                <td>{l.issuedBy?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StudentRecordDetail() {
  const { studentId } = useParams();
  const { data: student, isLoading, refetch: refetchStudent } = useGetStudentQuery(studentId);
  const { data: records = [], refetch: refetchRecords } = useGetAcademicRecordsByStudentQuery(studentId);
  const [updateStudent, { isLoading: savingInfo }] = useUpdateStudentMutation();
  const [updateRecord] = useUpdateAcademicRecordMutation();
  const [deleteRecord] = useDeleteAcademicRecordMutation();

  const handleSaveInfo = async (form) => {
    try {
      await updateStudent({ id: studentId, ...form }).unwrap();
      toast.success('Student record updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update student');
    }
  };

  const handleToggleCategory = async () => {
    const next = student.studentCategory === 'NewAdmission' ? 'Continuing' : 'NewAdmission';
    try {
      await updateStudent({ id: studentId, studentCategory: next }).unwrap();
      toast.success(next === 'Continuing' ? 'Moved to Study (Continuing) list' : 'Moved back to New Admission list');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to change category');
    }
  };

  const handleUpdateRecord = async (id, body) => {
    try {
      await updateRecord({ id, ...body }).unwrap();
      toast.success('Record updated');
      refetchRecords();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update record');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!confirm('Delete this academic record?')) return;
    try {
      await deleteRecord(id).unwrap();
      toast.success('Record deleted');
      refetchRecords();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete record');
    }
  };

  if (isLoading || !student) {
    return <p className="text-gray-400">Loading…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link to="/academic-records" className="text-sm text-primary-600 hover:underline">← Back to list</Link>
          <h1 className="text-xl font-bold mt-1">{student.name}</h1>
          <p className="text-gray-500 text-sm">
            Enrollment: {student.enrollmentNumber} · Category:{' '}
            <span className={student.studentCategory === 'NewAdmission' ? 'text-amber-600' : 'text-green-600'}>
              {student.studentCategory === 'NewAdmission' ? 'New Admission' : 'Continuing / Study'}
            </span>
          </p>
        </div>
        <button className="btn-secondary" onClick={handleToggleCategory}>
          {student.studentCategory === 'NewAdmission' ? 'Move to Study List' : 'Move back to New Admission'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="font-semibold mb-4">Basic / Admission Detail</h2>
          <BasicInfoForm student={student} onSave={handleSaveInfo} saving={savingInfo} />
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Academic Records (Matric / Inter / Degree)</h2>
          <AddRecordForm studentId={studentId} onCreated={refetchRecords} />

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
                  <RecordRow key={r.id} record={r} onUpdate={handleUpdateRecord} onDelete={handleDeleteRecord} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <LettersCard studentId={studentId} />
    </div>
  );
}
