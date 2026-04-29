import { NextRequest, NextResponse } from "next/server";

// In-memory order store (replace with DB in production)
const orders: unknown[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, address } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!address?.name || !address?.phone || !address?.street || !address?.pincode || !address?.city) {
      return NextResponse.json({ error: "Incomplete delivery address" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(address.phone)) {
      return NextResponse.json({ error: "Invalid phone number (10 digits required)" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      return NextResponse.json({ error: "Invalid pincode (6 digits required)" }, { status: 400 });
    }

    const orderId = `HL-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const order = {
      orderId,
      items,
      address,
      status: "Confirmed",
      estimatedDelivery: "2â€“4 business days",
      placedAt: new Date().toISOString(),
    };

    orders.push(order);
    return NextResponse.json({ success: true, orderId, estimatedDelivery: "2â€“4 business days" });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ orders });
}
