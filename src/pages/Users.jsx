import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useToggleBlockUserMutation,
  useDeleteUserMutation,
} from '../app/api';
import { ROLE_LABELS } from '../components/sidebarConfig';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';

const ROLES = Object.keys(ROLE_LABELS);

export default function Users() {
  const { data: users = [], isLoading } = useGetUsersQuery();
  const [createUser] = useCreateUserMutation();
  const [toggleBlock] = useToggleBlockUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DataEntry' });

  const { page, setPage, totalPages, totalItems, pageSize, paginatedItems } = usePagination(users, 10);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(form).unwrap();
      toast.success('User account created');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'DataEntry' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold dark:text-gray-100">User Management</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add User</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="text-center text-gray-400 py-6">Loading…</td></tr>}
            {paginatedItems.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td>{ROLE_LABELS[u.role]}</td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="space-x-2">
                  <button className="text-primary-600 text-sm hover:underline" onClick={() => toggleBlock(u.id)}>
                    {u.isActive ? 'Block' : 'Unblock'}
                  </button>
                  <button className="text-red-600 text-sm hover:underline" onClick={() => deleteUser(u.id)}>Delete</button>
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

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md">
            <h2 className="font-semibold mb-4 dark:text-gray-100">Add New User</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required type="email" className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input required type="password" className="input" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
