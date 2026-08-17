import { useState } from "react";
import { useGetAuditLogQuery, useGetUsersQuery } from "../app/api";

const ACTION_COLORS = {
  Created: "bg-green-100 text-green-700",
  Updated: "bg-blue-100 text-blue-700",
  StatusChanged: "bg-amber-100 text-amber-700",
  Imported: "bg-purple-100 text-purple-700",
  Deleted: "bg-red-100 text-red-700",
};

const MODULES = [
  { value: "", label: "All departments" },
  { value: "Fee", label: "Accounts (Fee)" },
  { value: "Student", label: "Students" },
  { value: "AcademicRecord", label: "Academic Records" },
  { value: "Letter", label: "Letters" },
];

export default function AccountsHistory() {
  const [module, setModule] = useState("Fee");
  const [userId, setUserId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const { data: users = [] } = useGetUsersQuery();

  const { data: logs = [], isLoading } = useGetAuditLogQuery({
    module: module || undefined,
    userId: userId || undefined,
  });

  const filteredLogs = studentSearch
    ? logs.filter(
        (l) =>
          l.student?.enrollmentNumber
            ?.toLowerCase()
            .includes(studentSearch.toLowerCase()) ||
          l.student?.name?.toLowerCase().includes(studentSearch.toLowerCase()),
      )
    : logs;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold dark:text-gray-100">
        Department History
      </h1>
      <p className="text-sm text-gray-500">
        Har department ke changes ka record — kisne, kab, kis student ke liye,
        kya badla.
      </p>

      <div className="flex flex-wrap gap-2">
        <select
          className="input max-w-xs"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        >
          {MODULES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          className="input max-w-xs"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          <option value="">All staff</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
        <input
          className="input max-w-xs"
          placeholder="Filter by student name/roll number…"
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Student</th>
              <th>Details</th>
              <th>Performed By</th>
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
            {!isLoading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-6">
                  No history found
                </td>
              </tr>
            )}
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td className="text-sm whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="text-sm">
                  {log.student
                    ? `${log.student.name} (${log.student.enrollmentNumber})`
                    : "—"}
                </td>
                <td className="text-sm text-gray-600 max-w-md">
                  {log.description}
                </td>
                <td className="text-sm">
                  {log.performedBy?.name} ({log.performedByRole})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
