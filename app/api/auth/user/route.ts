import { NextResponse } from "next/server";
import { userWalletStore } from "@/lib/userWalletStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = userWalletStore.getUser(email);
    return NextResponse.json(user || null);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, phone, messName, roomNo } = body;

    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = userWalletStore.saveUser({
      email,
      name,
      phone,
      messName,
      roomNo,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 },
    );
  }
}
