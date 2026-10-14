import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDateStr = tomorrow.toISOString().split("T")[0];

    const orders = await prisma.dailyOrder.findMany({
      where: {
        targetDate: targetDateStr,
        isSkipped: false,
      },
    });

    let breakfast = 0;
    let lunch = 0;
    let dinner = 0;
    let homeDelivery = 0;
    let pickup = 0;

    orders.forEach((o) => {
      if (o.deliveryType === "HOME_DELIVERY") homeDelivery++;
      else pickup++;

      const slot = (o.mealSlot || "").toUpperCase();
      if (slot.includes("BREAKFAST")) breakfast++;
      if (slot.includes("LUNCH")) lunch++;
      if (slot.includes("DINNER")) dinner++;
    });

    return NextResponse.json({
      targetDate: targetDateStr,
      totalOrders: orders.length,
      deliveryBreakdown: { homeDelivery, pickup },
      kitchenSummary: { breakfast, lunch, dinner },
      ordersList: orders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load kitchen summary" },
      { status: 500 },
    );
  }
}
