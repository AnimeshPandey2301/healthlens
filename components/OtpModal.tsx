"use client";

import { useState, useRef, useEffect } from "react";
import { X, Phone, ShieldCheck, RotateCcw, Loader2 } from "lucide-react";

type Props = {
  phone: string;
  onVerified: () => void;
  onClose: () => void;
};

export default function OtpModal({ phone, onVerified, onClose }: Props) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-send OTP on mount
  useEffect(() => {
    sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendOtp = async () => {
    setSending(true);
    setError("");
    setDevOtp("");
    setDigits(["", "", "", "", "", ""]);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send OTP"); return; }
      setResendCooldown(30);
      if (data.devOtp) {
        setDevOtp(data.devOtp); // Show OTP in UI when Twilio not configured
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSending(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Verification failed"); return; }
      onVerified();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 relative">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Phone size={24} className="text-teal-600" />
          </div>
          <h2 className="text-lg font-bold text-[#1E3A5F]">Verify Phone Number</h2>
          <p className="text-sm text-gray-500 mt-1">
            We sent a 6-digit OTP to{" "}
            <span className="font-semibold text-gray-700">+91 {phone}</span>
          </p>
        </div>

        {/* Dev mode hint */}
        {devOtp && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-center">
            <p className="text-xs text-amber-600 font-medium">
              ðŸ”§ Dev Mode â€” Your OTP:{" "}
              <span
                className="font-bold text-amber-800 cursor-pointer underline"
                onClick={() => {
                  setDigits(devOtp.split(""));
                  inputRefs.current[5]?.focus();
                }}
              >
                {devOtp}
              </span>
              <span className="text-amber-500"> (click to fill)</span>
            </p>
          </div>
        )}

        {/* OTP input boxes */}
        <div className="flex gap-2 justify-center mb-5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className={`w-11 h-13 text-center text-lg font-bold border-2 rounded-xl outline-none transition-colors py-3 ${
                error
                  ? "border-red-400 bg-red-50"
                  : d
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 focus:border-teal-400"
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-xs text-red-500 mb-4">{error}</p>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={verifying || digits.join("").length < 6}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {verifying ? (
            <><Loader2 size={16} className="animate-spin" /> Verifyingâ€¦</>
          ) : (
            <><ShieldCheck size={16} /> Verify OTP</>
          )}
        </button>

        {/* Resend */}
        <div className="text-center mt-4">
          {sending ? (
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Sending OTPâ€¦
            </p>
          ) : resendCooldown > 0 ? (
            <p className="text-xs text-gray-400">Resend OTP in {resendCooldown}s</p>
          ) : (
            <button
              onClick={sendOtp}
              className="text-xs text-teal-600 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <RotateCcw size={12} /> Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
