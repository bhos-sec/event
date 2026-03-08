"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (err: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const html5Qr = new Html5Qrcode("qr-reader");
    scannerRef.current = html5Qr;

    html5Qr
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5Qr.stop();
          onScan(decodedText);
        },
        () => {}
      )
      .then(() => {
        setReady(true);
        setError(null);
      })
      .catch((err: Error) => {
        setError(err.message || "Camera access denied");
        onError?.(err.message);
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
      scannerRef.current = null;
    };
  }, [onScan, onError]);

  return (
    <div className="space-y-2">
      <div
        id="qr-reader"
        ref={containerRef}
        className={`overflow-hidden rounded-xl border border-slate-700 ${
          ready ? "" : "min-h-[250px] bg-slate-800"
        }`}
      />
      {error && (
        <p className="text-sm text-amber-400">
          {error} — Use manual token entry instead.
        </p>
      )}
    </div>
  );
}
