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

export default function MealOrderApp() {
  // নেক্সট-অথ সেশন (আসল গুগল লগইন)
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

  const [selectedDay, setSelectedDay] = useState(
    currentMonthDays[0] || {
      fullDate: new Date().toISOString().split("T")[0],
      dayName: "আজ",
      dayNumber: new Date().getDate(),
      monthName: BANGLA_MONTHS_SHORT[new Date().getMonth()],
      year: new Date().getFullYear(),
      isFriday: new Date().getDay() === 5,
      rawDate: new Date(),
    },
  );

  useEffect(() => {
    if (currentMonthDays.length > 0) {
      setSelectedDay(currentMonthDays[0]);
    }
  }, [currentMonthDays]);

  const [selectedPackage, setSelectedPackage] = useState<"REGULAR" | "CUSTOM">(
    "REGULAR",
  );
  const [bookingMode, setBookingMode] = useState<
    "SINGLE" | "FULL_DAY" | "WEEKLY" | "MONTHLY"
  >("SINGLE");

  const [selectedSlot, setSelectedSlot] = useState<
    "BREAKFAST" | "LUNCH" | "DINNER"
  >("LUNCH");
  const [breakfastChoice, setBreakfastChoice] = useState<
    "KHICHURI" | "PARATHA"
  >("KHICHURI");

  const [subscribedSlots, setSubscribedSlots] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
  });

  const [deliveryMethod, setDeliveryMethod] = useState<
    "HOME_DELIVERY" | "PICKUP"
  >("HOME_DELIVERY");
  const [adminDeliveryCharge, setAdminDeliveryCharge] = useState(15);
  const [isFreeDeliveryPromo, setIsFreeDeliveryPromo] = useState(false);

  const [extraItems, setExtraItems] = useState([
    { id: "ex1", name: "অতিরিক্ত সাদা ভাত", price: 15, count: 0 },
    { id: "ex2", name: "ডিম পোচ / ওমলেট", price: 20, count: 0 },
    { id: "ex3", name: "স্পেশাল আলু ভর্তা (গাওয়া ঘি)", price: 10, count: 0 },
    { id: "ex4", name: "ঘন মসুর ডাল বাটি", price: 15, count: 0 },
    { id: "ex5", name: "শসা ও লেবুর ফ্রেশ সালাদ", price: 10, count: 0 },
  ]);

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

  // কাস্টমার তথ্য (প্রোফাইল থেকে অটো-লোড হবে)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [messName, setMessName] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [userWallet, setUserWallet] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // গুগল দিয়ে সাইন-ইন করা থাকলে ইউজারের তথ্য অটো-লোড
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

  // এডমিন সেটিংস ও মেনু ফেচ
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

  const cycleIndex =
    Math.abs(
      Math.floor(selectedDay.rawDate.getTime() / (1000 * 60 * 60 * 24)),
    ) % 3;

  const lunchCycle = [
    {
      title:
        regularMenuOverrides["REGULAR_LUNCH_DAY1"]?.name ||
        "১ম দিন: ডিম ভুনা + ঘন ডাল + আলু ভর্তা + ভাত",
      price: regularMenuOverrides["REGULAR_LUNCH_DAY1"]?.price || 70,
      img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80",
      desc: "গরম ধোঁয়া ওঠা বাসমতি চালের ভাত, দেশি ডিম ভুনা ও খাঁটি সরিষার তেলের আলু ভর্তা।",
    },
    {
      title:
        regularMenuOverrides["REGULAR_LUNCH_DAY2"]?.name ||
        "২য় দিন: রুই মাছের ঝোল + সবজি + পাতলা ডাল + ভাত",
      price: regularMenuOverrides["REGULAR_LUNCH_DAY2"]?.price || 80,
      img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
      desc: "তাজা বড় রুই মাছের জিরা বাটা ঝোল ও মৌসুমি সবজির পুষ্টিকর আয়োজন।",
    },
    {
      title:
        regularMenuOverrides["REGULAR_LUNCH_DAY3"]?.name ||
        "৩য় দিন: দেশি মুরগির ঝোল + সবজি + ডাল + ভাত",
      price: regularMenuOverrides["REGULAR_LUNCH_DAY3"]?.price || 90,
      img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80",
      desc: "ঘরোয়া মশলায় কষানো দেশি মুরগির মাংসের তরকারি ও ঘন ডাল।",
    },
  ];

  const fridayLunch = {
    title:
      regularMenuOverrides["REGULAR_FRIDAY"]?.name ||
      "শুক্রবার স্পেশাল: শাহী বিফ দম বিরিয়ানি + বোরহানি",
    price: regularMenuOverrides["REGULAR_FRIDAY"]?.price || 130,
    img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80",
    desc: "গাওয়া ঘিয়ে রান্না রসালো বিফ দম বিরিয়ানি ও ঠান্ডা পুদিনা বোরহানি।",
  };

  const breakfastOptions = {
    KHICHURI: {
      title:
        regularMenuOverrides["REGULAR_BREAKFAST_KHICHURI"]?.name ||
        "ভুনা খিচুড়ি + ডিম ভুনা/ভাজি",
      price: regularMenuOverrides["REGULAR_BREAKFAST_KHICHURI"]?.price || 45,
      img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80",
      desc: "মুগ ও মসুর ডালে রান্না ঝরঝরে ভুনা খিচুড়ি ও ডিম।",
    },
    PARATHA: {
      title:
        regularMenuOverrides["REGULAR_BREAKFAST_PARATHA"]?.name ||
        "গরম পরোটা (৩টি) + ডিম ভাজি + ডাল-ভাজি",
      price: regularMenuOverrides["REGULAR_BREAKFAST_PARATHA"]?.price || 40,
      img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80",
      desc: "মুচমুচে গরম ৩টি পরোটা, ডিম পোচ বা ওমলেট ও বুটের ডাল।",
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
    desc: "হালকা ও পুষ্টিকর সুষম রাতের আহার।",
  };

  let currentRegularMenu = lunchCycle[cycleIndex];
  if (selectedSlot === "BREAKFAST") {
    currentRegularMenu = breakfastOptions[breakfastChoice];
  } else if (selectedSlot === "LUNCH") {
    currentRegularMenu = selectedDay.isFriday
      ? fridayLunch
      : lunchCycle[cycleIndex];
  } else {
    currentRegularMenu = dinnerData;
  }

  const extraItemsTotal = extraItems.reduce(
    (acc, item) => acc + item.price * item.count,
    0,
  );
  const customItemsTotal = customItems
    .filter((item) => item.selected)
    .reduce((acc, item) => acc + item.price, 0);

  const breakfastRate = breakfastOptions.PARATHA.price;
  const lunchRate = 80;
  const dinnerRate = 60;

  const selectedSlotsDailyRate =
    (subscribedSlots.breakfast ? breakfastRate : 0) +
    (subscribedSlots.lunch ? lunchRate : 0) +
    (subscribedSlots.dinner ? dinnerRate : 0);

  const selectedSlotsCount =
    (subscribedSlots.breakfast ? 1 : 0) +
    (subscribedSlots.lunch ? 1 : 0) +
    (subscribedSlots.dinner ? 1 : 0);

  const subscribedSlotNames = [];
  if (subscribedSlots.breakfast) subscribedSlotNames.push("সকাল");
  if (subscribedSlots.lunch) subscribedSlotNames.push("দুপুর");
  if (subscribedSlots.dinner) subscribedSlotNames.push("রাত");
  const subscribedSlotsText =
    subscribedSlotNames.join(" + ") || "কোনো বেলা নির্বাচিত নেই";

  let calculatedMealTotal = 0;
  let packageSummaryTitle = "";
  let durationDaysCount = 1;

  if (selectedPackage === "REGULAR") {
    if (bookingMode === "SINGLE") {
      calculatedMealTotal = currentRegularMenu.price + extraItemsTotal;
      packageSummaryTitle = `${selectedDay.dayName}বার (${selectedSlot === "BREAKFAST" ? "সকাল" : selectedSlot === "LUNCH" ? "দুপুর" : "রাত"})`;
      durationDaysCount = 1;
    } else if (bookingMode === "FULL_DAY") {
      calculatedMealTotal = 180 + extraItemsTotal;
      packageSummaryTitle = `${selectedDay.dayName}বার (সারাদিনের ৩ বেলা)`;
      durationDaysCount = 1;
    } else if (bookingMode === "WEEKLY") {
      calculatedMealTotal = selectedSlotsDailyRate * 7 - 60 + extraItemsTotal;
      packageSummaryTitle = `১ সপ্তাহ [${subscribedSlotsText}] (মোট ${selectedSlotsCount * 7} বেলা)`;
      durationDaysCount = 7;
    } else {
      calculatedMealTotal = selectedSlotsDailyRate * 30 - 300 + extraItemsTotal;
      packageSummaryTitle = `১ মাস [${subscribedSlotsText}] (মোট ${selectedSlotsCount * 30} বেলা)`;
      durationDaysCount = 30;
    }
  } else {
    if (bookingMode === "SINGLE") {
      calculatedMealTotal = customItemsTotal;
      packageSummaryTitle = `${selectedDay.dayName}বার (কাস্টম প্লেট - ১ বেলা)`;
      durationDaysCount = 1;
    } else if (bookingMode === "FULL_DAY") {
      calculatedMealTotal = customItemsTotal * 3;
      packageSummaryTitle = `${selectedDay.dayName}বার (কাস্টম প্লেট - ৩ বেলা)`;
      durationDaysCount = 1;
    } else if (bookingMode === "WEEKLY") {
      calculatedMealTotal = customItemsTotal * selectedSlotsCount * 7;
      packageSummaryTitle = `১ সপ্তাহ কাস্টম [${subscribedSlotsText}]`;
      durationDaysCount = 7;
    } else {
      calculatedMealTotal = customItemsTotal * selectedSlotsCount * 30;
      packageSummaryTitle = `১ মাস কাস্টম [${subscribedSlotsText}]`;
      durationDaysCount = 30;
    }
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

  // ওয়ালেট রিচার্জ রিকোয়েস্ট সাবমিট
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
          customerName: customerName || session.user.name || "সম্মানিত গ্রাহক",
          customerPhone: customerPhone || "N/A",
          amount: rechargeAmount,
          paymentMethod: rechargePaymentMethod,
          trxId: rechargeTrxId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          "আলহামদুলিল্লাহ! আপনার রিচার্জ রিকোয়েস্ট এডমিনের কাছে পাঠানো হয়েছে। এডমিন অনুমোদন করলেই আপনার ওয়ালেটে টাকা যুক্ত হবে।",
        );
        setIsRechargeModalOpen(false);
        setRechargeTrxId("");
      } else {
        alert(data.error || "রিকোয়েস্ট পাঠানো সম্ভব হয়নি!");
      }
    } catch (err) {
      alert("সার্ভারে সমস্যা হয়েছে!");
    } finally {
      setIsSubmittingRecharge(false);
    }
  };

  // অর্ডার বাটন ক্লিক (লগইন চেক)
  const handleProceedToCheckout = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  // ফাইনাল অর্ডার সাবমিট (ঠিকানা ডাটাবেজে স্থায়ীভাবে সেভ থাকবে)
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
      // প্রোফাইল স্থায়ীভাবে সেভ যাতে পরের বার আর কিছু না চাওয়া হয়
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

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          messName: messName || "সাধারণ মেস",
          roomNo: roomNo || "N/A",
          targetDate: selectedDay.fullDate,
          mealSlot:
            bookingMode === "SINGLE" ? selectedSlot : `PACKAGE_${bookingMode}`,
          packageType: `${selectedPackage} (${packageSummaryTitle})`,
          deliveryType: deliveryMethod,
          deliveryCharge: effectiveDeliveryCharge,
          totalAmount: grandTotal,
          paymentMethod:
            paymentMethod === "BKASH" ? `BKASH (${trxId})` : "WALLET",
          trxId: trxId || "",
          durationDays: durationDaysCount,
        }),
      });

      if (res.ok) {
        setOrderSuccess(true);
        setIsCheckoutOpen(false);
        setTrxId("");
        // ওয়ালেট রিফ্রেশ
        if (session?.user?.email) {
          fetch(
            `/api/auth/user?email=${encodeURIComponent(session.user.email)}`,
          )
            .then((r) => r.json())
            .then((u) => u && setUserWallet(u.walletBalance || 0));
        }
        setTimeout(() => setOrderSuccess(false), 7000);
      } else {
        alert("অর্ডার গ্রহণ করা সম্ভব হয়নি!");
      }
    } catch (err) {
      alert("সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 pb-28 font-sans antialiased">
      {/* ১. হেডার */}
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

            {/* ওয়ালেট ও গুগল লগইন বাটন */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  isLoggedIn ? setIsRechargeModalOpen(true) : signIn("google")
                }
                className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-inner transition-all"
                title="ওয়ালেট রিচার্জ করুন"
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
                  className="w-7 h-7 rounded-full bg-emerald-900/80 border border-emerald-600 flex items-center justify-center text-emerald-200 hover:text-white"
                  title="লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="bg-white text-emerald-900 font-extrabold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm hover:bg-emerald-50"
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
              <ReceiptText className="w-3.5 h-3.5" />
              আমার অর্ডার
            </Link>
          </div>
        </div>
      </header>

      {/* মূল কন্টেন্ট */}
      <main className="max-w-md mx-auto px-4 mt-3 space-y-4">
        {orderSuccess && (
          <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-7 h-7 shrink-0 text-amber-300" />
            <div>
              <h4 className="font-extrabold text-sm">
                আলহামদুলিল্লাহ! অর্ডার নিশ্চিত হয়েছে 🎉
              </h4>
              <p className="text-xs text-emerald-100 mt-0.5">
                আপনার প্রতিটি দিনের মিল রান্নার ক্যালেন্ডারে যুক্ত হয়েছে।
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

        {/* ধাপ ১: প্যাকেজ সিলেকশন */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedPackage("REGULAR")}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              selectedPackage === "REGULAR"
                ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-md"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                selectedPackage === "REGULAR"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-100 text-emerald-700"
              }`}
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
              <p className="text-[10px] text-slate-500">৩ দিনের সুষম সাইকেল</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPackage("CUSTOM")}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              selectedPackage === "CUSTOM"
                ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-md"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                selectedPackage === "CUSTOM"
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-100 text-amber-700"
              }`}
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
              <p className="text-[10px] text-slate-500">বাজেট অনুযায়ী আইটেম</p>
            </div>
          </button>
        </div>

        {/* ধাপ ২: বুকিং মোড */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              বুকিং এর ধরন বেছে নিন:
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              ১-ক্লিক বুকিং
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setBookingMode("SINGLE")}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                bookingMode === "SINGLE"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="text-xs font-extrabold">১ বেলার মিল</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                নির্দিষ্ট ১ বেলা
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookingMode("FULL_DAY")}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                bookingMode === "FULL_DAY"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="text-xs font-extrabold text-emerald-800">
                সারাদিন (৩ বেলা)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                সকাল + দুপুর + রাত
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookingMode("WEEKLY")}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                bookingMode === "WEEKLY"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="text-xs font-extrabold text-amber-700">
                ১ সপ্তাহ (৭ দিন)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                পছন্দের বেলা বাছাই
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookingMode("MONTHLY")}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                bookingMode === "MONTHLY"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="text-xs font-extrabold text-purple-700">
                ১ মাস (৩০ দিন)
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                পছন্দের বেলা বাছাই
              </div>
            </button>
          </div>
        </div>

        {/* ধাপ ৩: বেলার কম্বিনেশন */}
        {(bookingMode === "WEEKLY" || bookingMode === "MONTHLY") && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-3.5 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                কোন কোন বেলার খাবার নিবেন সিলেক্ট করুন:
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                নির্বাচিত: {subscribedSlotsText}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  setSubscribedSlots((prev) => ({
                    ...prev,
                    breakfast: !prev.breakfast,
                  }))
                }
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                  subscribedSlots.breakfast
                    ? "bg-white border-emerald-600 shadow-sm text-emerald-950 font-bold ring-1 ring-emerald-500"
                    : "bg-white/50 border-slate-200 text-slate-400"
                }`}
              >
                {subscribedSlots.breakfast ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300" />
                )}
                <div>
                  <div className="text-xs font-extrabold">সকালের নাস্তা</div>
                  <div className="text-[10px] text-slate-500">
                    ~{breakfastRate}৳/বেলা
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSubscribedSlots((prev) => ({
                    ...prev,
                    lunch: !prev.lunch,
                  }))
                }
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                  subscribedSlots.lunch
                    ? "bg-white border-emerald-600 shadow-sm text-emerald-950 font-bold ring-1 ring-emerald-500"
                    : "bg-white/50 border-slate-200 text-slate-400"
                }`}
              >
                {subscribedSlots.lunch ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300" />
                )}
                <div>
                  <div className="text-xs font-extrabold">দুপুরের খাবার</div>
                  <div className="text-[10px] text-slate-500">
                    ~{lunchRate}৳/বেলা
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSubscribedSlots((prev) => ({
                    ...prev,
                    dinner: !prev.dinner,
                  }))
                }
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                  subscribedSlots.dinner
                    ? "bg-white border-emerald-600 shadow-sm text-emerald-950 font-bold ring-1 ring-emerald-500"
                    : "bg-white/50 border-slate-200 text-slate-400"
                }`}
              >
                {subscribedSlots.dinner ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300" />
                )}
                <div>
                  <div className="text-xs font-extrabold">রাতের খাবার</div>
                  <div className="text-[10px] text-slate-500">
                    ~{dinnerRate}৳/বেলা
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ধাপ ৪: ক্যালেন্ডার */}
        <div className="bg-white p-3.5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              {bookingMode === "WEEKLY"
                ? "সপ্তাহ শুরুর শুরুর তারিখ:"
                : bookingMode === "MONTHLY"
                  ? "মাস শুরুর তারিখ:"
                  : "তারিখ ও বার নির্বাচন করুন:"}
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

          <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-1 scroll-smooth">
            {currentMonthDays.map((day) => {
              const isSelected = selectedDay.fullDate === day.fullDate;
              return (
                <button
                  key={day.fullDate}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`shrink-0 w-14 py-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? "bg-gradient-to-b from-emerald-600 to-emerald-700 border-emerald-600 text-white shadow-md shadow-emerald-700/30 scale-105"
                      : day.isFriday
                        ? "bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
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
        </div>

        {/* ধাপ ৫: সকাল / দুপুর / রাত সুইচ */}
        {bookingMode === "SINGLE" && (
          <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 animate-in fade-in">
            {(["BREAKFAST", "LUNCH", "DINNER"] as const).map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  selectedSlot === slot
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {slot === "BREAKFAST"
                  ? "সকাল"
                  : slot === "LUNCH"
                    ? "দুপুর"
                    : "রাত"}
              </button>
            ))}
          </div>
        )}

        {/* ধাপ ৬: খাবার ডিসপ্লে */}
        {selectedPackage === "REGULAR" ? (
          <div className="space-y-4">
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
                      {bookingMode === "FULL_DAY"
                        ? `${selectedDay.dayName}বারের সম্পূর্ণ ৩ বেলা কম্বো`
                        : bookingMode === "WEEKLY"
                          ? `১ সপ্তাহের প্যাকেজ [${subscribedSlotsText}]`
                          : bookingMode === "MONTHLY"
                            ? `১ মাসের প্যাকেজ [${subscribedSlotsText}]`
                            : currentRegularMenu.title}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-amber-300">
                      ৳{calculatedMealTotal}
                    </span>
                  </div>
                </div>
              </div>

              {bookingMode === "SINGLE" && selectedSlot === "BREAKFAST" && (
                <div className="p-3 bg-amber-50/70 border-b border-amber-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBreakfastChoice("KHICHURI")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      breakfastChoice === "KHICHURI"
                        ? "bg-emerald-700 text-white shadow"
                        : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    🍲 ভুনা খিচুড়ি (৳{breakfastOptions.KHICHURI.price})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakfastChoice("PARATHA")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      breakfastChoice === "PARATHA"
                        ? "bg-emerald-700 text-white shadow"
                        : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    🫓 গরম পরোটা (৳{breakfastOptions.PARATHA.price})
                  </button>
                </div>
              )}

              <div className="p-3.5 text-xs text-slate-600 leading-relaxed">
                {bookingMode === "SINGLE" && currentRegularMenu.desc}
                {bookingMode === "FULL_DAY" &&
                  "সকালের নাস্তা (খিচুড়ি/পরোটা) + দুপুরের খাবার (রুটিন মাছ/মুরগি/ডিম) + রাতের খাবার (ভাত/খিচুড়ি ডাল ভর্তা)।"}
                {(bookingMode === "WEEKLY" || bookingMode === "MONTHLY") && (
                  <span>
                    নির্বাচিত বেলা (<strong>{subscribedSlotsText}</strong>)-এর
                    খাবারগুলো ৩-দিনের চক্র অনুযায়ী প্রতিদিন তাজা রান্না করে মেসে
                    পৌছে দেওয়া হবে। জুম্মাবারে দুপুরের জন্য থাকছে স্পেশাল বিফ
                    বিরিয়ানি।
                  </span>
                )}
              </div>
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
                    এক্সট্রা প্রয়োজন হলে প্লেটে যোগ করুন
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
                        <span className="font-bold w-4 text-center">
                          {item.count}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => updateExtraCount(item.id, 1)}
                        className={`h-7 px-2.5 rounded-lg font-bold text-xs flex items-center gap-1 ${
                          item.count > 0
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />{" "}
                        {item.count === 0 && "যোগ"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* কাস্টম প্লেট */
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

        {/* ডেলিভারি মাধ্যম */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              ডেলিভারি মাধ্যম:
            </span>
            {isFreeDeliveryPromo && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                🎉 স্পেশাল ফ্রি ডেলিভারি অফার!
              </span>
            )}
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setDeliveryMethod("PICKUP")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                deliveryMethod === "PICKUP"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Store className="w-3.5 h-3.5" /> পিকআপ (০৳)
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMethod("HOME_DELIVERY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                deliveryMethod === "HOME_DELIVERY"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
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
                (
                {effectiveDeliveryCharge === 0
                  ? "ডেলিভারি ফ্রি"
                  : `চার্জ +${effectiveDeliveryCharge}৳`}
                )
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleProceedToCheckout}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-3 px-5 rounded-2xl shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>অর্ডার সম্পন্ন করুন</span>
          </button>
        </div>
      </div>

      {/* নতুন গুগল লগইন পপআপ (অতিরিক্ত সব টেক্সট বক্স মুছে ফেলা হয়েছে) */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  লগইন বা একাউন্ট তৈরি করুন
                </h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 text-center leading-relaxed">
              খাবার অর্ডার ও মিল ট্র্যাক করতে আপনার গুগল একাউন্ট (Gmail) দিয়ে
              প্রবেশ করুন।
            </p>

            {/* একমাত্র আসল গুগল সাইন-ইন বাটন */}
            <button
              type="button"
              onClick={() => signIn("google")}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-800 font-black text-xs flex items-center justify-center gap-3 shadow-sm transition-all active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google (Gmail) দিয়ে এগিয়ে যান</span>
            </button>
          </div>
        </div>
      )}

      {/* ওয়ালেট রিচার্জ মডাল */}
      {isRechargeModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    ওয়ালেটে টাকা যোগ করুন
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    বর্তমান ব্যালেন্স: ৳{userWallet}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRechargeModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRechargeSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  রিচার্জের পরিমাণ বেছে নিন:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["300", "500", "1000"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRechargeAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${
                        rechargeAmount === amt
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  পেমেন্ট মাধ্যম:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRechargePaymentMethod("BKASH")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      rechargePaymentMethod === "BKASH"
                        ? "border-pink-600 bg-pink-50 text-pink-900 ring-1 ring-pink-500"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    বিকাশ
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechargePaymentMethod("NAGAD")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      rechargePaymentMethod === "NAGAD"
                        ? "border-orange-600 bg-orange-50 text-orange-900 ring-1 ring-orange-500"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    নগদ
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <span>Send Money নম্বর:</span>
                <button
                  type="button"
                  onClick={copyBkashNumber}
                  className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1"
                >
                  {shopBkashNumber}
                  {copiedNumber ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  ট্রানজেকশন আইডি (TrxID) দিন:
                </label>
                <input
                  type="text"
                  placeholder="যেমন: BKA98721X"
                  value={rechargeTrxId}
                  onChange={(e) =>
                    setRechargeTrxId(e.target.value.toUpperCase())
                  }
                  required
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 uppercase tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRecharge}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingRecharge ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                <span>টাকা যোগের রিকোয়েস্ট পাঠান (৳{rechargeAmount})</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* চেকআউট মডাল (১-ক্লিক অটো সেভ প্রোফাইল) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  আপনার প্রি-অর্ডার ফাইনাল করুন
                </h3>
                <p className="text-[11px] text-slate-500">
                  {session?.user?.email ? `লগইনকৃত: ${session.user.email}` : ""}
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

            {/* কাস্টমার ফর্ম */}
            <form onSubmit={handleOrderSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                  আপনার নাম:
                </label>
                <input
                  type="text"
                  placeholder="আপনার পুরো নাম"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                  মোবাইল নম্বর:
                </label>
                <input
                  type="tel"
                  placeholder="মোবাইল নম্বর (বিকাশ/হোয়াটসঅ্যাপ)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
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
                      placeholder="মেসের নাম ও ঠিকানা"
                      value={messName}
                      onChange={(e) => setMessName(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      রুম নম্বর:
                    </label>
                    <input
                      type="text"
                      placeholder="রুম নম্বর"
                      value={roomNo}
                      onChange={(e) => setRoomNo(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* বিল সামারি */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>প্যাকেজ:</span>
                  <span className="font-bold text-slate-800">
                    {packageSummaryTitle}
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
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
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
