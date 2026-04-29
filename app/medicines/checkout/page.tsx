"use client";

import { useState, useCallback } from "react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useRouter } from "next/navigation";
import {
  MapPin, Phone, User, Building, Hash, ShieldCheck,
  Minus, Plus, CheckCircle2, Loader2, CreditCard, Lock,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const OtpModal = dynamic(() => import("@/components/OtpModal"), { ssr: false });
const PrescriptionUpload = dynamic(() => import("@/components/PrescriptionUpload"), { ssr: false });

/* ── Types ─────────────────────────────────────────────────────── */
type Address = {
  name: string; phone: string; street: string;
  city: string; state: string; pincode: string;
};
type FieldError = Partial<Record<keyof Address, string>>;
type Step = "address" | "otp" | "prescription" | "payment" | "done";

function validate(addr: Address): FieldError {
  const e: FieldError = {};
  if (!addr.name.trim()) e.name = "Name is required";
  if (!/^\d{10}$/.test(addr.phone)) e.phone = "Enter valid 10-digit phone";
  if (!addr.street.trim()) e.street = "Street address is required";
  if (!addr.city.trim()) e.city = "City is required";
  if (!addr.state.trim()) e.state = "State is required";
  if (!/^\d{6}$/.test(addr.pincode)) e.pincode = "Enter valid 6-digit pincode";
  return e;
}

/* ── Step indicator ─────────────────────────────────────────────── */
const STEPS = [
  { key: "address", label: "Address" },
  { key: "otp", label: "Verify" },
  { key: "prescription", label: "Rx Upload" },
  { key: "payment", label: "Payment" },
];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1 last:flex-none">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
            i < idx ? "bg-teal-600 text-white"
              : i === idx ? "bg-teal-600 text-white ring-4 ring-teal-100"
              : "bg-gray-100 text-gray-400"}`}>
            {i < idx ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          <p className={`text-[10px] ml-1 font-medium ${i <= idx ? "text-teal-700" : "text-gray-400"}`}>
            {s.label}
          </p>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${i < idx ? "bg-teal-600" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main checkout page ─────────────────────────────────────────── */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, updateQty, totalPrice, clearCart } = useCartStore();

  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<Address>({
    name: "", phone: "", street: "", city: "", state: "", pincode: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [otpVerified, setOtpVerified] = useState(false);
  const [prescriptionUrl, setPrescriptionUrl] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [apiError, setApiError] = useState("");
  const [orderId, setOrderId] = useState("");

  const needsPrescription = items.some((i) => i.medicine.requiresPrescription);
  const delivery = totalPrice() >= 299 ? 0 : 49;
  const grandTotal = totalPrice() + delivery;

  const handleChange = (field: keyof Address, val: string) => {
    setAddress((a) => ({ ...a, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  /* Step 1 → 2: validate address then open OTP modal */
  const handleAddressDone = () => {
    const errs = validate(address);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStep("otp");
  };

  /* Step 2 → 3: OTP verified */
  const handleOtpVerified = () => {
    setOtpVerified(true);
    setStep(needsPrescription ? "prescription" : "payment");
  };

  /* Step 3 → 4: prescription uploaded */
  const handlePrescriptionUploaded = (url: string) => {
    setPrescriptionUrl(url);
  };

  /* Step 4: Razorpay payment */
  const handlePayment = useCallback(async () => {
    setPaying(true);
    setApiError("");
    try {
      // 1. Create Razorpay order on backend
      const createRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal }),
      });
      const orderData = await createRes.json();
      if (!createRes.ok) { setApiError(orderData.error ?? "Payment init failed"); setPaying(false); return; }

      // 2. Dev mode: skip Razorpay popup
      if (orderData.devMode) {
        await finishOrder(`pay_DEV_${Date.now()}`, orderData.orderId, "DEV_SIG");
        return;
      }

      // 3. Load Razorpay checkout.js
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Razorpay script failed"));
        document.body.appendChild(script);
      });

      // 4. Open Razorpay popup
      const rzp = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "HealthLens Medicines",
        description: `Order of ${items.length} item(s)`,
        prefill: {
          name: address.name,
          contact: `+91${address.phone}`,
        },
        theme: { color: "#0D9488" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await finishOrder(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: () => { setPaying(false); },
        },
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setApiError("Payment failed. Please try again.");
      setPaying(false);
    }
  }, [grandTotal, items, address]);

  const finishOrder = async (
    paymentId: string,
    razorpayOrderId: string,
    signature: string
  ) => {
    // 5. Verify payment signature
    const verifyRes = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_payment_id: paymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: signature,
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) { setApiError(verifyData.error ?? "Payment verification failed"); setPaying(false); return; }

    // 6. Save order
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ id: i.medicine.id, name: i.medicine.name, qty: i.qty, price: i.medicine.price })),
        address,
        paymentId,
        prescriptionUrl,
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) { setApiError(orderData.error ?? "Order save failed"); setPaying(false); return; }

    clearCart();
    setPaymentDone(true);
    setOrderId(orderData.orderId);
    setStep("done");
    router.push(`/medicines/order-success?orderId=${orderData.orderId}`);
  };

  /* Empty cart guard */
  if (items.length === 0 && step !== "done") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">🛒</span>
        <p className="text-lg font-semibold text-gray-600">Your cart is empty</p>
        <Link href="/medicines" className="bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
          Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* OTP Modal overlay */}
      {step === "otp" && (
        <OtpModal
          phone={address.phone}
          onVerified={handleOtpVerified}
          onClose={() => setStep("address")}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/medicines" className="text-sm text-teal-600 hover:underline">← Back to Medicines</Link>
          <h1 className="text-2xl font-bold text-[#1E3A5F] mt-2">Checkout</h1>
        </div>

        <StepIndicator current={step === "otp" ? "address" : step} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-5">
            {/* Address form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[#1E3A5F] flex items-center gap-2">
                  <MapPin size={16} className="text-teal-600" /> Delivery Address
                </h2>
                {otpVerified && (
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                )}
              </div>
              <div className="space-y-4">
                <Field label="Full Name" icon={<User size={12}/>} value={address.name} error={errors.name}
                  onChange={(v) => handleChange("name", v)} placeholder="Animesh Pandey" disabled={otpVerified} />
                <Field label="Phone Number" icon={<Phone size={12}/>} value={address.phone} error={errors.phone}
                  onChange={(v) => handleChange("phone", v)} placeholder="10-digit mobile" maxLength={10} disabled={otpVerified} />
                <Field label="Street Address" icon={<Building size={12}/>} value={address.street} error={errors.street}
                  onChange={(v) => handleChange("street", v)} placeholder="House no., street, locality" textarea disabled={otpVerified} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" value={address.city} error={errors.city}
                    onChange={(v) => handleChange("city", v)} placeholder="Mathura" disabled={otpVerified} />
                  <Field label="State" value={address.state} error={errors.state}
                    onChange={(v) => handleChange("state", v)} placeholder="Uttar Pradesh" disabled={otpVerified} />
                </div>
                <Field label="Pincode" icon={<Hash size={12}/>} value={address.pincode} error={errors.pincode}
                  onChange={(v) => handleChange("pincode", v)} placeholder="6-digit pincode" maxLength={6} disabled={otpVerified} />
              </div>

              {!otpVerified && (
                <button onClick={handleAddressDone}
                  className="w-full mt-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  <Phone size={15} /> Continue & Verify Phone
                </button>
              )}
            </div>

            {/* Prescription upload (after OTP, if needed) */}
            {otpVerified && needsPrescription && (
              <PrescriptionUpload phone={address.phone} onUploaded={handlePrescriptionUploaded} />
            )}

            {/* Safety note */}
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex items-start gap-2">
              <ShieldCheck size={15} className="text-teal-600 mt-0.5 shrink-0" />
              <p className="text-xs text-teal-700">
                Your payment is secured by Razorpay. OTP verification protects your order from fraud.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              <h2 className="font-semibold text-[#1E3A5F] mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.medicine.id} className="flex items-center gap-3">
                    <span className="text-xl">{item.medicine.imageEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{item.medicine.name}</p>
                      {item.medicine.requiresPrescription && (
                        <span className="text-[10px] text-red-500 font-medium">Rx required</span>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <button onClick={() => updateQty(item.medicine.id, item.qty - 1)}
                          disabled={otpVerified}
                          className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40">
                          <Minus size={10}/>
                        </button>
                        <span className="text-xs w-5 text-center font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.medicine.id, item.qty + 1)}
                          disabled={otpVerified}
                          className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40">
                          <Plus size={10}/>
                        </button>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#1E3A5F]">₹{item.medicine.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{totalPrice()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className={delivery === 0 ? "text-emerald-600 font-medium" : ""}>
                    {delivery === 0 ? "Free" : `₹${delivery}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1E3A5F] border-t border-gray-100 pt-3">
                  <span>Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              {/* Checklist */}
              <div className="mt-4 space-y-1.5">
                <ChecklistItem done={otpVerified} label="Phone verified via OTP" />
                {needsPrescription && (
                  <ChecklistItem done={!!prescriptionUrl} label="Prescription uploaded" />
                )}
                <ChecklistItem done={paymentDone} label="Payment completed" />
              </div>

              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 mt-3">
                  {apiError}
                </div>
              )}

              {/* Pay Now button */}
              {otpVerified && (!needsPrescription || prescriptionUrl) && (
                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="w-full mt-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing…</>
                  ) : (
                    <><Lock size={15} /> <CreditCard size={15} /> Pay ₹{grandTotal} Securely</>
                  )}
                </button>
              )}

              {!otpVerified && (
                <button disabled
                  className="w-full mt-4 bg-gray-100 text-gray-400 font-semibold py-3 rounded-xl text-sm cursor-not-allowed flex items-center justify-center gap-2">
                  <Lock size={14} /> Verify phone first
                </button>
              )}

              <p className="text-[10px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                <Lock size={10} /> Secured by Razorpay • Estimated delivery: 2–4 days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper sub-components ─────────────────────────────────────── */
function Field({
  label, icon, value, error, onChange, placeholder, maxLength, textarea, disabled,
}: {
  label: string; icon?: React.ReactNode; value: string;
  error?: string; onChange: (v: string) => void;
  placeholder?: string; maxLength?: number; textarea?: boolean; disabled?: boolean;
}) {
  const cls = `w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition-colors ${
    error ? "border-red-400 bg-red-50" : "border-gray-200"
  } ${disabled ? "bg-gray-50 text-gray-500" : ""}`;
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
        {icon} {label}
      </label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} rows={2} disabled={disabled}
          className={cls + " resize-none"} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength} disabled={disabled}
          className={cls} />
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${done ? "text-teal-700" : "text-gray-400"}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
        done ? "bg-teal-600" : "bg-gray-200"}`}>
        <CheckCircle2 size={10} className="text-white" />
      </div>
      {label}
    </div>
  );
}
