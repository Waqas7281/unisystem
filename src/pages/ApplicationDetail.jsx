import { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  useGetApplicationQuery,
  useAddApplicationActionMutation,
  useAssignApplicationStageMutation,
  useAcceptApplicationStageMutation,
  useRaiseApplicationIssueMutation,
  useResolveApplicationIssueMutation,
  useDecideApplicationMutation,
  useGetUsersQuery,
  useGetStudentFeesQuery,
  useUpdateApplicationPhotoMutation,
  useUpdateApplicationMutation,
  useCreateSlipMutation,
} from "../app/api";
import SlipPrintCard, {
  SLIP_TITLE_OPTIONS,
  SESSION_TYPES,
} from "../components/SlipPrintCard";

const MAX_PHOTO_BYTES = 800 * 1024; // 800KB cap, matches backend check

// Same compression approach as CreateApplication.jsx — resizes/re-encodes a
// photo (e.g. straight from a phone camera, several MB) down to a JPEG under
// MAX_PHOTO_BYTES before it's sent as base64.
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read the image"));
      img.onload = () => {
        let { width, height } = img;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const tryEncode = (w, h, quality) => {
          canvas.width = w;
          canvas.height = h;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          return canvas.toDataURL("image/jpeg", quality);
        };

        let maxDim = 2000;
        let quality = 0.9;
        let dataUrl = "";

        for (let attempt = 0; attempt < 12; attempt++) {
          const scale = Math.min(1, maxDim / Math.max(width, height));
          const w = Math.round(width * scale);
          const h = Math.round(height * scale);
          dataUrl = tryEncode(w, h, quality);

          const approxBytes = Math.floor((dataUrl.length * 3) / 4);
          if (approxBytes <= MAX_PHOTO_BYTES) break;

          if (quality > 0.5) {
            quality -= 0.1;
          } else {
            maxDim = Math.round(maxDim * 0.8);
            quality = 0.7;
          }
        }

        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

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
    skip: !["Manager", "Registrar"].includes(user?.role),
  });
  const [addAction] = useAddApplicationActionMutation();
  const [assignStage, { isLoading: assigningStage }] =
    useAssignApplicationStageMutation();
  const [acceptStage, { isLoading: acceptingStage }] =
    useAcceptApplicationStageMutation();
  const [raiseIssue, { isLoading: raisingIssue }] =
    useRaiseApplicationIssueMutation();
  const [resolveIssue] = useResolveApplicationIssueMutation();
  const [decide] = useDecideApplicationMutation();
  const [updatePhoto, { isLoading: photoSaving }] =
    useUpdateApplicationPhotoMutation();
  const [updateApplication] = useUpdateApplicationMutation();
  const [createSlip, { isLoading: slipSaving }] = useCreateSlipMutation();

  const [actionForm, setActionForm] = useState({
    actionType: "Fine",
    title: "",
    description: "",
    amount: "",
    slipTitle: SLIP_TITLE_OPTIONS[0],
    sessionType: "Fall",
    sessionYear: new Date().getFullYear(),
  });
  const [slip, setSlip] = useState(null);
  // One pending "person to assign" selection per stage (1, 2, 3).
  const [stageAssignTo, setStageAssignTo] = useState({ 1: "", 2: "", 3: "" });
  const [reason, setReason] = useState("");
  const [issueMessage, setIssueMessage] = useState("");
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const photoInputRef = useRef(null);
  const [editingApp, setEditingApp] = useState(false);
  const [appEditForm, setAppEditForm] = useState({
    title: "",
    description: "",
  });

  // Base reviewer roles can act on an application before it's been assigned
  // to anyone. Department roles (Record Room, Exam, …) never appear here —
  // they only ever get access once something is explicitly assigned to them.
  const baseReviewerRoles = [
    "Manager",
    "AccountsManager",
    "StudentAffair",
    "Registrar",
  ];
  const isBaseReviewer = baseReviewerRoles.includes(user?.role);
  const isDataEntry = user?.role === "DataEntry";
  const canManagerAssign = ["Manager", "Registrar"].includes(user?.role);
  // Same roles that are allowed to create applications can also edit the
  // proof photo afterward — Data Entry loses this once a reviewer has
  // locked the application (same rule as adding actions).
  const canManagePhoto = ["DataEntry", "Manager", "Registrar"].includes(
    user?.role,
  );

  if (isLoading) return <p className="text-gray-400 text-sm">Loading…</p>;
  if (!data) return null;
  const { application, actions, assignments = [], issues = [] } = data;
  const isFinal =
    application.status === "Accepted" || application.status === "Rejected";
  const stageRow = (n) => assignments.find((a) => a.stage === n);
  // The one stage currently "in progress" (assigned but not yet accepted).
  // undefined means either nothing assigned yet, or every assigned stage so
  // far has been accepted.
  const currentAssignment = assignments.find((a) => !a.accepted);
  const isCurrentAssignee =
    !!currentAssignment && currentAssignment.assignedTo?.id === user?.id;
  // IMPORTANT: only fall back to "any base reviewer role" when the
  // application has NEVER been assigned at all (assignments.length === 0).
  // Once at least one stage has been assigned, only the exact current
  // assignee has review access — this used to fall back to isBaseReviewer
  // whenever currentAssignment was undefined for ANY reason (including a
  // data hiccup), which silently locked out non-base-reviewer roles like
  // Exam/RecordRoom at stage 2/3 while base-reviewer-role assignees could
  // slip through at the wrong time.
  const canReview =
    assignments.length > 0
      ? !!currentAssignment && currentAssignment.assignedTo?.id === user?.id
      : isBaseReviewer;
  const canAddAction = canReview || (isDataEntry && !application.locked);
  const canEditPhoto = canManagePhoto && !(isDataEntry && application.locked);
  // Data Entry can edit the application's own title/description only until
  // a reviewer touches it — `locked` flips true the moment either a
  // reviewer adds an action or the application gets assigned, which is
  // exactly the "still pending, not yet assigned" window requested.
  const canEditApplication = isDataEntry && !application.locked;
  const openIssues = issues.filter((i) => !i.resolved);
  const hasOpenIssue = openIssues.length > 0;

  // Stage N can be assigned by Manager/Registrar only if: it hasn't already
  // been accepted, and (for stage 2/3) the previous stage HAS been accepted.
  const canAssignStage = (n) => {
    if (isFinal || !canManagerAssign) return false;
    const row = stageRow(n);
    if (row?.accepted) return false;
    if (n === 1) return true;
    const prev = stageRow(n - 1);
    return !!prev?.accepted;
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setPhotoProcessing(true);
    try {
      const compressed = await compressImageFile(file);
      const approxKb = Math.round((compressed.length * 3) / 4 / 1024);
      if (approxKb > 800) {
        toast.error(
          "Could not compress this image under 800KB — try a different photo",
        );
      } else {
        setNewPhotoPreview(compressed);
      }
    } catch {
      toast.error("Failed to process the image");
    } finally {
      setPhotoProcessing(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!newPhotoPreview) return;
    try {
      await updatePhoto({
        id: application.id,
        photoBase64: newPhotoPreview,
        photoMimeType: "image/jpeg",
      }).unwrap();
      toast.success("Photo updated");
      setEditingPhoto(false);
      setNewPhotoPreview(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update photo");
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updatePhoto({
        id: application.id,
        photoBase64: null,
      }).unwrap();
      toast.success("Photo removed");
      setEditingPhoto(false);
      setNewPhotoPreview(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to remove photo");
    }
  };

  const cancelPhotoEdit = () => {
    setEditingPhoto(false);
    setNewPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const startEditApp = () => {
    setAppEditForm({
      title: application.title || "",
      description: application.description || "",
    });
    setEditingApp(true);
  };

  const handleSaveAppEdit = async () => {
    try {
      await updateApplication({ id, ...appEditForm }).unwrap();
      toast.success("Application updated");
      setEditingApp(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update application");
    }
  };

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
      if (actionForm.amount) {
        setSlip({
          title: actionForm.slipTitle,
          sessionType: actionForm.sessionType,
          sessionYear: actionForm.sessionYear,
          rollNo: application.student?.enrollmentNumber,
          program: application.student?.program,
          amount: actionForm.amount,
          preparedBy: user?.name,
          extra: {},
        });
      }
      setActionForm({
        actionType: "Fine",
        title: "",
        description: "",
        amount: "",
        slipTitle: SLIP_TITLE_OPTIONS[0],
        sessionType: "Fall",
        sessionYear: new Date().getFullYear(),
      });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add action");
    }
  };

  const handlePrintSlip = async () => {
    if (!slip) return;
    if (slip.serialNumber) {
      window.print();
      return;
    }
    try {
      const saved = await createSlip({
        applicationId: application.id,
        studentId: application.student?.id,
        title: slip.title,
        sessionType: slip.sessionType,
        sessionYear: slip.sessionYear,
        rollNo: slip.rollNo,
        program: slip.program,
        amount: slip.amount,
        preparedBy: slip.preparedBy,
        extra: slip.extra,
      }).unwrap();
      setSlip((prev) => ({ ...prev, serialNumber: saved.serialNumber }));
      toast.success(`Slip #${saved.serialNumber} saved`);
      setTimeout(() => window.print(), 50);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save slip");
    }
  };

  const handleAssignStage = async (stageNum) => {
    const uid = stageAssignTo[stageNum];
    if (!uid) return;
    const targetUser = users.find((u) => u.id === uid);
    try {
      await assignStage({
        id,
        stage: stageNum,
        assignedToUserId: uid,
        assignedRole: targetUser?.role,
      }).unwrap();
      toast.success(`Stage ${stageNum} assigned to ${targetUser?.name}`);
      setStageAssignTo((prev) => ({ ...prev, [stageNum]: "" }));
    } catch (err) {
      toast.error(err?.data?.message || "Failed to assign stage");
    }
  };

  const handleAcceptStage = async () => {
    try {
      await acceptStage(id).unwrap();
      toast.success(
        currentAssignment?.stage >= 3
          ? "Final stage accepted — application marked Accepted"
          : `Stage ${currentAssignment?.stage} accepted — ready for the next assignment`,
      );
    } catch (err) {
      toast.error(err?.data?.message || "Failed to accept stage");
    }
  };

  const handleRaiseIssue = async (e) => {
    e.preventDefault();
    if (!issueMessage.trim()) return;
    try {
      await raiseIssue({ id, message: issueMessage.trim() }).unwrap();
      toast.success(
        "Issue raised — application can't move forward until it's cleared",
      );
      setIssueMessage("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to raise issue");
    }
  };

  const handleResolveIssue = async (issueId) => {
    try {
      await resolveIssue(issueId).unwrap();
      toast.success("Issue cleared");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to clear issue");
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
          {editingApp ? (
            <div className="flex-1 space-y-2">
              <input
                className="input font-bold"
                value={appEditForm.title}
                onChange={(e) =>
                  setAppEditForm({ ...appEditForm, title: e.target.value })
                }
              />
              <textarea
                className="input text-sm"
                value={appEditForm.description}
                onChange={(e) =>
                  setAppEditForm({
                    ...appEditForm,
                    description: e.target.value,
                  })
                }
              />
              <div className="flex gap-2">
                <button
                  className="btn-primary text-xs"
                  onClick={handleSaveAppEdit}
                >
                  Save
                </button>
                <button
                  className="btn-secondary text-xs"
                  onClick={() => setEditingApp(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold">{application.title}</h1>
              <p className="text-sm text-gray-500">{application.description}</p>
              {canEditApplication && (
                <button
                  className="text-primary-600 text-xs hover:underline mt-1"
                  onClick={startEditApp}
                >
                  ✏️ Edit
                </button>
              )}
            </div>
          )}
          <span className="text-xs px-3 py-1 rounded-full bg-primary-100 text-primary-700">
            {application.status}
          </span>
        </div>

        {(application.photoData || canEditPhoto) && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-1">Proof Photo</p>

            {!editingPhoto && application.photoData && (
              <div className="flex items-start gap-3">
                <a
                  href={`data:${application.photoMimeType || "image/jpeg"};base64,${application.photoData}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={`data:${application.photoMimeType || "image/jpeg"};base64,${application.photoData}`}
                    alt="Application proof"
                    className="w-40 h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90"
                  />
                </a>
                {canEditPhoto && (
                  <div className="flex flex-col gap-2">
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => setEditingPhoto(true)}
                    >
                      Change Photo
                    </button>
                    <button
                      className="text-red-600 text-xs hover:underline"
                      onClick={handleRemovePhoto}
                      disabled={photoSaving}
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>
            )}

            {!editingPhoto && !application.photoData && canEditPhoto && (
              <button
                className="btn-secondary text-xs"
                onClick={() => setEditingPhoto(true)}
              >
                + Add Photo
              </button>
            )}

            {editingPhoto && (
              <div className="space-y-2">
                {!newPhotoPreview && (
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="input"
                    disabled={photoProcessing}
                    onChange={handlePhotoFileChange}
                  />
                )}
                {photoProcessing && (
                  <p className="text-xs text-gray-400">Processing photo…</p>
                )}
                {newPhotoPreview && (
                  <img
                    src={newPhotoPreview}
                    alt="New proof preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                )}
                <div className="flex gap-2">
                  {newPhotoPreview && (
                    <button
                      className="btn-primary text-xs"
                      onClick={handleSavePhoto}
                      disabled={photoSaving}
                    >
                      {photoSaving ? "Saving…" : "Save Photo"}
                    </button>
                  )}
                  <button
                    className="btn-secondary text-xs"
                    onClick={cancelPhotoEdit}
                    disabled={photoSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
      </div>

      <div className="card">
        <h2 className="font-semibold mb-1">Assignment Workflow</h2>
        <p className="text-xs text-gray-400 mb-3">
          Application moves through up to 3 departments in order — a stage can
          only be assigned once the one before it has been accepted.
        </p>
        <div className="space-y-3">
          {[1, 2, 3].map((n) => {
            const row = stageRow(n);
            return (
              <div
                key={n}
                className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Stage {n}
                </span>
                {row ? (
                  <span className="text-sm">
                    <span className="font-medium">{row.assignedTo?.name}</span>{" "}
                    <span className="text-gray-400">({row.assignedRole})</span>{" "}
                    {row.accepted ? (
                      <span className="text-green-600 text-xs font-medium">
                        ✓ Accepted
                      </span>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">
                        Pending acceptance
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">
                    Not assigned yet
                  </span>
                )}
                {canAssignStage(n) && (
                  <div className="flex flex-wrap gap-2 ml-auto">
                    <select
                      className="input w-auto"
                      value={stageAssignTo[n]}
                      onChange={(e) =>
                        setStageAssignTo({
                          ...stageAssignTo,
                          [n]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select person…</option>
                      {users
                        .filter((u) => u.id !== application.createdBy?.id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                    </select>
                    <button
                      className="btn-primary text-xs"
                      onClick={() => handleAssignStage(n)}
                      disabled={assigningStage || !stageAssignTo[n]}
                    >
                      {row ? "Reassign" : "Assign"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
              <select
                className="input"
                value={actionForm.slipTitle}
                onChange={(e) =>
                  setActionForm({ ...actionForm, slipTitle: e.target.value })
                }
                title="Slip Title — jo bhi slip generate karni hai wo select karo"
              >
                {SLIP_TITLE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={actionForm.sessionType}
                onChange={(e) =>
                  setActionForm({ ...actionForm, sessionType: e.target.value })
                }
                title="Slip ke liye session (Fall/Spring/Summer) manually select karo"
              >
                {SESSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                placeholder="Year"
                value={actionForm.sessionYear}
                onChange={(e) =>
                  setActionForm({ ...actionForm, sessionYear: e.target.value })
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

      {slip && (
        <SlipPrintCard
          slip={slip}
          onChange={setSlip}
          onClose={() => setSlip(null)}
          onPrint={handlePrintSlip}
          printing={slipSaving}
        />
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
              className={`text-sm border-l-4 pl-3 py-1 flex items-center justify-between gap-3 ${a.isDeleted ? "border-red-300 text-gray-400" : "border-primary-300"}`}
            >
              <div>
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
              {a.amount && !a.isDeleted && (
                <button
                  className="btn-secondary text-xs whitespace-nowrap"
                  onClick={() =>
                    setSlip({
                      title: a.actionType,
                      sessionType: "Fall",
                      sessionYear: new Date().getFullYear(),
                      rollNo: application.student?.enrollmentNumber,
                      program: application.student?.program,
                      amount: a.amount,
                      preparedBy: a.performedBy?.name || user?.name,
                      extra: {},
                    })
                  }
                >
                  🖨️ Generate Slip
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-1">Issue Box</h2>
        <p className="text-xs text-gray-400 mb-3">
          Raised by whoever currently holds the application — visible to every
          department. While any issue below is open, the application can't be
          accepted forward.
        </p>

        {issues.length === 0 && (
          <p className="text-sm text-gray-400 mb-3">No issues raised.</p>
        )}

        <div className="space-y-2 mb-3">
          {issues.map((iss) => (
            <div
              key={iss.id}
              className={`text-sm border-l-4 pl-3 py-2 flex items-start justify-between gap-3 ${
                iss.resolved
                  ? "border-gray-200 text-gray-400"
                  : "border-red-400 bg-red-50"
              }`}
            >
              <div>
                <p className={iss.resolved ? "" : "font-medium text-red-700"}>
                  {iss.message}
                </p>
                <p className="text-xs text-gray-400">
                  {iss.raisedBy?.name} ({iss.raisedByRole}) ·{" "}
                  {new Date(iss.raisedAt).toLocaleString()}
                  {iss.resolved &&
                    ` · Cleared by ${iss.resolvedBy?.name || "—"} on ${new Date(
                      iss.resolvedAt,
                    ).toLocaleString()}`}
                </p>
              </div>
              {!iss.resolved && canReview && (
                <button
                  className="btn-secondary text-xs whitespace-nowrap"
                  onClick={() => handleResolveIssue(iss.id)}
                >
                  Mark Cleared
                </button>
              )}
            </div>
          ))}
        </div>

        {canReview && !isFinal && (
          <form onSubmit={handleRaiseIssue} className="flex flex-wrap gap-2">
            <input
              className="input flex-1 min-w-[200px]"
              placeholder="Describe the issue (e.g. dues not clear, missing document)…"
              value={issueMessage}
              onChange={(e) => setIssueMessage(e.target.value)}
            />
            <button
              type="submit"
              className="btn-secondary"
              disabled={raisingIssue || !issueMessage.trim()}
            >
              Raise Issue
            </button>
          </form>
        )}
      </div>

      {canReview && !isFinal && (
        <div className="card">
          <h2 className="font-semibold mb-3">
            {currentAssignment
              ? `Stage ${currentAssignment.stage} Decision`
              : "Decision"}
          </h2>
          {hasOpenIssue && (
            <p className="text-xs text-red-600 mb-2">
              This application has an unresolved issue — clear it in the Issue
              Box above before accepting.
            </p>
          )}
          <textarea
            className="input mb-3"
            placeholder="Reason (optional, shown to student on rejection)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            {currentAssignment && isCurrentAssignee && (
              <button
                className="btn-primary bg-green-600 hover:bg-green-700"
                onClick={handleAcceptStage}
                disabled={acceptingStage || hasOpenIssue}
                title={hasOpenIssue ? "Clear the open issue first" : undefined}
              >
                {currentAssignment.stage >= 3
                  ? "Accept & Finalize"
                  : `Accept & Forward (Stage ${currentAssignment.stage} → ${currentAssignment.stage + 1})`}
              </button>
            )}
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
