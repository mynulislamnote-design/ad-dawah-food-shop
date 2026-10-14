import { NextResponse } from "next/server";
const { sendWhatsAppMessage } = require("@/lib/whatsapp"); // আপনার whatsapp.js ফাইলের সঠিক পাথ এখানে দেবেন

export async function POST(req) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone and message are required" },
        { status: 400 },
      );
    }

    const result = await sendWhatsAppMessage(phone, message);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
