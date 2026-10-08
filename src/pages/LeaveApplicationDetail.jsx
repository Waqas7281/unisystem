import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  useGetLeaveApplicationQuery,
  useDecideLeaveApplicationMutation,
  getErrorMessage,
} from "../app/api";
import { LEAVE_STATUS_COLORS } from "./LeaveApplications";

const APPROVER_ROLES = ["RecordRoom", "Manager", "Registrar"];

const Field = ({ label, value, highlight }) => (
  <div>
    <p className="text-gray-400">{label}</p>
    <p className={`font-medium ${highlight || ""}`}>{value ?? "—"}</p>
  </div>
);

export default function LeaveApplicationDetail() {
  const { id } = useParams();
  const user = useSelector((state) => state.auth.user);

  const { data: leave, isLoading, isError } = useGetLeaveApplicationQuery(id);
  const [decideLeave, { isLoading: deciding }] =
    useDecideLeaveApplicationMutation();

  const [remarks, setRemarks] = useState("");
  // null = user ne kuch type nahi kiya, requested days default dikhte hain
  const [approvedDays, setApprovedDays] = useState(null);

  if (isLoading) return <p className="text-gray-400">Loading…</p>;

  if (isError || !leave) {
    return (
      <div className="space-y-3">
        <p className="text-gray-500">Leave application not found.</p>
        <Link to="/leave-applications" className="text-primary-600 text-sm">
          ← Back
        </Link>
      </div>
    );
  }

  const canDecide =
    APPROVER_ROLES.includes(user?.role) && leave.status === "Pending";
  const daysValue = approvedDays ?? leave.days;

  const handleApprove = async () => {
    const n = Number(daysValue);
    if (!daysValue || !Number.isInteger(n) || n < 1)
      return toast.error("Approved days likhna zaroori hai (kam az kam 1)");
    if (n > leave.days)
      return toast.error(
        `Approved days requested days (${leave.days}) se zyada nahi ho sakte`,
      );
    try {
      await decideLeave({
        id: leave.id,
        status: "Approved",
        approvedDays: n,
        remarks: remarks.trim(),
      }).unwrap();
      toast.success(`Leave approve ho gayi — ${n} din`);
      setRemarks("");
      setApprovedDays(null);
    } catch (err) {
      toast.error(getErrorMessage(err?.data) || "Approve nahi ho saki");
    }
  };

  const handleReject = async () => {
    if (!remarks.trim())
      return toast.error("Reject karne par remarks likhna zaroori hai");
    try {
      await decideLeave({
        id: leave.id,
        status: "Rejected",
        remarks: remarks.trim(),
      }).unwrap();
      toast.success("Leave reject ho gayi");
      setRemarks("");
    } catch (err) {
      toast.error(getErrorMessage(err?.data) || "Reject nahi ho saki");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <Link
        to="/leave-applications"
        className="text-primary-600 text-sm hover:underline"
      >
        ← Back to Leave Applications
      </Link>

      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{leave.title}</h1>
            <p className="text-sm text-gray-400">
              Applied on {leave.appliedOn}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full ${LEAVE_STATUS_COLORS[leave.status]}`}
          >
            {leave.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 text-sm">
          <Field label="Student" value={leave.studentName} />
          <Field label="Enrollment No" value={leave.enrollmentNumber} />
          <Field label="Department" value={leave.program} />
          <Field label="From" value={leave.fromDate} />
          <Field label="To" value={leave.toDate} />
          <Field label="Requested Days" value={leave.days} />
          <Field
            label="Approved Days"
            value={leave.status === "Approved" ? leave.approvedDays : "—"}
            highlight={leave.status === "Approved" ? "text-green-700" : ""}
          />
          <Field
            label="Decided By"
            value={
              leave.decidedBy
                ? `${leave.decidedBy} (${leave.decidedByRole})`
                : "—"
            }
          />
          <Field
            label="Created By"
            value={`${leave.createdByName} (${leave.createdByRole})`}
          />
        </div>

        <div className="mt-4 text-sm">
          <p className="text-gray-400">Reason</p>
          <p className="whitespace-pre-wrap">{leave.reason}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Status History</h2>
        <ol className="space-y-3 text-sm border-l-2 border-gray-200 pl-4">
          <li>
            <p className="font-medium">Application created</p>
            <p className="text-xs text-gray-400">
              by {leave.createdByName} · {leave.appliedOn} · {leave.days} day(s)
              requested
            </p>
          </li>
          {leave.decidedBy ? (
            <li>
              <p className="font-medium">
                {leave.status} by {leave.decidedBy} ({leave.decidedByRole})
                {leave.status === "Approved" &&
                  ` — ${leave.approvedDays} day(s) approved`}
              </p>
              <p className="text-xs text-gray-400">{leave.decidedOn}</p>
              {leave.remarks && (
                <p className="mt-1 text-gray-600">“{leave.remarks}”</p>
              )}
            </li>
          ) : (
            <li className="text-gray-400">
              Waiting for Record Room / Manager / Registrar…
            </li>
          )}
        </ol>
      </div>

      {canDecide && (
        <div className="card">
          <h2 className="font-semibold mb-3">Decision</h2>

          <div className="mb-3 max-w-[200px]">
            <label className="text-sm text-gray-500">
              Approved Days (max {leave.days})
            </label>
            <input
              type="number"
              min={1}
              max={leave.days}
              className="input"
              value={daysValue}
              onChange={(e) => setApprovedDays(e.target.value)}
            />
          </div>

          <textarea
            rows={3}
            className="input mb-3"
            placeholder="Remarks (reject karne par zaroori)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              className="btn-primary"
              onClick={handleApprove}
              disabled={deciding}
            >
              Approve
            </button>
            <button
              className="btn-danger"
              onClick={handleReject}
              disabled={deciding}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
