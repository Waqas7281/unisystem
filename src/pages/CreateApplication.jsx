import { useRef, useState } from "react";
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

const MAX_PHOTO_BYTES = 600 * 1024; // 600KB cap, matches backend check

// Loads a File into an <img>, draws it onto a canvas, and re-exports as JPEG,
// shrinking quality first (then dimensions) step by step until the encoded
// size is under MAX_PHOTO_BYTES. Works for any photo straight from a phone
// camera (which are often several MB) without needing any extra library.
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

        // Higher starting dimension since target is 600KB now — keeps more
        // detail before we ever need to shrink the canvas itself.
        let maxDim = 2000;
        let quality = 0.9;
        let dataUrl = "";

        for (let attempt = 0; attempt < 14; attempt++) {
          const scale = Math.min(1, maxDim / Math.max(width, height));
          const w = Math.round(width * scale);
          const h = Math.round(height * scale);
          dataUrl = tryEncode(w, h, quality);

          const approxBytes = Math.floor((dataUrl.length * 3) / 4);
          if (approxBytes <= MAX_PHOTO_BYTES) break;

          if (quality > 0.6) {
            // Drop quality first — sharper result than shrinking dimensions.
            quality -= 0.05;
          } else {
            // Quality floor hit, now shrink dimensions and reset quality.
            maxDim = Math.round(maxDim * 0.85);
            quality = 0.75;
          }
        }

        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

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

  const [photoPreview, setPhotoPreview] = useState(null); // data URL for <img> preview
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleLookup = (e) => {
    e.preventDefault();
    if (!enrollmentNumber.trim()) return;
    setSemesterId("");
    triggerLookup(enrollmentNumber.trim());
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setPhotoUploading(true);
    try {
      const compressed = await compressImageFile(file);
      const approxKb = Math.round((compressed.length * 3) / 4 / 1024);
      if (approxKb > 600) {
        toast.error(
          "Could not compress this image under 600KB — try a different photo",
        );
        setPhotoPreview(null);
      } else {
        setPhotoPreview(compressed);
        toast.success(`Photo attached (~${approxKb}KB)`);
      }
    } catch {
      toast.error("Failed to process the image");
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        ...(photoPreview
          ? { photoBase64: photoPreview, photoMimeType: "image/jpeg" }
          : {}),
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
      removePhoto();
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

            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Proof Photo (optional — auto-compressed to under 600KB)
              </label>
              {!photoPreview && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="input"
                  disabled={photoUploading}
                  onChange={handlePhotoChange}
                />
              )}
              {photoUploading && (
                <p className="text-xs text-gray-400 mt-1">Processing photo…</p>
              )}
              {photoPreview && (
                <div className="mt-2 flex items-start gap-3">
                  <img
                    src={photoPreview}
                    alt="Proof preview"
                    className="w-28 h-28 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={removePhoto}
                  >
                    Remove Photo
                  </button>
                </div>
              )}
            </div>

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
