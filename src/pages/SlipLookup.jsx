import { useState } from "react";
import { useLazyGetSlipBySerialQuery } from "../app/api";
import SlipPrintCard from "../components/SlipPrintCard";

export default function SlipLookup() {
  const [serialInput, setSerialInput] = useState("");
  const [trigger, { data: slip, isFetching, isError, error }] =
    useLazyGetSlipBySerialQuery();

  const handleSearch = (e) => {
    e.preventDefault();
    const num = serialInput.trim();
    if (!num) return;
    trigger(num);
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <h1 className="text-xl font-bold mb-3">Search Slip by Serial Number</h1>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
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

      {slip && (
        <SlipPrintCard
          slip={{
            title: slip.title,
            sessionType: slip.sessionType,
            sessionYear: slip.sessionYear,
            rollNo: slip.rollNo,
            program: slip.program,
            amount: slip.amount,
            preparedBy: slip.preparedBy,
            extra: slip.extra || {},
            serialNumber: slip.serialNumber,
          }}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
}
