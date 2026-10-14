import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ডিফল্ট সিড ডাটা (ডাটাবেজ খালি থাকলে স্বয়ংক্রিয়ভাবে তৈরি হবে)
const DEFAULT_MENU_ITEMS = [
  // ১. রেগুলার প্যাকেজের খাবার (REGULAR_CYCLE)
  {
    nameBn: "সকালের ভুনা খিচুড়ি + ডিম ভুনা/ভাজি",
    price: 45,
    mealSlot: "REGULAR_BREAKFAST_KHICHURI",
    isAvailable: true,
  },
  {
    nameBn: "সকালের গরম পরোটা (৩টি) + ডিম ভাজি + ডাল-ভাজি",
    price: 40,
    mealSlot: "REGULAR_BREAKFAST_PARATHA",
    isAvailable: true,
  },
  {
    nameBn: "১ম দিন: ডিম ভুনা + ঘন ডাল + আলু ভর্তা + ভাত",
    price: 70,
    mealSlot: "REGULAR_LUNCH_DAY1",
    isAvailable: true,
  },
  {
    nameBn: "২য় দিন: রুই মাছের ঝোল + সবজি + পাতলা ডাল + ভাত",
    price: 80,
    mealSlot: "REGULAR_LUNCH_DAY2",
    isAvailable: true,
  },
  {
    nameBn: "৩য় দিন: দেশি মুরগির ঝোল + সবজি + ডাল + ভাত",
    price: 90,
    mealSlot: "REGULAR_LUNCH_DAY3",
    isAvailable: true,
  },
  {
    nameBn: "শুক্রবার স্পেশাল: শাহী বিফ দম বিরিয়ানি + বোরহানি",
    price: 130,
    mealSlot: "REGULAR_FRIDAY",
    isAvailable: true,
  },
  {
    nameBn: "রাতের স্পেশাল ভুনা খিচুড়ি + বেগুন ও ডিম ভাজি",
    price: 65,
    mealSlot: "REGULAR_DINNER_1",
    isAvailable: true,
  },
  {
    nameBn: "রাতের ভাত + ডিম ভুনা + স্পেশাল ভর্তা + ডাল",
    price: 65,
    mealSlot: "REGULAR_DINNER_2",
    isAvailable: true,
  },

  // ২. অতিরিক্ত খাবার (EXTRA_ADDON)
  {
    nameBn: "অতিরিক্ত সাদা ভাত",
    price: 15,
    mealSlot: "EXTRA_ADDON",
    isAvailable: true,
  },
  {
    nameBn: "ডিম পোচ / ওমলেট",
    price: 20,
    mealSlot: "EXTRA_ADDON",
    isAvailable: true,
  },
  {
    nameBn: "স্পেশাল আলু ভর্তা (গাওয়া ঘি)",
    price: 10,
    mealSlot: "EXTRA_ADDON",
    isAvailable: true,
  },
  {
    nameBn: "ঘন মসুর ডাল বাটি",
    price: 15,
    mealSlot: "EXTRA_ADDON",
    isAvailable: true,
  },
  {
    nameBn: "শসা ও লেবুর ফ্রেশ সালাদ",
    price: 10,
    mealSlot: "EXTRA_ADDON",
    isAvailable: true,
  },

  // ৩. কাস্টম প্লেটের খাবার (CUSTOM)
  {
    nameBn: "ভাত (Plain Rice)",
    price: 15,
    mealSlot: "CUSTOM",
    isAvailable: true,
  },
  { nameBn: "রুই মাছের ঝোল", price: 60, mealSlot: "CUSTOM", isAvailable: true },
  {
    nameBn: "দেশি মুরগির ভুনা",
    price: 70,
    mealSlot: "CUSTOM",
    isAvailable: true,
  },
  {
    nameBn: "মুগ ডাল + সবজি",
    price: 20,
    mealSlot: "CUSTOM",
    isAvailable: true,
  },
  { nameBn: "ডিম ভুনা", price: 25, mealSlot: "CUSTOM", isAvailable: true },
  {
    nameBn: "স্পেশাল আলু ভর্তা",
    price: 10,
    mealSlot: "CUSTOM",
    isAvailable: true,
  },
];

export async function GET() {
  try {
    let items = await prisma.menuItem.findMany({
      orderBy: { price: "asc" },
    });

    // প্রথমবার সিড করা
    if (items.length === 0) {
      for (const item of DEFAULT_MENU_ITEMS) {
        await prisma.menuItem.create({ data: item });
      }
      items = await prisma.menuItem.findMany();
    } else {
      // যদি রেগুলার বা এক্সট্রা আইটেম না থাকে তবে ইনসার্ট করা
      const hasRegular = items.some((i) => i.mealSlot.startsWith("REGULAR_"));
      if (!hasRegular) {
        for (const item of DEFAULT_MENU_ITEMS) {
          if (
            item.mealSlot.startsWith("REGULAR_") ||
            item.mealSlot === "EXTRA_ADDON"
          ) {
            await prisma.menuItem.create({ data: item });
          }
        }
        items = await prisma.menuItem.findMany();
      }
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error("Menu fetch error:", error);
    return NextResponse.json({ error: "মেনু লোড করা যায়নি।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nameBn, price, mealSlot } = body;

    if (!nameBn || !price) {
      return NextResponse.json(
        { error: "খাবারের নাম ও দাম আবশ্যক!" },
        { status: 400 },
      );
    }

    const newItem = await prisma.menuItem.create({
      data: {
        nameBn,
        price: parseFloat(price),
        mealSlot: mealSlot || "CUSTOM",
        isAvailable: true,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "খাবার যোগ করা যায়নি।" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nameBn, price, isAvailable } = body;

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(nameBn !== undefined && { nameBn: String(nameBn) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json(
      { error: "আপডেট করা সম্ভব হয়নি।" },
      { status: 500 },
    );
  }
}
