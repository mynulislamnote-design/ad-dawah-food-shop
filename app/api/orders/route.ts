import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

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
          mealSlot: mealSlot || initialSlotState,
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

    // হোয়াটসঅ্যাপে অটোমেটিক মেসেজ পাঠানো (lib/whatsapp.ts নিজে থেকেই +88 ও বাংলা সংখ্যা ঠিক করে নেবে)
    try {
      if (typeof sendWhatsAppMessage === "function") {
        const whatsappText = `🎉 *আসসালামু আলাইকুম ${customerName}!*

আদ-দাওয়া ফুড শপে আপনার খাবারের প্রি-অর্ডারটি সফলভাবে গৃহীত হয়েছে।

📋 *অর্ডারের বিবরণ:*
📅 তারিখ: ${targetDate} ${daysToCreate > 1 ? `(মোট ${daysToCreate} দিন)` : ""}
🍱 প্যাকেজ: ${packageType}
💰 মোট বিল: ৳${totalAmount}
🛵 ডেলিভারি: ${deliveryType === "HOME_DELIVERY" ? "হোম ডেলিভারি" : "সেলফ পিকআপ"}
📍 মেস ও রুম: ${messName || "সাধারণ মেস"} (রুম: ${roomNo || "N/A"})
💳 পেমেন্ট: ${paymentMethod}

যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন। ধন্যবাদ!`;

        await sendWhatsAppMessage(customerPhone, whatsappText);
        console.log(`✅ WhatsApp message triggered for: ${customerPhone}`);
      }
    } catch (waErr) {
      console.error("WhatsApp notification error:", waErr);
    }

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
    return NextResponse.json({ error: "আপডেট ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
