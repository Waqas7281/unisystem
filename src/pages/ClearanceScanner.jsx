import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "react-toastify";
import { useVerifyClearanceTokenMutation } from "../app/api";

const SCANNER_ELEMENT_ID = "clearance-scanner-viewport";

export default function ClearanceScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);
  const busyRef = useRef(false); // prevents firing verify multiple times per single scan

  const [verifyToken] = useVerifyClearanceTokenMutation();

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // already stopped, ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleDecoded = async (decodedText) => {
    if (busyRef.current) return;
    busyRef.current = true;
    await stopScanner();

    try {
      const res = await verifyToken(decodedText).unwrap();
      setResult(res);
      if (!res.valid) {
        toast.error(
          res.reason === "expired"
            ? "Slip expired (10 days se zyada purani hai)"
            : "Invalid slip — token nahi mila",
        );
      } else if (res.alreadyScanned) {
        toast.error(`Already scanned today — Roll #: ${res.rollNumber}`);
      } else {
        toast.success(`Verified — Roll #: ${res.rollNumber}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Verification failed");
      setResult({ valid: false, reason: "error" });
    } finally {
      busyRef.current = false;
    }
  };

  const startScanner = async () => {
    setResult(null);
    setScanning(true);
    // Give the DOM a tick to render the viewport div before attaching camera.
    setTimeout(async () => {
      try {
        const html5Qr = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => handleDecoded(decodedText),
          () => {
            // per-frame decode failures are normal while aiming — ignore
          },
        );
      } catch (err) {
        toast.error("Camera access nahi mila — browser permissions check karo");
        setScanning(false);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold dark:text-gray-100">
        Scan Clearance Slip
      </h1>

      <div className="card space-y-4">
        {!scanning && (
          <button className="btn-primary w-full" onClick={startScanner}>
            📷 Start Camera
          </button>
        )}

        {scanning && (
          <>
            <div
              id={SCANNER_ELEMENT_ID}
              className="rounded-lg overflow-hidden"
            />
            <button className="btn-secondary w-full" onClick={stopScanner}>
              Stop Camera
            </button>
          </>
        )}

        {result && (
          <div
            className={`rounded-lg p-4 text-center ${
              !result.valid
                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                : result.alreadyScanned
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            }`}
          >
            {!result.valid && (
              <p className="font-semibold">
                {result.reason === "expired"
                  ? "❌ Slip Expired"
                  : result.reason === "error"
                    ? "❌ Verification Error"
                    : "❌ Invalid Slip"}
              </p>
            )}
            {result.valid && result.alreadyScanned && (
              <>
                <p className="font-semibold">⚠️ Already Scanned Today</p>
                <p className="text-lg font-bold mt-1">
                  Roll #: {result.rollNumber}
                </p>
                <p className="text-sm">{result.name}</p>
              </>
            )}
            {result.valid && !result.alreadyScanned && (
              <>
                <p className="font-semibold">✅ Verified</p>
                <p className="text-lg font-bold mt-1">
                  Roll #: {result.rollNumber}
                </p>
                <p className="text-sm">{result.name}</p>
              </>
            )}
            <button className="btn-secondary mt-3" onClick={startScanner}>
              Scan Another
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Har slip din mein sirf ek baar successfully scan hoti hai. Dobara try
        karne par "Already Scanned" dikhega, roll number ke saath.
      </p>
    </div>
  );
}
