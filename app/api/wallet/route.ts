import { NextResponse } from "next/server";

// ইন-মেমোরি ওয়ালেট ট্র্যাকার (ফোন নম্বর অনুযায়ী)
const userWallets: { [phone: string]: number } = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") || "";
  const balance = userWallets[phone] !== undefined ? userWallets[phone] : 450; // ডিফল্ট ব্যালেন্স
  return NextResponse.json({ balance });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount, type } = body; // type: 'CREDIT' (টাকা যোগ) | 'DEBIT' (টাকা কর্তন)

    if (!phone)
      return NextResponse.json({ error: "Phone required" }, { status: 400 });

    const currentBalance =
      userWallets[phone] !== undefined ? userWallets[phone] : 450;
    const newBalance =
      type === "CREDIT"
        ? currentBalance + Number(amount)
        : currentBalance - Number(amount);

    userWallets[phone] = Math.max(0, newBalance);

    return NextResponse.json({ success: true, balance: userWallets[phone] });
  } catch (err) {
    return NextResponse.json(
      { error: "Wallet update failed" },
      { status: 500 },
    );
  }
}
