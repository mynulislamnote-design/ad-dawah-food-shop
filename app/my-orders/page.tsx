"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Calendar,
  Utensils,
  CheckCircle2,
  XCircle,
  Phone,
  PlusCircle,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Sun,
  Sunset,
  Moon,
  Wallet,
  Save,
  Check,
  CreditCard,
  Truck,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  messName: string;
  roomNo: string;
  targetDate: string;
  mealSlot: string;
  packageType: string;
  deliveryType: string;
  totalAmount: number;
  paymentMethod: string;
  isSkipped: boolean;
}

interface ExtraItem {
  id: string;
  name: string;
  price: number;
}

const SLOT_REFUND_RATES = {
  breakfast: 40,
  lunch: 80,
  dinner: 60,
};

export default function MyOrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState(450);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // এডমিন থেকে লাইভ আসা অতিরিক্ত খাবারের তালিকা
  const [availableExtraItems, setAvailableExtraItems] = useState<ExtraItem[]>([
    { id: "ex1", name: "অতিরিক্ত সাদা ভাত", price: 15 },
    { id: "ex2", name: "ডিম পোচ / ওমলেট", price: 20 },
    { id: "ex3", name: "স্পেশাল আলু ভর্তা (গাওয়া ঘি)", price: 10 },
    { id: "ex4", name: "ঘন মসুর ডাল বাটি", price: 15 },
    { id: "ex5", name: "শসা ও লেবুর ফ্রেশ সালাদ", price: 10 },
  ]);

  // অতিরিক্ত খাবারের ড্রপডাউন ও স্লট স্টেট
  const [openExtraForId, setOpenExtraForId] = useState<string | null>(null);
  const [selectedExtraSlot, setSelectedExtraSlot] = useState<
    "breakfast" | "lunch" | "dinner"
  >("lunch");

  // কোন অর্ডারের কোন বেলার আইটেম কাউন্ট
  const [extraCountsBySlot, setExtraCountsBySlot] = useState<{
    [orderId: string]: {
      [slot: string]: { [itemId: string]: number };
    };
  }>({});

  // পেমেন্ট মডাল স্টেট
  const [extraPaymentModalOrder, setExtraPaymentModalOrder] =
    useState<Order | null>(null);
  const [pendingExtraTotal, setPendingExtraTotal] = useState(0);
  const [extraPaymentMethod, setExtraPaymentMethod] = useState<
    "WALLET" | "COD"
  >("WALLET");

  // এডমিন থেকে অতিরিক্ত খাবার লাইভ ফেচ
  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const extras = data.filter(
            (i: any) => i.mealSlot === "EXTRA_ADDON" && i.isAvailable,
          );
          if (extras.length > 0) {
            setAvailableExtraItems(
              extras.map((i: any) => ({
                id: i.id,
                name: i.nameBn,
                price: i.price,
              })),
            );
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // ফোন নম্বর দিয়ে অর্ডার ও ওয়ালেট খোঁজা
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const [ordersRes, walletRes] = await Promise.all([
        fetch(`/api/orders?phone=${encodeURIComponent(phone)}`),
        fetch(`/api/wallet?phone=${encodeURIComponent(phone)}`),
      ]);
      const ordersData = await ordersRes.json();
      const walletData = await walletRes.json();

      if (Array.isArray(ordersData)) setOrders(ordersData);
      if (walletData.balance !== undefined)
        setWalletBalance(walletData.balance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ওয়ালেট আপডেট
  const updateWallet = async (amount: number, type: "CREDIT" | "DEBIT") => {
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount, type }),
      });
      const data = await res.json();
      if (data.balance !== undefined) {
        setWalletBalance(data.balance);
      }
    } catch (err) {
      console.error("Wallet error", err);
    }
  };

  // ১. নির্দিষ্ট বেলা বন্ধ (স্কিপ) করলে অটো ওয়ালেট রিফান্ড
  const toggleSpecificSlot = async (
    order: Order,
    slotName: "breakfast" | "lunch" | "dinner",
  ) => {
    let slots = { breakfast: true, lunch: true, dinner: true };
    try {
      slots = JSON.parse(order.mealSlot);
    } catch {
      slots = {
        breakfast: !order.isSkipped,
        lunch: !order.isSkipped,
        dinner: !order.isSkipped,
      };
    }

    const isCurrentlyActive = slots[slotName];
    const willBeActive = !isCurrentlyActive;
    const refundAmount = SLOT_REFUND_RATES[slotName];

    const updatedSlots = {
      ...slots,
      [slotName]: willBeActive,
    };

    const allOff =
      !updatedSlots.breakfast && !updatedSlots.lunch && !updatedSlots.dinner;
    const newTotal = willBeActive
      ? order.totalAmount + refundAmount
      : Math.max(0, order.totalAmount - refundAmount);

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          mealSlot: JSON.stringify(updatedSlots),
          totalAmount: newTotal,
          isSkipped: allOff,
        }),
      });

      if (res.ok) {
        if (!willBeActive) {
          await updateWallet(refundAmount, "CREDIT");
          alert(
            `আলহামদুলিল্লাহ! ${slotName === "breakfast" ? "সকালের" : slotName === "lunch" ? "দুপুরের" : "রাতের"} খাবার বন্ধ করা হয়েছে। ৳${refundAmount} আপনার ওয়ালেট ব্যালেন্সে ফেরত দেওয়া হয়েছে!`,
          );
        } else {
          await updateWallet(refundAmount, "DEBIT");
        }

        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  mealSlot: JSON.stringify(updatedSlots),
                  totalAmount: newTotal,
                  isSkipped: allOff,
                }
              : o,
          ),
        );
      }
    } catch (err) {
      alert("স্লট আপডেট করা যায়নি!");
    }
  };

  // ২. বেলার অতিরিক্ত খাবার পরিবর্তন (+ / -)
  const handleSlotExtraChange = (
    orderId: string,
    slot: string,
    itemId: string,
    delta: number,
  ) => {
    setExtraCountsBySlot((prev) => {
      const orderData = prev[orderId] || {};
      const slotData = orderData[slot] || {};
      const current = slotData[itemId] || 0;
      const nextCount = Math.max(0, current + delta);

      return {
        ...prev,
        [orderId]: {
          ...orderData,
          [slot]: {
            ...slotData,
            [itemId]: nextCount,
          },
        },
      };
    });
  };

  // ৩. অতিরিক্ত খাবারের হিসাব
  const promptSaveExtras = (order: Order) => {
    const orderData = extraCountsBySlot[order.id] || {};
    let totalCost = 0;

    Object.keys(orderData).forEach((slotKey) => {
      const slotItems = orderData[slotKey] || {};
      availableExtraItems.forEach((item) => {
        totalCost += (slotItems[item.id] || 0) * item.price;
      });
    });

    if (totalCost === 0) {
      alert("অনুগ্রহ করে অন্তত একটি অতিরিক্ত খাবার যোগ করুন!");
      return;
    }

    setPendingExtraTotal(totalCost);
    setExtraPaymentModalOrder(order);
  };

  // ৪. অতিরিক্ত খাবারের পেমেন্ট ও ডাটাবেজে কনফার্মেশন
  const finalizeExtraFoodOrder = async () => {
    if (!extraPaymentModalOrder) return;
    const order = extraPaymentModalOrder;
    const orderData = extraCountsBySlot[order.id] || {};

    const summaryList: string[] = [];
    Object.keys(orderData).forEach((slotKey) => {
      const slotItems = orderData[slotKey] || {};
      const slotNameBn =
        slotKey === "breakfast"
          ? "সকাল"
          : slotKey === "lunch"
            ? "দুপুর"
            : "রাত";

      const itemsInSlot = availableExtraItems
        .filter((item) => (slotItems[item.id] || 0) > 0)
        .map((item) => `${item.name} (${slotItems[item.id]}টি)`);

      if (itemsInSlot.length > 0) {
        summaryList.push(`[${slotNameBn}: ${itemsInSlot.join(", ")}]`);
      }
    });

    const basePackage = order.packageType.split(" • [অতিরিক্ত:")[0];
    const paymentTag =
      extraPaymentMethod === "WALLET"
        ? "(ওয়ালেট পরিশোধিত)"
        : "(ক্যাশ অন ডেলিভারি)";
    const updatedPackageText = `${basePackage} • [অতিরিক্ত: ${summaryList.join(" ")} ${paymentTag}]`;

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          packageType: updatedPackageText,
          totalAmount: order.totalAmount + pendingExtraTotal,
        }),
      });

      if (res.ok) {
        if (extraPaymentMethod === "WALLET") {
          await updateWallet(pendingExtraTotal, "DEBIT");
        }

        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  packageType: updatedPackageText,
                  totalAmount: o.totalAmount + pendingExtraTotal,
                }
              : o,
          ),
        );

        setExtraPaymentModalOrder(null);
        setOpenExtraForId(null);
        alert(`অতিরিক্ত খাবার সফলভাবে যোগ হয়েছে!`);
      }
    } catch (err) {
      alert("অতিরিক্ত খাবার সেভ ব্যর্থ হয়েছে!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      {/* হেডার */}
      <header className="bg-emerald-700 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-emerald-100 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            মেনুতে ফিরুন
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-100">
              আমার ওয়ালেট:
            </span>
            <div className="bg-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-600">
              <Wallet className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-black text-amber-200">
                ৳{walletBalance}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* ফোন সার্চ বক্স */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-700 block">
            আপনার মোবাইল নম্বর দিয়ে মিল শিডিউল বের করুন:
          </span>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                placeholder="যেমন: 01736738334"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              খুঁজুন
            </button>
          </form>
        </div>

        {hasSearched && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700">
                বুকিং করা মিল শিডিউল:
              </span>
              <span className="text-xs text-slate-500 font-bold">
                মোট: {orders.length} দিন
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <Utensils className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">
                  কোনো খাবারের শিডিউল নেই
                </p>
                <p className="text-xs text-slate-400">
                  এই নম্বরে কোনো সক্রিয় বুকিং পাওয়া যায়নি।
                </p>
              </div>
            ) : (
              orders.map((order) => {
                let slots = { breakfast: true, lunch: true, dinner: true };
                try {
                  slots = JSON.parse(order.mealSlot);
                } catch {
                  slots = {
                    breakfast: !order.isSkipped,
                    lunch: !order.isSkipped,
                    dinner: !order.isSkipped,
                  };
                }

                const isCurrentExtrasOpen = openExtraForId === order.id;

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-3xl p-4 border shadow-sm transition-all space-y-3 ${
                      order.isSkipped
                        ? "border-rose-200 bg-rose-50/30"
                        : "border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    {/* কার্ড হেডার */}
                    <div className="flex items-start justify-between border-b pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                            {order.targetDate}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">
                            রুম: {order.roomNo}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-xs mt-1.5 leading-snug">
                          {order.packageType}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-800 block">
                          ৳{order.totalAmount}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            order.isSkipped
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {order.isSkipped ? "সারাদিন অফ" : "মিল চালু"}
                        </span>
                      </div>
                    </div>

                    {/* ১. সকাল, দুপুর ও রাতের আলাদা অন/অফ বোতাম উইথ অটো ওয়ালেট রিফান্ড */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-700">
                          ৩ বেলার খাবার চালু/বন্ধ করুন:
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          (বন্ধ করলে টাকা ওয়ালেটে জমা হবে)
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSpecificSlot(order, "breakfast")}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            slots.breakfast
                              ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500"
                              : "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                          }`}
                        >
                          <Sun
                            className={`w-3.5 h-3.5 ${slots.breakfast ? "text-amber-500" : "text-rose-500"}`}
                          />
                          <span className="text-[11px]">
                            সকাল: {slots.breakfast ? "চালু" : "অফ (+৪০৳)"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSpecificSlot(order, "lunch")}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            slots.lunch
                              ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500"
                              : "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                          }`}
                        >
                          <Sunset
                            className={`w-3.5 h-3.5 ${slots.lunch ? "text-amber-600" : "text-rose-500"}`}
                          />
                          <span className="text-[11px]">
                            দুপুর: {slots.lunch ? "চালু" : "অফ (+৮০৳)"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSpecificSlot(order, "dinner")}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            slots.dinner
                              ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500"
                              : "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                          }`}
                        >
                          <Moon
                            className={`w-3.5 h-3.5 ${slots.dinner ? "text-blue-600" : "text-rose-500"}`}
                          />
                          <span className="text-[11px]">
                            রাত: {slots.dinner ? "চালু" : "অফ (+৬০৳)"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* ২. বেলা বাছাই করে অতিরিক্ত খাবার যোগ করার প্যানেল */}
                    <div className="border-t pt-2.5 space-y-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenExtraForId(
                            isCurrentExtrasOpen ? null : order.id,
                          )
                        }
                        className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-between transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                          এই নির্দিষ্ট দিনের বেলায় অতিরিক্ত খাবার যোগ করুন
                        </span>
                        {isCurrentExtrasOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isCurrentExtrasOpen && (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              কোন বেলার জন্য অতিরিক্ত খাবার যোগ করবেন?
                            </span>
                            <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                              {(["breakfast", "lunch", "dinner"] as const).map(
                                (slot) => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setSelectedExtraSlot(slot)}
                                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                                      selectedExtraSlot === slot
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {slot === "breakfast"
                                      ? "সকাল"
                                      : slot === "lunch"
                                        ? "দুপুর"
                                        : "রাত"}
                                  </button>
                                ),
                              )}
                            </div>
                          </div>

                          <div className="divide-y divide-slate-200/80 bg-white p-2.5 rounded-xl border border-slate-200">
                            {availableExtraItems.map((item) => {
                              const slotData =
                                (extraCountsBySlot[order.id] &&
                                  extraCountsBySlot[order.id][
                                    selectedExtraSlot
                                  ]) ||
                                {};
                              const count = slotData[item.id] || 0;

                              return (
                                <div
                                  key={item.id}
                                  className="py-2 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 block">
                                      {item.name}
                                    </span>
                                    <span className="text-[10px] text-emerald-800 font-bold">
                                      ৳{item.price}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {count > 0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSlotExtraChange(
                                            order.id,
                                            selectedExtraSlot,
                                            item.id,
                                            -1,
                                          )
                                        }
                                        className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                    )}
                                    {count > 0 && (
                                      <span className="font-bold w-4 text-center">
                                        {count}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSlotExtraChange(
                                          order.id,
                                          selectedExtraSlot,
                                          item.id,
                                          1,
                                        )
                                      }
                                      className={`h-6 px-2 rounded-lg font-bold text-xs flex items-center gap-1 ${
                                        count > 0
                                          ? "bg-emerald-600 text-white"
                                          : "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                      }`}
                                    >
                                      <Plus className="w-3 h-3" />
                                      {count === 0 && "যোগ"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => promptSaveExtras(order)}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <Save className="w-3.5 h-3.5" />
                            অতিরিক্ত খাবার সেভ ও পেমেন্ট করুন
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* অতিরিক্ত খাবারের পেমেন্ট মডাল */}
      {extraPaymentModalOrder && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  অতিরিক্ত খাবারের পেমেন্ট
                </h3>
                <p className="text-[11px] text-slate-500">
                  মোট অতিরিক্ত বিল: ৳{pendingExtraTotal}
                </p>
              </div>
              <button
                onClick={() => setExtraPaymentModalOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                পেমেন্ট মেথড বেছে নিন:
              </span>

              <button
                type="button"
                onClick={() => setExtraPaymentMethod("WALLET")}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  extraPaymentMethod === "WALLET"
                    ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      স্মার্ট ওয়ালেট থেকে কর্তন
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ব্যালেন্স আছে: ৳{walletBalance}
                    </span>
                  </div>
                </div>
                {walletBalance < pendingExtraTotal && (
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    স্বল্প ব্যালেন্স
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setExtraPaymentMethod("COD")}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  extraPaymentMethod === "COD"
                    ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      ক্যাশ অন ডেলিভারি (নগদ বকেয়া)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      খাবার গ্রহণের সময় ডেলিভারি বয়কে দেবেন
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={finalizeExtraFoodOrder}
              disabled={
                extraPaymentMethod === "WALLET" &&
                walletBalance < pendingExtraTotal
              }
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md"
            >
              নিশ্চিত করুন (৳{pendingExtraTotal})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
