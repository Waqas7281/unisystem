import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLazyGetSlipBySerialQuery, useSearchSlipsQuery } from "../app/api";
import SlipPrintCard, {
  printSlip,
  SLIP_TITLE_OPTIONS,
} from "../components/SlipPrintCard";

const PAGE_SIZE = 10;

// Turns any slip row — whether it came from the serial-number box or from
// the filtered/recent list — into the exact shape SlipPrintCard expects.
function toPreviewSlip(slip) {
  return {
    title: slip.title,
    sessionType: slip.sessionType,
    sessionYear: slip.sessionYear,
    rollNo: slip.rollNo,
    program: slip.program,
    amount: slip.amount,
    preparedBy: slip.preparedBy,
    extra: slip.extra || {},
    serialNumber: slip.serialNumber,
  };
}

export default function SlipLookup() {
  // AccountsManager role: View/Print button stays hidden on this page
  // (frontend-only restriction — nothing changed on the backend).
  const user = useSelector((state) => state.auth.user);
  const canPrint = user?.role !== "AccountsManager";

  // ---- Exact serial number box (unchanged) ----
  const [serialInput, setSerialInput] = useState("");
  const [triggerBySerial, { data: serialSlip, isFetching, isError, error }] =
    useLazyGetSlipBySerialQuery();

  const handleSearchBySerial = (e) => {
    e.preventDefault();
    const num = serialInput.trim();
    if (!num) return;
    triggerBySerial(num);
  };

  // ---- Enrollment / Name / Type filters + Recent Slips (paginated) ----
  // This is how a lost/misplaced slip's EXISTING serial number is found
  // again — so a child's already-issued slip gets re-printed instead of
  // Data Entry accidentally generating a brand new serial for the same
  // fine/fee.
  const [filtersInput, setFiltersInput] = useState({
    enrollmentNumber: "",
    name: "",
    title: "",
  });
  const [filters, setFilters] = useState(filtersInput);
  const [page, setPage] = useState(1);

  // Debounce: wait a moment after typing stops before hitting the API,
  // instead of firing a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(filtersInput);
      setPage(1); // a changed filter always restarts from page 1
    }, 350);
    return () => clearTimeout(t);
  }, [filtersInput]);

  const {
    data: listData,
    isFetching: isListFetching,
    isError: isListError,
  } = useSearchSlipsQuery({ ...filters, page, limit: PAGE_SIZE });

  const items = listData?.items || [];
  const total = listData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Whichever slip the user is currently looking at (from either box).
  const [selected, setSelected] = useState(null);
  const previewSlip = selected
    ? toPreviewSlip(selected)
    : serialSlip
      ? toPreviewSlip(serialSlip)
      : null;

  return (
    <div className="space-y-5">
      <div className="card">
        <h1 className="text-xl font-bold mb-3">Search Slip by Serial Number</h1>
        <form onSubmit={handleSearchBySerial} className="flex flex-wrap gap-2">
          <input
            className="input max-w-xs"
            placeholder="Slip Serial Number e.g. 145"
            type="number"
            value={serialInput}
            onChange={(e) => setSerialInput(e.target.value)}
          />
          <button className="btn-primary" disabled={isFetching}>
            {isFetching ? "Searching…" : "Search"}
          </button>
        </form>
        {isError && (
          <p className="text-red-600 text-sm mt-2">
            {error?.data?.message || "No slip found with this serial number"}
          </p>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="text-lg font-bold">
          Find a Slip by Enrollment / Name / Type
        </h2>
        <p className="text-sm text-gray-500">
          Slip kho jaye ya misplace ho jaye to yahan se uski current serial
          number dhoondh kar dobara print karein — nayi serial generate karne ki
          zarurat nahi.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className="input"
            placeholder="Enrollment Number"
            value={filtersInput.enrollmentNumber}
            onChange={(e) =>
              setFiltersInput((f) => ({
                ...f,
                enrollmentNumber: e.target.value,
              }))
            }
          />
          <input
            className="input"
            placeholder="Student Name"
            value={filtersInput.name}
            onChange={(e) =>
              setFiltersInput((f) => ({ ...f, name: e.target.value }))
            }
          />
          <select
            className="input"
            value={filtersInput.title}
            onChange={(e) =>
              setFiltersInput((f) => ({ ...f, title: e.target.value }))
            }
          >
            <option value="">All Slip Types</option>
            {SLIP_TITLE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {(filtersInput.enrollmentNumber ||
            filtersInput.name ||
            filtersInput.title) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setFiltersInput({ enrollmentNumber: "", name: "", title: "" })
              }
            >
              Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3">Serial #</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Enrollment No</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Session</th>
                <th className="py-2 pr-3">Issued</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">
                    {String(row.serialNumber).padStart(6, "0")}
                  </td>
                  <td className="py-2 pr-3">{row.title}</td>
                  <td className="py-2 pr-3">
                    {row.student?.enrollmentNumber || row.rollNo || "—"}
                  </td>
                  <td className="py-2 pr-3">{row.student?.name || "—"}</td>
                  <td className="py-2 pr-3">
                    {row.sessionType} {row.sessionYear}
                  </td>
                  <td className="py-2 pr-3">
                    {row.issuedAt
                      ? new Date(row.issuedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {canPrint && (
                      <button
                        className="btn-secondary"
                        onClick={() => setSelected(row)}
                      >
                        View / Print
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isListFetching && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-400">
                    No slips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isListError && (
          <p className="text-red-600 text-sm">Failed to load slips.</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">
            {total} slip{total === 1 ? "" : "s"} total
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {previewSlip && canPrint && (
        <SlipPrintCard
          slip={previewSlip}
          onPrint={() => printSlip(previewSlip)}
          onClose={() => setSelected(null)}
        />
      )}
      {previewSlip && !canPrint && (
        <p className="text-sm text-gray-400">
          Aapke role ke liye is page par print access nahi hai.
        </p>
      )}
    </div>
  );
}
