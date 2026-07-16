import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useGetDashboardSummaryQuery, useGetPendingApplicationsQuery } from '../app/api';

export default function Dashboard() {
  const user = useSelector((state) => state.auth.user);
  const { data: summary, isLoading } = useGetDashboardSummaryQuery();
  const { data: pending = [] } = useGetPendingApplicationsQuery();

  const cards = [
    { label: 'Total Students', value: summary?.totalStudents ?? '—', color: 'bg-blue-50 text-blue-700' },
    { label: 'Fee Paid', value: summary?.studentsWithFeePaid ?? '—', color: 'bg-green-50 text-green-700' },
    { label: 'Fee Unpaid', value: summary?.studentsWithFeeUnpaid ?? '—', color: 'bg-red-50 text-red-700' },
    { label: 'Pending Applications', value: summary?.totalPendingApplications ?? '—', color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-gray-500 text-sm">Here's what's happening across the university system today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${isLoading ? 'text-gray-300' : ''}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Pending Applications</h2>
          <Link to="/applications" className="text-sm text-primary-600 hover:underline">View all →</Link>
        </div>
        {pending.length === 0 && <p className="text-sm text-gray-400">No pending applications 🎉</p>}
        <div className="space-y-2">
          {pending.slice(0, 8).map((app) => (
            <Link
              key={app.id}
              to={`/applications/${app.id}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-100"
            >
              <div>
                <p className="text-sm font-medium">{app.title}</p>
                <p className="text-xs text-gray-400">
                  {app.student?.name} ({app.student?.enrollmentNumber})
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">{app.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
