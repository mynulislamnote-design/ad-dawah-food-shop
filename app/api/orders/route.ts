import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp"; // <-- ১. হোয়াটসঅ্যাপ ফাংশন ইমপোর্ট করা হলো

// ১. নতুন অর্ডার তৈরি
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      messName,
      roomNo,
      targetDate,
      mealSlot,
      packageType,
      deliveryType,
      deliveryCharge,
      totalAmount,
      paymentMethod,
      durationDays = 1,
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: "নাম ও মোবাইল নম্বর আবশ্যক!" },
        { status: 400 },
      );
    }

    const startDate = new Date(targetDate || new Date());
    const daysToCreate = Number(durationDays) || 1;
    const perDayAmount = Number(totalAmount) / daysToCreate;
    const perDayDelivery = Number(deliveryCharge) / daysToCreate;

    const createdOrders = [];

    for (let i = 0; i < daysToCreate; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const formattedDate = currentDate.toISOString().split("T")[0];

      // ডিফল্টভাবে ৩ বেলা অন থাকবে (সকাল: অন, দুপুর: অন, রাত: অন)
      const initialSlotState = JSON.stringify({
        breakfast: true,
        lunch: true,
        dinner: true,
      });

      const order = await prisma.dailyOrder.create({
        data: {
          customerName,
          customerPhone,
          messName: messName || "সাধারণ মেস",
          roomNo: roomNo || "N/A",
          targetDate: formattedDate,
          mealSlot: initialSlotState,
          packageType: packageType || "REGULAR",
          deliveryType: deliveryType || "HOME_DELIVERY",
          deliveryCharge: Number(perDayDelivery),
          totalAmount: Number(perDayAmount),
          paymentMethod: paymentMethod || "WALLET",
          isSkipped: false,
        },
      });
      createdOrders.push(order);
    }

    // ==========================================
    // ২. অর্ডার সফলভাবে সেভ হওয়ার পর হোয়াটসঅ্যাপ মেসেজ পাঠানো
    // ==========================================
    try {
      const formattedDateStr = startDate.toLocaleDateString("bn-BD");

      const whatsappMessage = `🎉 *আপনার অর্ডার কনফার্ম হয়েছে!*

আসসালামੁ আলাইকুম *${customerName}*,
আদ-দাওয়া ফুড শপে আপনার প্রি-অর্ডারটি সফলভাবে রেকর্ড করা হয়েছে।

📦 *প্যাকেজ:* ${packageType || "REGULAR"}
⏱️ *মেয়াদ:* ${daysToCreate} দিন
💰 *সর্বমোট বিল:* ${totalAmount} টাকা
🏠 *মেস/ঠিকানা:* ${messName || "সাধারণ মেস"}, রুম: ${roomNo || "N/A"}
💳 *পেমেন্ট পদ্ধতি:* ${paymentMethod || "WALLET"}

আমাদের সেবা গ্রহণ করার জন্য ধন্যবাদ! ❤️`;

      // ব্যাকগ্রাউন্ডে মেসেজ পাঠাবে, যাতে মেইন অর্ডারের রেসপন্স স্লো না হয়
      sendWhatsAppMessage(customerPhone, whatsappMessage)
        .then(() =>
          console.log("WhatsApp order notification sent to:", customerPhone),
        )
        .catch((err) => console.error("WhatsApp send error:", err));
    } catch (waErr) {
      console.error("WhatsApp block execution error:", waErr);
    }
    // ==========================================

    return NextResponse.json(
      { success: true, count: createdOrders.length, orders: createdOrders },
      { status: 201 },
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "অর্ডার সেভ করা যায়নি।" },
      { status: 500 },
    );
  }
}

// ২. অর্ডার খোঁজা
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    const orders = await prisma.dailyOrder.findMany({
      where: phone ? { customerPhone: phone } : undefined,
      orderBy: { targetDate: "asc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: "অর্ডার লোড করা যায়নি।" },
      { status: 500 },
    );
  }
}

// ৩. নির্দিষ্ট বেলার স্কিপ ও অতিরিক্ত খাবার আপডেট API
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, isSkipped, mealSlot, packageType, totalAmount } = body;

    const updated = await prisma.dailyOrder.update({
      where: { id: orderId },
      data: {
        ...(isSkipped !== undefined && { isSkipped: Boolean(isSkipped) }),
        ...(mealSlot !== undefined && { mealSlot: String(mealSlot) }),
        ...(packageType !== undefined && { packageType: String(packageType) }),
        ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "আপডেট ব্যর্থ হয়েছে." }, { status: 500 });
  }
}
