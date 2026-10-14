import { NextResponse } from "next/server";
import { userWalletStore } from "@/lib/userWalletStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, customerName, customerPhone, amount, paymentMethod, trxId } =
      body;

    if (!email || !amount || !trxId) {
      return NextResponse.json(
        { error: "ইমেইল, টাকার পরিমাণ ও TrxID দেওয়া আবশ্যক!" },
        { status: 400 },
      );
    }

    const newRequest = userWalletStore.addWalletRequest({
      email,
      customerName: customerName || "সম্মানিত গ্রাহক",
      customerPhone: customerPhone || "N/A",
      amount: parseFloat(String(amount)),
      paymentMethod: paymentMethod || "BKASH",
      trxId: String(trxId).toUpperCase().trim(),
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error: any) {
    console.error("Wallet Request Error:", error);
    return NextResponse.json(
      { error: "ডাটাবেজে রিকোয়েস্ট সেভ করা যায়নি।" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const requests = userWalletStore.getWalletRequests();
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json(
      { error: "রিকোয়েস্ট লোড করা যায়নি" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { requestId, action } = body;

    const success = userWalletStore.updateWalletRequestStatus(
      requestId,
      action,
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message:
          action === "APPROVE"
            ? "টাকা ইউজারের ওয়ালেটে যোগ হয়েছে!"
            : "রিকোয়েস্ট বাতিল করা হয়েছে।",
      });
    } else {
      return NextResponse.json(
        { error: "রিকোয়েস্ট পাওয়া যায়নি বা ইতোমধ্যে অনুমোদিত।" },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json({ error: "আপডেট করা যায়নি" }, { status: 500 });
  }
}
