import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const USE_RAZORPAY =
  process.env.RAZORPAY_KEY_ID?.startsWith("rzp_") &&
  !process.env.RAZORPAY_KEY_ID?.includes("xxx");

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    // Dev mode: skip real signature check
    if (!USE_RAZORPAY || razorpay_order_id.startsWith("order_DEV_")) {
      console.log(`[DEV Payment] Verified mock payment: ${razorpay_payment_id}`);
      return NextResponse.json({ success: true, paymentId: razorpay_payment_id });
    }

    // Production: verify HMAC-SHA256 signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ error: "Verification error" }, { status: 500 });
  }
}
