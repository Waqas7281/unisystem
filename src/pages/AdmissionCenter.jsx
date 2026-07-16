import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
} from '../app/api';

const emptyForm = {
  enrollmentNumber: '',
  registrationId: '',
  name: '',
  fatherName: '',
  cnic: '',
  rollNo: '',
  program: '',
  section: '',
  semesterSystem: '',
  email: '',
  matricBoard: '',
  matricRollNo: '',
  matricYear: '',
  interBoard: '',
  interRollNo: '',
  interYear: '',
};

function StudentModal({ initial, onClose, onSubmit, submitting, title }) {
  const [form, setForm] = useState(initial);

  const handleChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Identity</p>
            <div className="grid grid-cols-2 gap-2">
              <input required className="input" placeholder="Enrollment Number" value={form.enrollmentNumber} onChange={handleChange('enrollmentNumber')} />
              <input className="input" placeholder="Registration ID" value={form.registrationId} onChange={handleChange('registrationId')} />
              <input required className="input col-span-2" placeholder="Student Full Name" value={form.name} onChange={handleChange('name')} />
              <input className="input" placeholder="Father Name" value={form.fatherName} onChange={handleChange('fatherName')} />
              <input className="input" placeholder="CNIC / B-Form Number" value={form.cnic} onChange={handleChange('cnic')} />
              <input className="input" placeholder="Roll No" value={form.rollNo} onChange={handleChange('rollNo')} />
              <input type="email" className="input" placeholder="Email" value={form.email} onChange={handleChange('email')} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Program</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Program (e.g. BSCS)" value={form.program} onChange={handleChange('program')} />
              <input className="input" placeholder="Section" value={form.section} onChange={handleChange('section')} />
              <select className="input col-span-2" value={form.semesterSystem} onChange={handleChange('semesterSystem')}>
                <option value="">Program Duration (optional)</option>
                <option value="4-year">4-year (8 semesters)</option>
                <option value="5-year">5-year (10 semesters)</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Matric Detail</p>
            <div className="grid grid-cols-3 gap-2">
              <input className="input" placeholder="Board" value={form.matricBoard} onChange={handleChange('matricBoard')} />
              <input className="input" placeholder="Roll No" value={form.matricRollNo} onChange={handleChange('matricRollNo')} />
              <input type="number" className="input" placeholder="Year" value={form.matricYear} onChange={handleChange('matricYear')} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Intermediate Detail</p>
            <div className="grid grid-cols-3 gap-2">
              <input className="input" placeholder="Board" value={form.interBoard} onChange={handleChange('interBoard')} />
              <input className="input" placeholder="Roll No" value={form.interRollNo} onChange={handleChange('interRollNo')} />
              <input type="number" className="input" placeholder="Year" value={form.interYear} onChange={handleChange('interYear')} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdmissionCenter() {
  const user = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState('');
  const { data: myStudents = [], isLoading } = useGetStudentsQuery({ mine: true, search });
  const [createStudent, { isLoading: creating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: updating }] = useUpdateStudentMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const stats = useMemo(() => {
    const total = myStudents.length;
    const missingMatric = myStudents.filter((s) => !s.matricBoard && !s.matricRollNo).length;
    const missingInter = myStudents.filter((s) => !s.interBoard && !s.interRollNo).length;
    return { total, missingMatric, missingInter };
  }, [myStudents]);

  const handleCreate = async (form) => {
    try {
      await createStudent({
        ...form,
        matricYear: form.matricYear ? Number(form.matricYear) : undefined,
        interYear: form.interYear ? Number(form.interYear) : undefined,
        semesterSystem: form.semesterSystem || undefined,
      }).unwrap();
      toast.success('Student registered successfully');
      setShowCreate(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to register student');
    }
  };

  const handleUpdate = async (form) => {
    try {
      await updateStudent({
        id: editingStudent.id,
        ...form,
        matricYear: form.matricYear ? Number(form.matricYear) : undefined,
        interYear: form.interYear ? Number(form.interYear) : undefined,
        semesterSystem: form.semesterSystem || undefined,
      }).unwrap();
      toast.success('Student record updated');
      setEditingStudent(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update student');
    }
  };

  const toEditForm = (s) => ({
    enrollmentNumber: s.enrollmentNumber || '',
    registrationId: s.registrationId || '',
    name: s.name || '',
    fatherName: s.fatherName || '',
    cnic: s.cnic || '',
    rollNo: s.rollNo || '',
    program: s.program || '',
    section: s.section || '',
    semesterSystem: s.semesterSystem || '',
    email: s.email || '',
    matricBoard: s.matricBoard || '',
    matricRollNo: s.matricRollNo || '',
    matricYear: s.matricYear || '',
    interBoard: s.interBoard || '',
    interRollNo: s.interRollNo || '',
    interYear: s.interYear || '',
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-gray-500 text-sm">
          Yahan se aap naye students ka initial record register kar sakte hain. Record Room ko yeh students
          automatically dikhengay taake wo baqi record complete kar sakay.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-400">Total Registered by Me</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">Missing Matric Detail</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{stats.missingMatric}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">Missing Intermediate Detail</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{stats.missingInter}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="input max-w-sm"
          placeholder="Search my students (enrollment, reg ID, CNIC, name, roll no)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Register New Student</button>
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
              <th>Roll No</th>
              <th>Program</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className="text-center text-gray-400 py-6">Loading…</td></tr>}
            {!isLoading && myStudents.length === 0 && (
              <tr><td colSpan={8} className="text-center text-gray-400 py-6">Aapne abhi tak koi student register nahi kiya</td></tr>
            )}
            {myStudents.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.enrollmentNumber}</td>
                <td>{s.registrationId || '—'}</td>
                <td>{s.name}</td>
                <td>{s.fatherName || '—'}</td>
                <td>{s.cnic || '—'}</td>
                <td>{s.rollNo || '—'}</td>
                <td>{s.program || '—'}</td>
                <td>
                  <button className="text-primary-600 text-sm hover:underline" onClick={() => setEditingStudent(s)}>
                    Edit / Complete →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <StudentModal
          title="Register New Student"
          initial={emptyForm}
          submitting={creating}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingStudent && (
        <StudentModal
          title={`Edit — ${editingStudent.name}`}
          initial={toEditForm(editingStudent)}
          submitting={updating}
          onClose={() => setEditingStudent(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}
