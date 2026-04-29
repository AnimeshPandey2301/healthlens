import { NextRequest, NextResponse } from "next/server";

const USE_RAZORPAY =
  process.env.RAZORPAY_KEY_ID?.startsWith("rzp_") &&
  !process.env.RAZORPAY_KEY_ID?.includes("xxx");

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json(); // amount in rupees

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (USE_RAZORPAY) {
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // paise
        currency: "INR",
        receipt: `hl_${Date.now()}`,
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } else {
      // DEV MODE: return a mock Razorpay order
      const mockOrderId = `order_DEV_${Date.now()}`;
      console.log(`[DEV Razorpay] Mock order created: ${mockOrderId} for ₹${amount}`);
      return NextResponse.json({
        orderId: mockOrderId,
        amount: Math.round(amount * 100),
        currency: "INR",
        keyId: "rzp_test_dev_mode",
        devMode: true,
      });
    }
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
