import { useState } from "react";
import { toast } from "react-toastify";
import {
  useLazyGetStudentByEnrollmentQuery,
  useGetSemestersQuery,
  useCreateApplicationMutation,
  useAddApplicationActionMutation,
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
  "Custom",
];

export default function CreateApplication() {
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [triggerLookup, { data: student, isFetching, isError }] =
    useLazyGetStudentByEnrollmentQuery();
  const { data: semesters = [] } = useGetSemestersQuery(student?.id, {
    skip: !student?.id,
  });
  const [createApplication, { isLoading }] = useCreateApplicationMutation();
  const [addAction] = useAddApplicationActionMutation();
  const [semesterId, setSemesterId] = useState("");
  const [form, setForm] = useState({ title: "", description: "" });
  const [addFineNow, setAddFineNow] = useState(false);
  const [fineForm, setFineForm] = useState({
    actionType: "Fine",
    title: "",
    description: "",
    amount: "",
  });

  const handleLookup = (e) => {
    e.preventDefault();
    if (!enrollmentNumber.trim()) return;
    setSemesterId("");
    triggerLookup(enrollmentNumber.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student) return toast.error("Look up a valid student first");
    if (!semesterId)
      return toast.error("Select the semester this application is for");
    if (addFineNow && !fineForm.amount)
      return toast.error('Enter a fine amount, or turn off "Add fine now"');
    try {
      const app = await createApplication({
        enrollmentNumber: student.enrollmentNumber,
        semesterId,
        ...form,
      }).unwrap();

      if (addFineNow && fineForm.amount) {
        await addAction({
          id: app.id,
          actionType: fineForm.actionType,
          title: fineForm.title || undefined,
          description: fineForm.description || undefined,
          amount: Number(fineForm.amount),
        }).unwrap();
        toast.success(
          `Application created and fine of Rs ${fineForm.amount} posted to the fee ledger`,
        );
      } else {
        toast.success("Application created with status Pending");
      }

      setForm({ title: "", description: "" });
      setEnrollmentNumber("");
      setSemesterId("");
      setAddFineNow(false);
      setFineForm({
        actionType: "Fine",
        title: "",
        description: "",
        amount: "",
      });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create application");
    }
  };

  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="text-xl font-bold">Create Application</h1>

      <div className="card">
        <h2 className="font-semibold mb-3">Step 1 — Find Student</h2>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            className="input"
            placeholder="Roll Number / Enrollment Number"
            value={enrollmentNumber}
            onChange={(e) => setEnrollmentNumber(e.target.value)}
          />
          <button className="btn-primary" disabled={isFetching}>
            {isFetching ? "Searching…" : "Search"}
          </button>
        </form>
        {isError && (
          <p className="text-sm text-red-600 mt-2">
            Student not found — application creation blocked. Ask
            Manager/Accounts Manager to add the student first.
          </p>
        )}
        {student && (
          <div className="mt-3 bg-primary-50 rounded-lg p-3 text-sm">
            <p>
              <b>Name:</b> {student.name}
            </p>
            <p>
              <b>Enrollment #:</b> {student.enrollmentNumber}
            </p>
            <p>
              <b>Email:</b> {student.email || "—"}
            </p>
          </div>
        )}
      </div>

      {student && (
        <div className="card">
          <h2 className="font-semibold mb-3">Step 2 — Select Semester</h2>
          <select
            className="input"
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
          >
            <option value="">
              Select the semester this application is for…
            </option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {semesters.length === 0 && (
            <p className="text-sm text-gray-400 mt-2">
              No semesters found for this student yet.
            </p>
          )}
        </div>
      )}

      {student && semesterId && (
        <div className="card">
          <h2 className="font-semibold mb-3">Step 3 — Application Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              className="input"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="input"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={addFineNow}
                onChange={(e) => setAddFineNow(e.target.checked)}
              />
              Add a fine now (e.g. late fee, attendance DC/UMC)
            </label>

            {addFineNow && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p className="text-xs text-gray-400">
                  This amount will automatically post to the fee ledger for{" "}
                  <b>{semesters.find((s) => s.id === semesterId)?.label}</b>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <select
                    className="input"
                    value={fineForm.actionType}
                    onChange={(e) =>
                      setFineForm({ ...fineForm, actionType: e.target.value })
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
                    type="number"
                    placeholder="Fine Amount"
                    value={fineForm.amount}
                    onChange={(e) =>
                      setFineForm({ ...fineForm, amount: e.target.value })
                    }
                  />
                </div>
                <input
                  className="input"
                  placeholder="Fine Title (optional)"
                  value={fineForm.title}
                  onChange={(e) =>
                    setFineForm({ ...fineForm, title: e.target.value })
                  }
                />
                <textarea
                  className="input"
                  placeholder="Fine Description (optional)"
                  value={fineForm.description}
                  onChange={(e) =>
                    setFineForm({ ...fineForm, description: e.target.value })
                  }
                />
              </div>
            )}

            <button className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
