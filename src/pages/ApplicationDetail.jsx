import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  useGetApplicationQuery,
  useAddApplicationActionMutation,
  useAssignApplicationMutation,
  useMarkApplicationDoneMutation,
  useDecideApplicationMutation,
  useGetUsersQuery,
  useGetStudentFeesQuery,
} from "../app/api";

const ACTION_TYPES = [
  "Fine",
  "DC",
  "UMC",
  "LateFee",
  "DPT",
  "Bar",
  "Cancel",
  "DropScholarship",
  "Attendance fine",
];

export default function ApplicationDetail() {
  const { id } = useParams();
  const user = useSelector((state) => state.auth.user);
  const { data, isLoading } = useGetApplicationQuery(id);
  const { data: feeData } = useGetStudentFeesQuery(
    data?.application?.student?.id,
    { skip: !data?.application?.student?.id },
  );
  const { data: users = [] } = useGetUsersQuery(undefined, {
    skip: user?.role !== "Manager",
  });
  const [addAction] = useAddApplicationActionMutation();
  const [assign] = useAssignApplicationMutation();
  const [markDone] = useMarkApplicationDoneMutation();
  const [decide] = useDecideApplicationMutation();

  const [actionForm, setActionForm] = useState({
    actionType: "Fine",
    title: "",
    description: "",
    amount: "",
  });
  const [assignTo, setAssignTo] = useState("");
  const [reason, setReason] = useState("");

  const isReviewer = ["Manager", "AccountsManager", "StudentAffair"].includes(
    user?.role,
  );
  const isDataEntry = user?.role === "DataEntry";

  if (isLoading) return <p className="text-gray-400 text-sm">Loading…</p>;
  if (!data) return null;
  const { application, actions } = data;
  const canAddAction = isReviewer || (isDataEntry && !application.locked);

  const handleAddAction = async (e) => {
    e.preventDefault();
    try {
      await addAction({
        id,
        actionType: actionForm.actionType,
        title: actionForm.title || undefined,
        description: actionForm.description || undefined,
        amount: actionForm.amount ? Number(actionForm.amount) : undefined,
      }).unwrap();
      toast.success(
        actionForm.amount
          ? `Fine of Rs ${actionForm.amount} added and posted to the fee ledger`
          : "Action entry added",
      );
      setActionForm({
        actionType: "Fine",
        title: "",
        description: "",
        amount: "",
      });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add action");
    }
  };

  const handleAssign = async () => {
    if (!assignTo) return;
    const targetUser = users.find((u) => u.id === assignTo);
    try {
      await assign({
        id,
        assignedToUserId: assignTo,
        assignedRole: targetUser?.role,
      }).unwrap();
      toast.success(`Assigned to ${targetUser?.name}`);
    } catch {
      toast.error("Failed to assign");
    }
  };

  const handleDecide = async (decision) => {
    try {
      await decide({ id, decision, reason: reason || undefined }).unwrap();
      toast.success(
        `Application ${decision}. Student has been notified by email.`,
      );
    } catch (err) {
      toast.error(err?.data?.message || "Failed to record decision");
    }
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">{application.title}</h1>
            <p className="text-sm text-gray-500">{application.description}</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-primary-100 text-primary-700">
            {application.status}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
          <div>
            <p className="text-gray-400">Roll Number</p>
            <p className="font-medium">
              {application.student?.enrollmentNumber}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Name</p>
            <p className="font-medium">{application.student?.name}</p>
          </div>
          <div>
            <p className="text-gray-400">Semester</p>
            <p className="font-medium">{application.semester?.label || "—"}</p>
          </div>
          <div>
            <p className="text-gray-400">Email</p>
            <p className="font-medium">{application.student?.email || "—"}</p>
          </div>
          <div>
            <p className="text-gray-400">Created By</p>
            <p className="font-medium">{application.createdBy?.name}</p>
          </div>
        </div>
        {application.photoData ? (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-1">Proof Photo</p>
            <a
              href={
                "data:" +
                (application.photoMimeType || "image/jpeg") +
                ";base64," +
                application.photoData
              }
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={
                  "data:" +
                  (application.photoMimeType || "image/jpeg") +
                  ";base64," +
                  application.photoData
                }
                alt="Application proof"
                className="w-40 h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90"
              />
            </a>
          </div>
        ) : null}
      </div>

      {user?.role === "Manager" &&
        application.status !== "Accepted" &&
        application.status !== "Rejected" && (
          <div className="card">
            <h2 className="font-semibold mb-3">Assign & Review</h2>
            <div className="flex flex-wrap gap-2 items-end">
              <select
                className="input max-w-xs"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
              >
                <option value="">Select person to assign…</option>
                {users
                  .filter((u) => u.id !== application.createdBy?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
              <button className="btn-primary" onClick={handleAssign}>
                Assign
              </button>
            </div>
          </div>
        )}

      {canAddAction &&
        application.status !== "Accepted" &&
        application.status !== "Rejected" && (
          <div className="card">
            <h2 className="font-semibold mb-1">Fine / Action Entry</h2>
            <p className="text-xs text-gray-400 mb-3">
              Entries with an amount are automatically posted to the student's
              fee for <b>{application.semester?.label}</b>.
            </p>
            <form
              onSubmit={handleAddAction}
              className="grid grid-cols-1 md:grid-cols-4 gap-2"
            >
              <select
                className="input"
                value={actionForm.actionType}
                onChange={(e) =>
                  setActionForm({ ...actionForm, actionType: e.target.value })
                }
              >
                {ACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Title"
                value={actionForm.title}
                onChange={(e) =>
                  setActionForm({ ...actionForm, title: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Fine Amount (optional)"
                type="number"
                value={actionForm.amount}
                onChange={(e) =>
                  setActionForm({ ...actionForm, amount: e.target.value })
                }
              />
              <button className="btn-primary">Add</button>
              <textarea
                className="input md:col-span-4"
                placeholder="Description"
                value={actionForm.description}
                onChange={(e) =>
                  setActionForm({ ...actionForm, description: e.target.value })
                }
              />
            </form>
          </div>
        )}

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">
            Fee Ledger — {application.semester?.label}
          </h2>
          <Link
            to={`/students/${application.student?.id}/fee`}
            className="text-primary-600 text-sm hover:underline"
          >
            Open Fee Page →
          </Link>
        </div>
        {(() => {
          const bucket = feeData?.semesters?.find(
            (b) => b.semester.id === application.semester?.id,
          );
          if (!bucket || bucket.fees.length === 0) {
            return (
              <p className="text-sm text-gray-400">
                No fee entries yet for this semester.
              </p>
            );
          }
          return (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fee Type</th>
                    <th>Amount</th>
                    <th>Paid Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bucket.fees.map((f) => (
                    <tr key={f.id}>
                      <td className="capitalize">{f.feeType}</td>
                      <td>Rs {Number(f.amount).toLocaleString()}</td>
                      <td>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${f.paidStatus === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {f.paidStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm font-medium text-primary-700 mt-2">
                Semester Total: Rs {bucket.semesterTotal.toLocaleString()}
              </p>
            </>
          );
        })()}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Audit Trail</h2>
        <div className="space-y-2">
          {actions.length === 0 && (
            <p className="text-sm text-gray-400">No actions recorded yet.</p>
          )}
          {actions.map((a) => (
            <div
              key={a.id}
              className={`text-sm border-l-4 pl-3 py-1 ${a.isDeleted ? "border-red-300 text-gray-400" : "border-primary-300"}`}
            >
              <p className="font-medium">
                {a.actionType} {a.title ? `— ${a.title}` : ""}{" "}
                {a.amount ? `(Rs ${Number(a.amount).toLocaleString()})` : ""}
              </p>
              {a.description && (
                <p className="text-gray-500">{a.description}</p>
              )}
              <p className="text-xs text-gray-400">
                {a.performedBy?.name} ({a.performedByRole}) ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {isReviewer &&
        application.status !== "Accepted" &&
        application.status !== "Rejected" && (
          <div className="card">
            <h2 className="font-semibold mb-3">Final Decision</h2>
            <textarea
              className="input mb-3"
              placeholder="Reason (optional, shown to student on rejection)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              {application.status === "UnderReview" &&
                user?.role !== "Manager" && (
                  <button
                    className="btn-secondary"
                    onClick={() => markDone(id)}
                  >
                    Mark My Part Done
                  </button>
                )}
              <button
                className="btn-primary bg-green-600 hover:bg-green-700"
                onClick={() => handleDecide("Accepted")}
              >
                Accept
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDecide("Rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
