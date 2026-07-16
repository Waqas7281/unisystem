import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useGetHrDashboardSummaryQuery,
  useGetStaffApplicationsQuery,
  useCreateStaffApplicationMutation,
  useGetStaffLeavesQuery,
  useUpsertStaffLeaveMutation,
} from '../app/api';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';

const TABS = [
  { key: 'Staff', label: 'Staff' },
  { key: 'Applications', label: 'Applications' },
  { key: 'Offs', label: 'Monthly Offs' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthLabel(key) {
  // key = "YYYY-MM"
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

function StaffTab() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data: staff = [], isLoading } = useGetStaffQuery({ search, status });
  const { page, setPage, totalPages, totalItems, pageSize, paginatedItems: paginatedStaff } = usePagination(staff, 10);
  const [createStaff, { isLoading: creating }] = useCreateStaffMutation();
  const [updateStaff] = useUpdateStaffMutation();
  const [form, setForm] = useState({ name: '', designation: '', department: '', contact: '', email: '', cnic: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Staff ka naam likhein');
    try {
      await createStaff(form).unwrap();
      toast.success('Naya staff member add ho gaya');
      setForm({ name: '', designation: '', department: '', contact: '', email: '', cnic: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add staff');
    }
  };

  const handleToggleStatus = async (member) => {
    const next = member.status === 'Active' ? 'Left' : 'Active';
    try {
      await updateStaff({ id: member.id, status: next }).unwrap();
      toast.success(next === 'Left' ? `${member.name} ko "Left" mark kar diya` : `${member.name} ko dobara "Active" kar diya`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="font-semibold">Naya Staff Add Karein</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <input className="input" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <input className="input" placeholder="Contact #" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="CNIC" value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
          <button className="btn-primary col-span-2 md:col-span-1" disabled={creating}>{creating ? 'Saving…' : '+ Add Staff'}</button>
        </form>
      </div>

      <div className="card space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input className="input max-w-xs" placeholder="Search name, designation, department…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Left">Left</option>
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Join Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center text-gray-400 py-6">Loading…</td></tr>}
            {!isLoading && staff.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-400 py-6">Koi staff member nahi mila</td></tr>
            )}
            {paginatedStaff.map((m) => (
              <tr key={m.id}>
                <td className="font-medium">{m.name}</td>
                <td>{m.designation || '—'}</td>
                <td>{m.department || '—'}</td>
                <td>{m.contact || '—'}</td>
                <td>
                  <span className={m.status === 'Active' ? 'text-green-700' : 'text-red-600'}>{m.status}</span>
                </td>
                <td>{m.joinDate ? new Date(m.joinDate).toLocaleDateString() : '—'}</td>
                <td>
                  <button className="text-primary-600 text-sm hover:underline" onClick={() => handleToggleStatus(m)}>
                    {m.status === 'Active' ? 'Mark as Left' : 'Mark as Active'}
                  </button>
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

function ApplicationsTab() {
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const { data: results = [], isLoading: searching } = useGetStaffQuery({ search }, { skip: !search });
  const { data: appData, isLoading, refetch } = useGetStaffApplicationsQuery(selectedStaff?.id, { skip: !selectedStaff });
  const [createApp, { isLoading: creating }] = useCreateStaffApplicationMutation();
  const [form, setForm] = useState({ title: '', description: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Application ka title likhein');
    try {
      await createApp({ staffId: selectedStaff.id, ...form }).unwrap();
      toast.success('Application save ho gayi');
      setForm({ title: '', description: '' });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save application');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <p className="text-sm text-gray-500">Staff member ko search karein, phir uski application (title + description) add karein.</p>
        <input
          className="input max-w-md"
          placeholder="Search staff by name, designation, department…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedStaff(null); }}
        />
        {search && (
          <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
            {searching && <p className="p-3 text-sm text-gray-400">Searching…</p>}
            {!searching && results.length === 0 && <p className="p-3 text-sm text-gray-400">Koi staff nahi mila</p>}
            {results.map((s) => (
              <button
                key={s.id}
                className={`w-full text-left p-3 text-sm hover:bg-gray-50 ${selectedStaff?.id === s.id ? 'bg-primary-50' : ''}`}
                onClick={() => setSelectedStaff(s)}
              >
                <span className="font-medium">{s.name}</span>{' '}
                <span className="text-gray-400">— {s.designation || 'N/A'} · {s.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStaff && (
        <div className="card space-y-4">
          <h2 className="font-semibold">{selectedStaff.name}'s Applications</h2>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-gray-500">Title</label>
              <input className="input mt-1 w-56" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Description</label>
              <input className="input mt-1 w-72" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn-primary" disabled={creating}>{creating ? 'Saving…' : '+ Add Application'}</button>
          </form>

          {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}

          {appData && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-primary-700 mb-2">Current Month</h3>
                {appData.currentMonthApps.length === 0 ? (
                  <p className="text-sm text-gray-400">Is mahine ki koi application nahi hai</p>
                ) : (
                  <ul className="divide-y border rounded-lg">
                    {appData.currentMonthApps.map((a) => (
                      <li key={a.id} className="p-3">
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-sm text-gray-500">{a.description || '—'}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {Object.keys(appData.byMonth).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Purani Applications (Month-wise)</h3>
                  <div className="space-y-3">
                    {Object.entries(appData.byMonth)
                      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
                      .map(([key, apps]) => (
                        <div key={key}>
                          <p className="text-xs font-semibold text-gray-500 mb-1">{monthLabel(key)}</p>
                          <ul className="divide-y border rounded-lg">
                            {apps.map((a) => (
                              <li key={a.id} className="p-3">
                                <p className="font-medium text-sm">{a.title}</p>
                                <p className="text-sm text-gray-500">{a.description || '—'}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OffsTab() {
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const { data: results = [], isLoading: searching } = useGetStaffQuery({ search }, { skip: !search });
  const { data: leaves = [], refetch } = useGetStaffLeavesQuery(selectedStaff?.id, { skip: !selectedStaff });
  const [upsertLeave, { isLoading: saving }] = useUpsertStaffLeaveMutation();

  const now = new Date();
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), offDays: '', note: '' });

  const currentEntry = leaves.find((l) => l.month === Number(form.month) && l.year === Number(form.year));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await upsertLeave({
        staffId: selectedStaff.id,
        month: Number(form.month),
        year: Number(form.year),
        offDays: Number(form.offDays || 0),
        note: form.note,
      }).unwrap();
      toast.success('Off days save ho gaye');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <p className="text-sm text-gray-500">Staff member search karein, phir har mahine ki "off" days entry karein.</p>
        <input
          className="input max-w-md"
          placeholder="Search staff by name, designation, department…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedStaff(null); }}
        />
        {search && (
          <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
            {searching && <p className="p-3 text-sm text-gray-400">Searching…</p>}
            {!searching && results.length === 0 && <p className="p-3 text-sm text-gray-400">Koi staff nahi mila</p>}
            {results.map((s) => (
              <button
                key={s.id}
                className={`w-full text-left p-3 text-sm hover:bg-gray-50 ${selectedStaff?.id === s.id ? 'bg-primary-50' : ''}`}
                onClick={() => setSelectedStaff(s)}
              >
                <span className="font-medium">{s.name}</span>{' '}
                <span className="text-gray-400">— {s.designation || 'N/A'} · {s.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStaff && (
        <div className="card space-y-4">
          <h2 className="font-semibold">{selectedStaff.name}'s Monthly Offs</h2>
          <form onSubmit={handleSave} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-gray-500">Month</label>
              <select className="input mt-1" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Year</label>
              <input type="number" className="input mt-1 w-24" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Off Days</label>
              <input type="number" className="input mt-1 w-24" value={form.offDays} onChange={(e) => setForm({ ...form, offDays: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Note</label>
              <input className="input mt-1 w-56" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : currentEntry ? 'Update' : '+ Add'}</button>
          </form>
          {currentEntry && (
            <p className="text-xs text-gray-400">
              {MONTH_NAMES[form.month - 1]} {form.year} ke liye is waqt {currentEntry.offDays} off days record hain.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Off Days</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-4">Koi off record nahi hai</td></tr>
                )}
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td>{MONTH_NAMES[l.month - 1]} {l.year}</td>
                    <td>{l.offDays}</td>
                    <td>{l.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HR() {
  const [tab, setTab] = useState('Staff');
  const { data: summary } = useGetHrDashboardSummaryQuery();

  const cards = [
    { label: 'Total Staff', value: summary?.total ?? '—' },
    { label: 'Active', value: summary?.active ?? '—', color: 'text-green-600' },
    { label: 'Left', value: summary?.left ?? '—', color: 'text-red-600' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">HR — Staff Management</h1>
        <p className="text-gray-500 text-sm">
          Naya staff add karein, jo staff chor kar gaya hai uska status update karein, staff ki applications ka
          record rakhein (month-wise), aur har mahine ke off days track karein.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color || ''}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'Staff' && <StaffTab />}
      {tab === 'Applications' && <ApplicationsTab />}
      {tab === 'Offs' && <OffsTab />}
    </div>
  );
}
