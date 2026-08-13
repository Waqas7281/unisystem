import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetApplicationsQuery } from "../app/api";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";

const STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-700",
  Assigned: "bg-blue-100 text-blue-700",
  UnderReview: "bg-purple-100 text-purple-700",
  Accepted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function Applications() {
  const user = useSelector((state) => state.auth.user);
  // Data Entry only ever sees applications they personally created — everyone
  // else (Manager, Registrar, Accounts Manager, Student Affair) sees all of them.
  const isDataEntry = user?.role === "DataEntry";
  // Department roles (Record Room, Exam, …) only see applications that were
  // explicitly assigned to them.
  const isAssignedDept = ["RecordRoom", "Exam"].includes(user?.role);
  const [search, setSearch] = useState("");
  const { data: applications = [], isLoading } = useGetApplicationsQuery({
    search,
    mine: isDataEntry,
    assignedToMe: isAssignedDept,
  });
  const { page, setPage, totalPages, totalItems, pageSize, paginatedItems } =
    usePagination(applications, 10);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold dark:text-gray-100">
        {isDataEntry
          ? "My Applications"
          : isAssignedDept
            ? "Assigned Applications"
            : "Applications"}
      </h1>
      <input
        className="input max-w-sm"
        placeholder="Filter by Enrollment Number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Student</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Assigned To</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && applications.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">
                  No applications found
                </td>
              </tr>
            )}
            {paginatedItems.map((app) => (
              <tr key={app.id}>
                <td className="font-medium">{app.title}</td>
                <td>
                  {app.student?.name} ({app.student?.enrollmentNumber})
                </td>
                <td>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[app.status]}`}
                  >
                    {app.status}
                  </span>
                </td>
                <td>{app.createdBy?.name}</td>
                <td>{app.assignedTo?.name || "—"}</td>
                <td>
                  <Link
                    to={`/applications/${app.id}`}
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
