import { NextResponse } from "next/server";

// গ্লোবাল মেমোরি সেটিংস (এডমিন থেকে পরিবর্তনযোগ্য)
let systemSettings = {
  deliveryCharge: 15, // স্বাভাবিক চার্জ
  isFreeDelivery: false, // ফ্রি ডেলিভারি চালু আছে কিনা
};

export async function GET() {
  return NextResponse.json(systemSettings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.deliveryCharge !== undefined) {
      systemSettings.deliveryCharge = Number(body.deliveryCharge);
    }
    if (body.isFreeDelivery !== undefined) {
      systemSettings.isFreeDelivery = Boolean(body.isFreeDelivery);
    }
    return NextResponse.json({ success: true, settings: systemSettings });
  } catch (error) {
    return NextResponse.json(
      { error: "Settings update failed" },
      { status: 500 },
    );
  }
}
