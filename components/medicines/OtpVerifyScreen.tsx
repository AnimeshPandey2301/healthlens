"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Lock } from "lucide-react";

interface Props {
  phoneNumber: string;
  onVerified: (token: string) => void;
  onBack: () => void;
}

export default function OtpVerifyScreen({ phoneNumber, onVerified, onBack }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60); // start after initial send
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  const refs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  // ── Cooldown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Auto-submit when all 6 digits filled ───────────────────────────────
  useEffect(() => {
    if (digits.every((d) => d !== "") && !isLoading) {
      handleVerify(digits.join(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  // ── Input handlers ──────────────────────────────────────────────────────
  const handleChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setDigits(next);
      refs.current[5]?.focus();
      e.preventDefault();
    }
  };

  // ── Verify ──────────────────────────────────────────────────────────────
  const handleVerify = useCallback(async (otp: string) => {
    if (otp.length < 6 || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        onVerified(data.verificationToken);
      } else if (res.status === 400 && data.code === "WRONG_OTP") {
        setError(data.message);
        setAttemptsRemaining(data.attemptsRemaining ?? 0);
        setDigits(Array(6).fill(""));
        setTimeout(() => refs.current[0]?.focus(), 50);
      } else if (res.status === 410) {
        setError("OTP has expired. Please request a new one.");
        setDigits(Array(6).fill(""));
      } else if (res.status === 429) {
        setError("Too many wrong attempts. Please go back and request a new OTP.");
      } else {
        setError(data.message ?? "Verification failed. Please try again.");
        setDigits(Array(6).fill(""));
      }
    } catch {
      setError("Network error. Please check your connection.");
      setDigits(Array(6).fill(""));
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, onVerified, isLoading]);

  // ── Resend ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      if (res.ok) {
        setResendCooldown(60);
        setDigits(Array(6).fill(""));
        setAttemptsRemaining(3);
        setTimeout(() => refs.current[0]?.focus(), 50);
      } else {
        const d = await res.json();
        setError(d.message ?? "Failed to resend OTP.");
      }
    } catch {
      setError("Network error. Could not resend OTP.");
    }
  };

  const otp = digits.join("");

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← Back
      </button>

      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center">
          <Lock size={32} className="text-teal-600" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[#1E3A5F] mt-4">Verify Your Order</h2>
      <p className="text-gray-500 text-sm mt-1">Enter the 6-digit OTP sent to</p>
      <p className="font-semibold text-[#1E3A5F] mt-1">{phoneNumber}</p>

      {/* OTP Inputs */}
      <div className="flex gap-2 justify-center mt-7" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        ))}
      </div>

      {/* Errors */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-left">
          {error}
        </div>
      )}
      {attemptsRemaining === 1 && !error && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-700">
          ⚠️ Last attempt remaining
        </div>
      )}

      {/* Verify button */}
      <button
        onClick={() => handleVerify(otp)}
        disabled={otp.length < 6 || isLoading}
        className="mt-5 w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white py-3 rounded-xl font-medium transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Verifying…
          </>
        ) : (
          "Verify OTP"
        )}
      </button>

      {/* Resend */}
      <div className="mt-4 text-sm text-gray-500">
        Didn&apos;t receive it?{" "}
        {resendCooldown > 0 ? (
          <span className="text-gray-400">Resend in {resendCooldown}s</span>
        ) : (
          <button
            onClick={handleResend}
            className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2 transition-colors"
          >
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
}
