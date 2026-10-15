"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  ShoppingBag,
  Truck,
  Store,
  Wallet,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Phone,
  User,
  Sparkles,
  Loader2,
  CalendarDays,
  CreditCard,
  Copy,
  Check,
  ReceiptText,
  MapPin,
  ChevronDown,
  Star,
  Plus,
  Minus,
  X,
  PlusCircle,
  Zap,
  CheckSquare,
  Square,
  Play,
  HelpCircle,
  Video,
  LogIn,
  LogOut,
  ShieldCheck,
  Calendar,
} from "lucide-react";

const BANGLA_DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];
const BANGLA_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];
const BANGLA_MONTHS_SHORT = [
  "জানু",
  "ফেব্রু",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টে",
  "অক্টো",
  "নভে",
  "ডিসে",
];

function getNextTwelveMonths() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      label: `${BANGLA_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return months;
}

function getDaysForMonth(year: number, monthIndex: number) {
  const days = [];
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, monthIndex, day);
    if (d >= today) {
      days.push({
        fullDate: d.toISOString().split("T")[0],
        dayName: BANGLA_DAYS[d.getDay()],
        dayNumber: day,
        monthName: BANGLA_MONTHS_SHORT[monthIndex],
        year: year,
        isFriday: d.getDay() === 5,
        rawDate: d,
      });
    }
  }
  return days;
}

interface DaySlotConfig {
  date: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export default function MealOrderApp() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("500");
  const [rechargePaymentMethod, setRechargePaymentMethod] = useState<
    "BKASH" | "NAGAD"
  >("BKASH");
  const [rechargeTrxId, setRechargeTrxId] = useState("");
  const [isSubmittingRecharge, setIsSubmittingRecharge] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // ক্যালেন্ডার ও মাস
  const availableMonths = useMemo(() => getNextTwelveMonths(), []);
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]);

  const currentMonthDays = useMemo(() => {
    return getDaysForMonth(selectedMonth.year, selectedMonth.monthIndex);
  }, [selectedMonth]);

  // মাল্টি-ডেট সিলেকশন স্টেট
  const [selectedDatesMap, setSelectedDatesMap] = useState<{
    [dateStr: string]: DaySlotConfig;
  }>({});

  // ১-ক্লিক প্রিসেট মোড (7days, 15days, 30days অথবা Custom)
  const [quickPreset, setQuickPreset] = useState<
    "7DAYS" | "15DAYS" | "30DAYS" | "CUSTOM"
  >("CUSTOM");

  const [subscribedSlots, setSubscribedSlots] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
  });

  const applyQuickPreset = (
    daysCount: number,
    presetType: "7DAYS" | "15DAYS" | "30DAYS",
  ) => {
    setQuickPreset(presetType);
    const newMap: { [dateStr: string]: DaySlotConfig } = {};
    const allAvailable = availableMonths.flatMap((m) =>
      getDaysForMonth(m.year, m.monthIndex),
    );
    const targetDays = allAvailable.slice(0, daysCount);

    targetDays.forEach((day) => {
      newMap[day.fullDate] = {
        date: day.fullDate,
        dayName: day.dayName,
        dayNumber: day.dayNumber,
        monthName: day.monthName,
        breakfast: subscribedSlots.breakfast,
        lunch: subscribedSlots.lunch,
        dinner: subscribedSlots.dinner,
      };
    });

    setSelectedDatesMap(newMap);
  };

  useEffect(() => {
    if (quickPreset !== "CUSTOM") {
      const count =
        quickPreset === "7DAYS" ? 7 : quickPreset === "15DAYS" ? 15 : 30;
      applyQuickPreset(count, quickPreset);
    }
  }, [subscribedSlots]);

  useEffect(() => {
    if (
      currentMonthDays.length > 0 &&
      Object.keys(selectedDatesMap).length === 0
    ) {
      const first = currentMonthDays[0];
      setSelectedDatesMap({
        [first.fullDate]: {
          date: first.fullDate,
          dayName: first.dayName,
          dayNumber: first.dayNumber,
          monthName: first.monthName,
          breakfast: true,
          lunch: true,
          dinner: true,
        },
      });
    }
  }, [currentMonthDays]);

  const [selectedPackage, setSelectedPackage] = useState<"REGULAR" | "CUSTOM">(
    "REGULAR",
  );
  const [selectedSlot, setSelectedSlot] = useState<
    "BREAKFAST" | "LUNCH" | "DINNER"
  >("LUNCH");
  const [breakfastChoice, setBreakfastChoice] = useState<
    "KHICHURI" | "PARATHA"
  >("KHICHURI");

  // ডেলিভারি ও সেটিংস
  const [deliveryMethod, setDeliveryMethod] = useState<
    "HOME_DELIVERY" | "PICKUP"
  >("HOME_DELIVERY");
  const [adminDeliveryCharge, setAdminDeliveryCharge] = useState(15);
  const [isFreeDeliveryPromo, setIsFreeDeliveryPromo] = useState(false);

  // অতিরিক্ত খাবার
  const [extraItems, setExtraItems] = useState([
    { id: "ex1", name: "অতিরিক্ত সাদা ভাত", price: 15, count: 0 },
    { id: "ex2", name: "ডিম পোচ / ওমলেট", price: 20, count: 0 },
    { id: "ex3", name: "স্পেশাল আলু ভর্তা (গাওয়া ঘি)", price: 10, count: 0 },
    { id: "ex4", name: "ঘন মসুর ডাল বাটি", price: 15, count: 0 },
    { id: "ex5", name: "শসা ও লেবুর ফ্রেশ সালাদ", price: 10, count: 0 },
  ]);

  // কাস্টম প্লেটের প্রিমিয়াম খাবার (ছবি ও ব্যাজসহ)
  const [customItems, setCustomItems] = useState([
    {
      id: "c1",
      name: "সাদা ভাত (বাসমতি চাল)",
      price: 15,
      selected: true,
      img: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&q=80",
      badge: "বাসমতি",
    },
    {
      id: "c2",
      name: "রুই মাছের জিরা ঝোল",
      price: 60,
      selected: true,
      img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80",
      badge: "তাজা মাছ",
    },
    {
      id: "c3",
      name: "দেশি মুরগির কষা ভুনা",
      price: 70,
      selected: false,
      img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80",
      badge: "জনপ্রিয়",
    },
    {
      id: "c4",
      name: "মুগ ডাল + পাঁচমিশালি সবজি",
      price: 20,
      selected: false,
      img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80",
      badge: "ঘরোয়া",
    },
    {
      id: "c5",
      name: "ডিম ভুনা (দেশি স্টাইল)",
      price: 25,
      selected: false,
      img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=80",
      badge: "প্রোটিন",
    },
    {
      id: "c6",
      name: "স্পেশাল আলু ভর্তা (গাওয়া ঘি)",
      price: 10,
      selected: false,
      img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&q=80",
      badge: "ঘি ভাজা",
    },
  ]);

  const [regularMenuOverrides, setRegularMenuOverrides] = useState<{
    [key: string]: { name: string; price: number };
  }>({});

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"BKASH" | "WALLET">(
    "BKASH",
  );
  const [trxId, setTrxId] = useState("");
  const [copiedNumber, setCopiedNumber] = useState(false);
  const shopBkashNumber = "01736738334";

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [messName, setMessName] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [userWallet, setUserWallet] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      setCustomerName(session.user.name || "");
      fetch(`/api/auth/user?email=${encodeURIComponent(session.user.email)}`)
        .then((res) => res.json())
        .then((user) => {
          if (user) {
            if (user.name) setCustomerName(user.name);
            if (user.phone) setCustomerPhone(user.phone);
            if (user.messName) setMessName(user.messName);
            if (user.roomNo) setRoomNo(user.roomNo);
            if (user.walletBalance !== undefined)
              setUserWallet(user.walletBalance);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [session]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.deliveryCharge !== undefined)
          setAdminDeliveryCharge(data.deliveryCharge);
        if (data.isFreeDelivery !== undefined)
          setIsFreeDeliveryPromo(data.isFreeDelivery);
      })
      .catch((err) => console.error(err));

    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const extras = data.filter(
            (item: any) => item.mealSlot === "EXTRA_ADDON" && item.isAvailable,
          );
          if (extras.length > 0) {
            setExtraItems(
              extras.map((item: any) => ({
                id: item.id,
                name: item.nameBn,
                price: item.price,
                count: 0,
              })),
            );
          }

          const customs = data.filter(
            (item: any) => item.mealSlot === "CUSTOM" && item.isAvailable,
          );
          if (customs.length > 0) {
            setCustomItems(
              customs.map((item: any) => ({
                id: item.id,
                name: item.nameBn,
                price: item.price,
                selected: false,
                img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80",
                badge: "তাজা খাবার",
              })),
            );
          }

          const regOverrides: {
            [key: string]: { name: string; price: number };
          } = {};
          data.forEach((item: any) => {
            if (item.mealSlot.startsWith("REGULAR_")) {
              regOverrides[item.mealSlot] = {
                name: item.nameBn,
                price: item.price,
              };
            }
          });
          setRegularMenuOverrides(regOverrides);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const effectiveDeliveryCharge =
    deliveryMethod === "PICKUP"
      ? 0
      : isFreeDeliveryPromo
        ? 0
        : adminDeliveryCharge;

  // ৩-দিনের সাইকেল হিসাব
  const selectedDay = currentMonthDays[0] || {
    isFriday: false,
    rawDate: new Date(),
  };
  const cycleIndex =
    Math.abs(Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24))) % 3;

  const lunchCycle = [
    {
      title:
        regularMenuOverrides["REGULAR_LUNCH_DAY1"]?.name ||
        "১ম দিন: ডিম ভুনা + ঘন ডাল + আলু ভর্তা + ভাত",
      price: regularMenuOverrides["REGULAR_LUNCH_DAY1"]?.price || 70,
      img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80",
      desc: "গরম ধোঁয়া ওঠা বাসমতি চালের ভাত ও ডিম ভুনা।",
    },
    {
      title:
        regularMenuOverrides["REGULAR_LUNCH_DAY2"]?.name ||
        "২য় দিন: রুই মাছের ঝোল + সবজি + ডাল + ভাত",
      price: regularMenuOverrides["REGULAR_LUNCH_DAY2"]?.price || 80,
      img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
      desc: "তাজা বড় রুই মাছের জিরা বাটা ঝোল।",
    },
    {
      title:
        regularMenuOverrides["REGULAR_LUNCH_DAY3"]?.name ||
        "৩য় দিন: দেশি মুরগির ঝোল + সবজি + ডাল + ভাত",
      price: regularMenuOverrides["REGULAR_LUNCH_DAY3"]?.price || 90,
      img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80",
      desc: "দেশি মুরগির মাংসের তরকারি ও ঘন ডাল।",
    },
  ];

  const fridayLunch = {
    title:
      regularMenuOverrides["REGULAR_FRIDAY"]?.name ||
      "শুক্রবার স্পেশাল: শাহী বিফ দম বিরিয়ানি + বোরহানি",
    price: regularMenuOverrides["REGULAR_FRIDAY"]?.price || 130,
    img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80",
    desc: "গাওয়া ঘিয়ে রান্না বিফ দম বিরিয়ানি ও বোরহানি।",
  };

  const breakfastOptions = {
    KHICHURI: {
      title:
        regularMenuOverrides["REGULAR_BREAKFAST_KHICHURI"]?.name ||
        "ভুনা খিচুড়ি + ডিম ভুনা/ভাজি",
      price: regularMenuOverrides["REGULAR_BREAKFAST_KHICHURI"]?.price || 45,
      img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80",
      desc: "মুগ ও মসুর ডালে রান্না ঝরঝরে খিচুড়ি।",
    },
    PARATHA: {
      title:
        regularMenuOverrides["REGULAR_BREAKFAST_PARATHA"]?.name ||
        "গরম পরোটা (৩টি) + ডিম ভাজি + ডাল-ভাজি",
      price: regularMenuOverrides["REGULAR_BREAKFAST_PARATHA"]?.price || 40,
      img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80",
      desc: "মুচমুচে গরম পরোটা ও ডিম ভাজি।",
    },
  };

  const dinnerData = {
    title:
      cycleIndex % 2 === 0
        ? regularMenuOverrides["REGULAR_DINNER_1"]?.name ||
          "রাতের স্পেশাল ভুনা খিচুড়ি + বেগুন ও ডিম ভাজি"
        : regularMenuOverrides["REGULAR_DINNER_2"]?.name ||
          "রাতের ভাত + ডিম ভুনা + স্পেশাল ভর্তা + ডাল",
    price: regularMenuOverrides["REGULAR_DINNER_1"]?.price || 65,
    img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    desc: "হালকা ও পুষ্টিকর সুষম রাতের খাবার।",
  };

  let currentRegularMenu = lunchCycle[cycleIndex];
  if (selectedSlot === "BREAKFAST") {
    currentRegularMenu = breakfastOptions[breakfastChoice];
  } else if (selectedSlot === "LUNCH") {
    currentRegularMenu = lunchCycle[cycleIndex];
  } else {
    currentRegularMenu = dinnerData;
  }

  // তারিখ টগল করা
  const toggleDateSelection = (dayObj: any) => {
    setQuickPreset("CUSTOM");
    setSelectedDatesMap((prev) => {
      const copy = { ...prev };
      if (copy[dayObj.fullDate]) {
        delete copy[dayObj.fullDate];
      } else {
        copy[dayObj.fullDate] = {
          date: dayObj.fullDate,
          dayName: dayObj.dayName,
          dayNumber: dayObj.dayNumber,
          monthName: dayObj.monthName,
          breakfast: true,
          lunch: true,
          dinner: true,
        };
      }
      return copy;
    });
  };

  const toggleDateSlot = (
    dateStr: string,
    slotKey: "breakfast" | "lunch" | "dinner",
  ) => {
    setSelectedDatesMap((prev) => {
      const dayConfig = prev[dateStr];
      if (!dayConfig) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...dayConfig,
          [slotKey]: !dayConfig[slotKey],
        },
      };
    });
  };

  const selectedDatesList = Object.values(selectedDatesMap);
  let totalBreakfasts = 0;
  let totalLunches = 0;
  let totalDinners = 0;

  selectedDatesList.forEach((d) => {
    if (d.breakfast) totalBreakfasts++;
    if (d.lunch) totalLunches++;
    if (d.dinner) totalDinners++;
  });

  const totalMealSlotsCount = totalBreakfasts + totalLunches + totalDinners;

  const extraItemsTotal = extraItems.reduce(
    (acc, item) => acc + item.price * item.count,
    0,
  );
  const customItemsTotal = customItems
    .filter((item) => item.selected)
    .reduce((acc, item) => acc + item.price, 0);

  let calculatedMealTotal = 0;
  let packageSummaryTitle = "";

  if (selectedPackage === "REGULAR") {
    const regularMealsCost =
      totalBreakfasts * breakfastOptions.PARATHA.price +
      totalLunches * 80 +
      totalDinners * 60;
    let discount = 0;
    if (quickPreset === "7DAYS") discount = 60;
    if (quickPreset === "15DAYS") discount = 150;
    if (quickPreset === "30DAYS") discount = 350;

    calculatedMealTotal =
      Math.max(0, regularMealsCost - discount) + extraItemsTotal;
    packageSummaryTitle = `${quickPreset === "7DAYS" ? "১ সপ্তাহ প্যাকেজ" : quickPreset === "15DAYS" ? "১৫ দিনের প্যাকেজ" : quickPreset === "30DAYS" ? "১ মাস প্যাকেজ সপ্তাহ" : "কাস্টম ডেট-রেঞ্জ"} (${selectedDatesList.length} দিন, মোট ${totalMealSlotsCount} বেলা)`;
  } else {
    calculatedMealTotal =
      customItemsTotal * totalMealSlotsCount + extraItemsTotal;
    packageSummaryTitle = `কাস্টম প্লেট মিল (${selectedDatesList.length} দিন, মোট ${totalMealSlotsCount} বেলা)`;
  }

  const grandTotal = Math.max(0, calculatedMealTotal + effectiveDeliveryCharge);

  const updateExtraCount = (id: string, delta: number) => {
    setExtraItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, count: Math.max(0, item.count + delta) };
        }
        return item;
      }),
    );
  };

  const toggleCustomItem = (id: string) => {
    setCustomItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const copyBkashNumber = () => {
    navigator.clipboard.writeText(shopBkashNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) {
      signIn("google");
      return;
    }
    if (!rechargeTrxId) {
      alert("অনুগ্রহ করে TrxID দিন!");
      return;
    }

    setIsSubmittingRecharge(true);
    try {
      const res = await fetch("/api/wallet/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          customerName: customerName || session.user.name,
          customerPhone: customerPhone,
          amount: rechargeAmount,
          paymentMethod: rechargePaymentMethod,
          trxId: rechargeTrxId,
        }),
      });

      if (res.ok) {
        alert(
          "আলহামদুলিল্লাহ! আপনার রিচার্জ রিকোয়েস্ট এডমিনের কাছে পাঠানো হয়েছে।",
        );
        setIsRechargeModalOpen(false);
        setRechargeTrxId("");
      } else {
        alert("রিকোয়েস্ট পাঠানো সম্ভব হয়নি!");
      }
    } catch (err) {
      alert("সার্ভারে সমস্যা হয়েছে!");
    } finally {
      setIsSubmittingRecharge(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedDatesList.length === 0 || totalMealSlotsCount === 0) {
      alert("অনুগ্রহ করে অন্তত একটি দিন এবং বেলার খাবার সিলেক্ট করুন!");
      return;
    }
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert("অনুগ্রহ করে নাম এবং মোবাইল নম্বর দিন!");
      return;
    }
    if (paymentMethod === "WALLET" && userWallet < grandTotal) {
      alert(
        "আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! বিকাশ নির্বাচন করুন অথবা ওয়ালেট রিচার্জ করুন।",
      );
      return;
    }
    if (paymentMethod === "BKASH" && !trxId) {
      alert("অনুগ্রহ করে বিকাশ / নগদের TrxID দিন!");
      return;
    }

    setIsSubmitting(true);

    try {
      if (session?.user?.email) {
        fetch("/api/auth/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: session.user.email,
            name: customerName,
            phone: customerPhone,
            messName,
            roomNo,
          }),
        }).catch((e) => console.error(e));
      }

      for (const dayConfig of selectedDatesList) {
        const daySlotsObj = {
          breakfast: dayConfig.breakfast,
          lunch: dayConfig.lunch,
          dinner: dayConfig.dinner,
        };

        const dayMealsCount =
          (dayConfig.breakfast ? 1 : 0) +
          (dayConfig.lunch ? 1 : 0) +
          (dayConfig.dinner ? 1 : 0);
        if (dayMealsCount === 0) continue;

        const ratio = dayMealsCount / totalMealSlotsCount;
        const daySubTotal = calculatedMealTotal * ratio;
        const dayDelivery = effectiveDeliveryCharge / selectedDatesList.length;

        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            customerPhone,
            messName: messName || "সাধারণ মেস",
            roomNo: roomNo || "N/A",
            targetDate: dayConfig.date,
            mealSlot: JSON.stringify(daySlotsObj),
            packageType: `${selectedPackage} (${packageSummaryTitle})`,
            deliveryType: deliveryMethod,
            deliveryCharge: dayDelivery,
            totalAmount: daySubTotal + dayDelivery,
            paymentMethod:
              paymentMethod === "BKASH" ? `BKASH (${trxId})` : "WALLET",
            trxId: trxId || "",
            durationDays: 1,
          }),
        });
      }

      setOrderSuccess(true);
      setIsCheckoutOpen(false);
      setTrxId("");
      if (session?.user?.email) {
        fetch(`/api/auth/user?email=${encodeURIComponent(session.user.email)}`)
          .then((r) => r.json())
          .then((u) => u && setUserWallet(u.walletBalance || 0));
      }
      setTimeout(() => setOrderSuccess(false), 7000);
    } catch (err) {
      alert("সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 pb-28 font-sans antialiased">
      {/* হেডার */}
      <header className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-4 pt-3 pb-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-amber-300">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 tracking-wider uppercase font-bold flex items-center gap-1">
                  মেস ডেলিভারি এরিয়া{" "}
                  <ChevronDown className="w-3 h-3 text-amber-300" />
                </span>
                <p className="text-xs font-bold text-white truncate max-w-[160px]">
                  {messName
                    ? `${messName} (রুম: ${roomNo})`
                    : "রাজশাহী সিটি, বাংলাদেশ"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  isLoggedIn ? setIsRechargeModalOpen(true) : signIn("google")
                }
                className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-inner transition-all"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-xs font-black text-amber-200">
                  ৳{userWallet}
                </span>
                <span className="text-[9px] bg-amber-400 text-slate-900 font-extrabold px-1 rounded">
                  +
                </span>
              </button>

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-7 h-7 rounded-full bg-emerald-900/85 border border-emerald-600 flex items-center justify-center text-emerald-200 hover:text-white"
                  title="লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="bg-white text-emerald-900 font-extrabold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm"
                >
                  <LogIn className="w-3 h-3 text-emerald-700" /> লগইন
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              আদ-দাওয়া ফুড শপ
              <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded">
                HALAL
              </span>
            </h1>
            <Link
              href="/my-orders"
              className="text-[11px] font-bold text-emerald-900 bg-amber-300 hover:bg-amber-400 px-3 py-1.5 rounded-xl shadow flex items-center gap-1"
            >
              <ReceiptText className="w-3.5 h-3.5" /> আমার অর্ডার
            </Link>
          </div>
        </div>
      </header>

      {/* মূল কন্টেন্ট */}
      <main className="max-w-md mx-auto px-4 mt-3 space-y-4">
        {orderSuccess && (
          <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-xl flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 shrink-0 text-amber-300" />
            <div>
              <h4 className="font-extrabold text-sm">
                আলহামদুলিল্লাহ! অর্ডার নিশ্চিত হয়েছে 🎉
              </h4>
              <p className="text-xs text-emerald-100 mt-0.5">
                আপনার প্রতিটি নির্বাচিত দিনের শিডিউল সেভ হয়েছে।
              </p>
            </div>
          </div>
        )}

        {/* ভিডিও টিউটোরিয়াল বাটন */}
        <div
          onClick={() => setIsVideoModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-3 shadow-md flex items-center justify-between text-white cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] border border-amber-300/40"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center shadow-inner animate-pulse">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full inline-block">
                ভিডিও গাইডলাইন
              </span>
              <h4 className="text-xs font-black mt-0.5 leading-tight">
                কীভাবে খাবার অর্ডার ও মিল ক্যানসেল করবেন?
              </h4>
              <p className="text-[10px] text-amber-100">
                অর্ডার প্রক্রিয়ার বিস্তারিত ভিডিও টিউটোরিয়াল দেখুন
              </p>
            </div>
          </div>
          <span className="text-[11px] font-extrabold bg-white text-amber-900 px-3 py-1.5 rounded-xl shadow-sm shrink-0">
            ভিডিও দেখুন
          </span>
        </div>

        {/* প্যাকেজ সিলেকশন */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedPackage("REGULAR")}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              selectedPackage === "REGULAR"
                ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-md"
                : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${selectedPackage === "REGULAR" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}
            >
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-emerald-700 uppercase">
                ১ম অপশন
              </span>
              <h3 className="font-extrabold text-slate-800 text-sm">
                রেগুলার প্যাকেজ
              </h3>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPackage("CUSTOM")}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              selectedPackage === "CUSTOM"
                ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-md"
                : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${selectedPackage === "CUSTOM" ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-700"}`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-amber-700 uppercase">
                ২য় অপশন
              </span>
              <h3 className="font-extrabold text-slate-800 text-sm">
                কাস্টম প্লেট
              </h3>
            </div>
          </button>
        </div>

        {/* রেগুলার প্যাকেজ হলে রুটিন ফুড কার্ড শো করবে */}
        {selectedPackage === "REGULAR" ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="relative h-44 w-full">
              <img
                src={currentRegularMenu.img}
                alt={currentRegularMenu.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <span className="text-amber-300 text-[10px] font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />{" "}
                    ৪.৯ সুষম সাইকেল রুটিন
                  </span>
                  <h3 className="text-white font-extrabold text-base leading-tight mt-0.5">
                    {currentRegularMenu.title}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-amber-300">
                    ৳{currentRegularMenu.price}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 text-xs text-slate-600 leading-relaxed">
              {currentRegularMenu.desc}
            </div>
          </div>
        ) : (
          /* কাস্টম প্লেট গ্রিড ভিউ (ছবি ও ব্যাজসহ) */
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-700">
                খাবার পছন্দ করে নিজের প্লেট সাজান:
              </h3>
              <span className="text-[11px] font-bold text-emerald-700">
                প্লেটের মোট: ৳{customItemsTotal}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {customItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCustomItem(item.id)}
                  className={`bg-white rounded-2xl border p-2.5 cursor-pointer transition-all flex flex-col justify-between ${
                    item.selected
                      ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20"
                      : "border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                    {item.selected && (
                      <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white rounded-full p-1 shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1">
                      {item.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-emerald-800">
                        ৳{item.price}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${item.selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {item.selected ? "সিলেক্টেড" : "+ যোগ"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* নতুন চাহিদা: ৭, ১৫, ৩০ দিন ১-ক্লিক প্রিসেট */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              ১-ক্লিকে প্যাকেজ দিন সিলেক্ট করুন:
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
              {quickPreset === "7DAYS"
                ? "৭ দিনের প্যাকেজ"
                : quickPreset === "15DAYS"
                  ? "১৫ দিনের প্যাকেজ"
                  : quickPreset === "30DAYS"
                    ? "৩০ দিনের প্যাকেজ"
                    : "কাস্টম দিন"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyQuickPreset(7, "7DAYS")}
              className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                quickPreset === "7DAYS"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              📅 ৭ দিন
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset(15, "15DAYS")}
              className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                quickPreset === "15DAYS"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              📅 ১৫ দিন
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset(30, "30DAYS")}
              className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                quickPreset === "30DAYS"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              📅 ৩০ দিন
            </button>
          </div>
        </div>

        {/* ক্যালেন্ডার ও পার-ডে স্লট কাস্টমাইজার */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              তারিখ সিলেক্ট করুন (একাধিক দিন বেছে নিতে পারেন):
            </span>
            <div className="relative">
              <select
                value={`${selectedMonth.monthIndex}-${selectedMonth.year}`}
                onChange={(e) => {
                  const [mIdx, yr] = e.target.value.split("-").map(Number);
                  const mObj = availableMonths.find(
                    (m) => m.monthIndex === mIdx && m.year === yr,
                  );
                  if (mObj) setSelectedMonth(mObj);
                }}
                className="text-xs font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl px-2.5 py-1 appearance-none pr-6 focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option
                    key={`${m.monthIndex}-${m.year}`}
                    value={`${m.monthIndex}-${m.year}`}
                  >
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scroll-smooth">
            {currentMonthDays.map((day) => {
              const isSelected = !!selectedDatesMap[day.fullDate];
              return (
                <button
                  key={day.fullDate}
                  type="button"
                  onClick={() => toggleDateSelection(day)}
                  className={`shrink-0 w-14 py-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all relative ${
                    isSelected
                      ? "bg-gradient-to-b from-emerald-600 to-emerald-700 border-emerald-600 text-white shadow-md shadow-emerald-700/30 scale-105"
                      : day.isFriday
                        ? "bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center shadow">
                      ✓
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold ${isSelected ? "text-emerald-100" : "text-slate-400"}`}
                  >
                    {day.dayName}
                  </span>
                  <span className="text-lg font-black leading-tight mt-0.5">
                    {day.dayNumber}
                  </span>
                  <span
                    className={`text-[9px] font-semibold ${isSelected ? "text-emerald-100" : "text-slate-500"}`}
                  >
                    {day.monthName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* প্রতি দিনের বেলা কাস্টমাইজেশন বক্স */}
          {selectedDatesList.length > 0 && (
            <div className="border-t pt-3 space-y-2.5 animate-in fade-in">
              <span className="text-xs font-extrabold text-emerald-950 block">
                নির্বাচিত দিনগুলোর বেলা কাস্টমাইজ করুন (কোন দিন কোন বেলা খাবেন):
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedDatesList.map((dConfig) => (
                  <div
                    key={dConfig.date}
                    className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-extrabold text-xs text-slate-800 block">
                        {dConfig.dayName}বার, {dConfig.dayNumber}{" "}
                        {dConfig.monthName}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        {!dConfig.breakfast && !dConfig.lunch && !dConfig.dinner
                          ? "⚠️ কোনো বেলা সিলেক্ট নেই"
                          : "বেলা চালু আছে"}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          toggleDateSlot(dConfig.date, "breakfast")
                        }
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                          dConfig.breakfast
                            ? "bg-amber-100 text-amber-900 border-amber-400 shadow-xs"
                            : "bg-white text-slate-400 border-slate-200"
                        }`}
                      >
                        সকাল
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDateSlot(dConfig.date, "lunch")}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                          dConfig.lunch
                            ? "bg-emerald-100 text-emerald-900 border-emerald-400 shadow-xs"
                            : "bg-white text-slate-400 border-slate-200"
                        }`}
                      >
                        দুপুর
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDateSlot(dConfig.date, "dinner")}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                          dConfig.dinner
                            ? "bg-blue-100 text-blue-900 border-blue-400 shadow-xs"
                            : "bg-white text-slate-400 border-slate-200"
                        }`}
                      >
                        রাত
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* অতিরিক্ত খাবার সেকশন */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" /> অতিরিক্ত
                খাবার যোগ করুন (ঐচ্ছিক):
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                প্রতিদিনের জন্য এক্সট্রা আইটেম
              </p>
            </div>
            {extraItemsTotal > 0 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                +৳{extraItemsTotal}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {extraItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-bold">
                    ৳{item.price}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.count > 0 && (
                    <button
                      type="button"
                      onClick={() => updateExtraCount(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {item.count > 0 && (
                    <span className="text-xs font-bold w-4 text-center">
                      {item.count}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => updateExtraCount(item.id, 1)}
                    className={`h-7 px-2.5 rounded-lg font-bold text-xs flex items-center gap-1 ${item.count > 0 ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
                  >
                    <Plus className="w-3.5 h-3.5" /> {item.count === 0 && "যোগ"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ডেলিভারি মাধ্যম */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              ডেলিভারি মাধ্যম:
            </span>
            {isFreeDeliveryPromo && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                🎉 ফ্রি ডেলিভারি অফার!
              </span>
            )}
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setDeliveryMethod("PICKUP")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${deliveryMethod === "PICKUP" ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}
            >
              <Store className="w-3.5 h-3.5" /> পিকআপ (০৳)
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("HOME_DELIVERY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${deliveryMethod === "HOME_DELIVERY" ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}
            >
              <Truck className="w-3.5 h-3.5" /> হোম ডেলিভারি (
              {effectiveDeliveryCharge === 0
                ? "ফ্রি"
                : `+${effectiveDeliveryCharge}৳`}
              )
            </button>
          </div>
        </div>
      </main>

      {/* ফ্লোটিং বটম বার */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl z-30">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              {packageSummaryTitle}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-800">
                ৳{grandTotal}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                ({selectedDatesList.length} দিন সিলেক্টেড)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleProceedToCheckout}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-3 px-5 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>অর্ডার সম্পন্ন করুন</span>
          </button>
        </div>
      </div>

      {/* চেকআউট মডাল */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  আপনার প্রি-অর্ডার ফাইনাল করুন
                </h3>
                <p className="text-[11px] text-slate-500">
                  মোট {selectedDatesList.length} দিনের মিল সাবস্ক্রিপশন
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* পেমেন্ট পদ্ধতি */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                পেমেন্ট মেথড:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("BKASH")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    paymentMethod === "BKASH"
                      ? "border-pink-600 bg-pink-50 text-pink-900 font-bold"
                      : "border-slate-200"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-pink-600" />
                  <span className="text-xs">বিকাশ / নগদ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("WALLET")}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    paymentMethod === "WALLET"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold"
                      : "border-slate-200"
                  }`}
                >
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs">ওয়ালেট (৳{userWallet})</span>
                </button>
              </div>

              {paymentMethod === "BKASH" && (
                <div className="bg-pink-50/70 p-3 rounded-2xl border border-pink-200 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Send Money নাম্বার:
                    </span>
                    <button
                      type="button"
                      onClick={copyBkashNumber}
                      className="font-mono font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-lg flex items-center gap-1"
                    >
                      {shopBkashNumber}
                      {copiedNumber ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="বিকাশ TrxID লিখুন"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-pink-300 uppercase tracking-wider"
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                  আপনার নাম:
                </label>
                <input
                  type="text"
                  placeholder="নাম"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                  মোবাইল নম্বর:
                </label>
                <input
                  type="tel"
                  placeholder="নম্বর"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              {deliveryMethod === "HOME_DELIVERY" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      মেসের নাম:
                    </label>
                    <input
                      type="text"
                      placeholder="মেস"
                      value={messName}
                      onChange={(e) => setMessName(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-0.5">
                      রুম নম্বর:
                    </label>
                    <input
                      type="text"
                      placeholder="রুম"
                      value={roomNo}
                      onChange={(e) => setRoomNo(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>মোট নির্বাচিত দিন:</span>
                  <span className="font-bold text-slate-800">
                    {selectedDatesList.length} দিন (মোট {totalMealSlotsCount}{" "}
                    বেলা)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>খাবারের মোট বিল:</span>
                  <span>৳{calculatedMealTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>ডেলিভারি চার্জ:</span>
                  <span>
                    {effectiveDeliveryCharge === 0
                      ? "০৳ (ফ্রি)"
                      : `৳${effectiveDeliveryCharge}`}
                  </span>
                </div>
                <div className="flex justify-between font-black text-slate-900 border-t pt-1 mt-1 text-sm">
                  <span>সর্বমোট বিল:</span>
                  <span className="text-emerald-700">৳{grandTotal}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingBag className="w-4 h-4" />
                )}
                <span>কনফার্ম প্রি-অর্ডার (৳{grandTotal})</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ভিডিও টিউটোরিয়াল মডাল */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-sm">
                  অর্ডার করার ভিডিও গাইডলাইন
                </h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative pt-[56.25%] bg-black">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="টিউটোরিয়াল ভিডিও"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
