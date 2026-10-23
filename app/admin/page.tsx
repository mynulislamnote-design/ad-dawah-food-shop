"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChefHat,
  Truck,
  RefreshCw,
  Phone,
  Printer,
  UtensilsCrossed,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  Gift,
  Calendar,
  Filter,
  Wallet,
  Clock,
  Check,
  X,
  Lock,
  ShieldAlert,
  LogOut,
  Eye,
  EyeOff,
  Plus,
  CreditCard,
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
  deliveryType: "PICKUP" | "HOME_DELIVERY";
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  isSkipped: boolean;
  status: "PENDING_VERIFICATION" | "APPROVED";
  createdAt: string;
}

interface MenuItem {
  id: string;
  nameBn: string;
  price: number;
  isAvailable: boolean;
  mealSlot: string;
}

interface WalletRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: string;
  trxId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { email: string; walletBalance: number };
}

function parseOrderSlots(order: Order) {
  if (order.isSkipped || order.status !== "APPROVED")
    return { breakfast: false, lunch: false, dinner: false };
  try {
    const parsed = JSON.parse(order.mealSlot);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        breakfast: !!parsed.breakfast,
        lunch: !!parsed.lunch,
        dinner: !!parsed.dinner,
      };
    }
  } catch {}

  const slotStr = (order.mealSlot || "").toUpperCase();
  const pkgStr = order.packageType || "";

  if (
    slotStr.includes("PACKAGE") ||
    slotStr === "ALL" ||
    pkgStr.includes("রেগুলার") ||
    pkgStr.includes("REGULAR")
  ) {
    return {
      breakfast: !pkgStr.includes("[") || pkgStr.includes("সকাল"),
      lunch: !pkgStr.includes("[") || pkgStr.includes("দুপুর"),
      dinner: !pkgStr.includes("[") || pkgStr.includes("রাত"),
    };
  }

  return {
    breakfast: slotStr.includes("BREAKFAST"),
    lunch: slotStr.includes("LUNCH"),
    dinner: slotStr.includes("DINNER"),
  };
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem("ad_dawah_admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword =
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "Addawah@food";

    if (inputPassword.trim() === correctPassword.trim()) {
      sessionStorage.setItem("ad_dawah_admin_auth", "true");
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("ad_dawah_admin_auth");
    setIsAuthenticated(false);
    setInputPassword("");
  };

  const [activeTab, setActiveTab] = useState<
    "ORDERS" | "PAYMENTS" | "WALLET" | "MENU"
  >("ORDERS");
  const [menuSubTab, setMenuSubTab] = useState<"REGULAR" | "EXTRAS" | "CUSTOM">(
    "REGULAR",
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedFilterDate, setSelectedFilterDate] =
    useState<string>(tomorrowStr);

  const [deliveryChargeInput, setDeliveryChargeInput] = useState(15);
  const [isFreeDeliveryPromo, setIsFreeDeliveryPromo] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<
    "CUSTOM" | "EXTRA_ADDON"
  >("CUSTOM");
  const [isAddingItem, setIsAddingItem] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes, settingsRes, walletReqRes] = await Promise.all(
        [
          fetch("/api/orders"),
          fetch("/api/menu"),
          fetch("/api/settings"),
          fetch("/api/wallet/request"),
        ],
      );

      const ordersData = await ordersRes.json();
      const menuData = await menuRes.json();
      const settingsData = await settingsRes.json();
      const walletReqData = await walletReqRes.json();

      if (Array.isArray(ordersData)) setOrders(ordersData);
      if (Array.isArray(menuData)) setMenuItems(menuData);
      if (Array.isArray(walletReqData)) setWalletRequests(walletReqData);
      if (settingsData.deliveryCharge !== undefined)
        setDeliveryChargeInput(settingsData.deliveryCharge);
      if (settingsData.isFreeDelivery !== undefined)
        setIsFreeDeliveryPromo(settingsData.isFreeDelivery);
    } catch (err) {
      console.error("Data load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // বিকাশ/নগদ অর্ডারের পেমেন্ট অনুমোদন (Approve Payment)
  const handleApproveOrderPayment = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "APPROVE_PAYMENT" }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: "APPROVED" } : o,
          ),
        );
        alert(
          "পেমেন্ট নিশ্চিত করা হয়েছে! এখন এটি কিচেন ও ডেলিভারি শিটে যুক্ত হয়েছে।",
        );
      }
    } catch (err) {
      alert("পেমেন্ট এপ্রুভ ব্যর্থ হয়েছে!");
    }
  };

  const handleWalletAction = async (
    requestId: string,
    action: "APPROVE" | "REJECT",
  ) => {
    try {
      const res = await fetch("/api/wallet/request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        setWalletRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" }
              : r,
          ),
        );
        alert(
          action === "APPROVE"
            ? "টাকা সফলভাবে ইউজারের ওয়ালেটে যোগ হয়েছে!"
            : "রিকোয়েস্ট বাতিল করা হয়েছে।",
        );
      }
    } catch (err) {
      alert("অপারেশন ব্যর্থ হয়েছে!");
    }
  };

  const displayedOrders = useMemo(() => {
    // শুধুমাত্র অনুমোদিত (APPROVED) এবং স্কিপ না করা অর্ডারগুলো কিচেন শিটে দেখাবে
    const activeVerifiedOrders = orders.filter((o) => o.status === "APPROVED");
    if (selectedFilterDate === "ALL") return activeVerifiedOrders;
    return activeVerifiedOrders.filter(
      (o) => o.targetDate === selectedFilterDate,
    );
  }, [orders, selectedFilterDate]);

  // পেন্ডিং পেমেন্ট অর্ডারের তালিকা
  const pendingPaymentOrders = useMemo(() => {
    return orders.filter((o) => o.status === "PENDING_VERIFICATION");
  }, [orders]);

  let breakfastCount = 0;
  let lunchCount = 0;
  let dinnerCount = 0;
  let totalActiveCustomers = 0;
  let totalRevenue = 0;

  displayedOrders.forEach((order) => {
    const slots = parseOrderSlots(order);
    const hasAnySlot = slots.breakfast || slots.lunch || slots.dinner;

    if (!order.isSkipped && hasAnySlot) {
      totalActiveCustomers++;
      totalRevenue += order.totalAmount;
      if (slots.breakfast) breakfastCount++;
      if (slots.lunch) lunchCount++;
      if (slots.dinner) dinnerCount++;
    }
  });

  const handleSaveDeliverySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryCharge: Number(deliveryChargeInput),
          isFreeDelivery: isFreeDeliveryPromo,
        }),
      });

      if (res.ok) {
        setSettingsSavedMessage(true);
        setTimeout(() => setSettingsSavedMessage(false), 3000);
      }
    } catch (err) {
      alert("সেটিংস আপডেট ব্যর্থ হয়েছে!");
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAvailable: !currentStatus }),
      });
      if (res.ok) {
        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isAvailable: !currentStatus } : item,
          ),
        );
      }
    } catch (err) {
      alert("স্টক আপডেট ব্যর্থ হয়েছে!");
    }
  };

  const handleEditItem = async (item: MenuItem) => {
    const newName = prompt("খাবারের নতুন নাম লিখুন:", item.nameBn);
    if (!newName) return;

    const newPriceStr = prompt(
      "নতুন দাম লিখুন (টাকায়):",
      item.price.toString(),
    );
    if (!newPriceStr || isNaN(Number(newPriceStr))) return;

    try {
      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          nameBn: newName,
          price: Number(newPriceStr),
        }),
      });
      if (res.ok) {
        setMenuItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, nameBn: newName, price: Number(newPriceStr) }
              : i,
          ),
        );
        alert("আপডেট হয়েছে!");
      }
    } catch (err) {
      alert("আপডেট ব্যর্থ হয়েছে!");
    }
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    setIsAddingItem(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: newItemName,
          price: newItemPrice,
          mealSlot: newItemCategory,
        }),
      });
      if (res.ok) {
        const added = await res.json();
        setMenuItems((prev) => [...prev, added]);
        setNewItemName("");
        setNewItemPrice("");
        alert("খাবার যোগ হয়েছে!");
      }
    } catch (err) {
      alert("যোগ করতে সমস্যা হয়েছে।");
    } finally {
      setIsAddingItem(false);
    }
  };

  const regularCycleItems = menuItems.filter((i) =>
    i.mealSlot.startsWith("REGULAR_"),
  );
  const extraAddonItems = menuItems.filter((i) => i.mealSlot === "EXTRA_ADDON");
  const customPlateItems = menuItems.filter(
    (i) =>
      i.mealSlot === "CUSTOM" ||
      (!i.mealSlot.startsWith("REGULAR_") && i.mealSlot !== "EXTRA_ADDON"),
  );
  const pendingWalletCount = walletRequests.filter(
    (r) => r.status === "PENDING",
  ).length;
  const pendingPaymentCount = pendingPaymentOrders.length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="w-full max-w-sm bg-slate-800/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-slate-700 space-y-5 animate-in fade-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-white">
              আদ-দাওয়া অ্যাডমিন পোর্টাল
            </h2>
            <p className="text-xs text-slate-400">
              এই পেজটি শুধুমাত্র শপের স্বত্বাধিকারীর জন্য সংরক্ষিত
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                মাস্টার সিক্রেট পাসওয়ার্ড দিন:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="পাসওয়ার্ড লিখুন..."
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  required
                  className="w-full text-sm pl-4 pr-10 py-3 rounded-xl bg-slate-950/70 border border-slate-600 focus:border-emerald-500 focus:outline-none text-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1 mt-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> ভুল পাসওয়ার্ড! আবার
                  চেষ্টা করুন।
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              ← কাস্টমার হোমপেজে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* হেডার */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-emerald-800 flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-emerald-600" />
              আদ-দাওয়া ফুড শপ — মাস্টার অ্যাডমিন
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              কিচেন শিট, পেমেন্ট ভেরিফিকেশন, ওয়ালেট ও মেনু নিয়ন্ত্রণ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              রিফ্রেশ
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              প্রিন্ট শিট
            </button>
            <button
              onClick={handleAdminLogout}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              লক / লগআউট
            </button>
          </div>
        </div>

        {/* প্রধান ট্যাব সুইচ */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ORDERS")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === "ORDERS"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Truck className="w-4 h-4" />
            অর্ডার ও কিচেন শিট
          </button>

          <button
            onClick={() => setActiveTab("PAYMENTS")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 transition-all relative ${
              activeTab === "PAYMENTS"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            অর্ডার পেমেন্ট যাচাইকরণ
            {pendingPaymentCount > 0 && (
              <span className="bg-pink-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {pendingPaymentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("WALLET")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 transition-all relative ${
              activeTab === "WALLET"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Wallet className="w-4 h-4" />
            ওয়ালেট রিচার্জ অনুমোদন
            {pendingWalletCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {pendingWalletCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("MENU")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 transition-all ${
              activeTab === "MENU"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            মেনু ও প্রাইস ম্যানেজার ({menuItems.length})
          </button>
        </div>

        {/* ট্যাব ১: অর্ডার ও কিচেন শিট */}
        {activeTab === "ORDERS" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">
                      ডেলিভারি চার্জ ও অফার নিয়ন্ত্রণ
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      গ্রাহকের অ্যাপে এই চার্জটি স্বয়ংক্রিয়ভাবে দেখাবে
                    </p>
                  </div>
                </div>

                {settingsSavedMessage && (
                  <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{" "}
                    সেটিংস সেভ হয়েছে!
                  </span>
                )}
              </div>

              <form
                onSubmit={handleSaveDeliverySettings}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ডেলিভারি চার্জ (টাকায়):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                      ৳
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={deliveryChargeInput}
                      onChange={(e) =>
                        setDeliveryChargeInput(Number(e.target.value))
                      }
                      disabled={isFreeDeliveryPromo}
                      className="w-full text-sm font-bold pl-7 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setIsFreeDeliveryPromo(!isFreeDeliveryPromo)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                      isFreeDeliveryPromo
                        ? "bg-amber-400 border-amber-500 text-slate-900 shadow-sm"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Gift className="w-4 h-4 text-emerald-800" />
                    {isFreeDeliveryPromo
                      ? "ফ্রি ডেলিভারি চালু আছে"
                      : "ফ্রি ডেলিভারি অফার দিন (০৳)"}
                  </button>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>চার্জ আপডেট সেভ করুন</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">
                  যেদিনের রান্নার হিসাব দেখতে চান:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFilterDate(tomorrowStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedFilterDate === tomorrowStr
                      ? "bg-emerald-700 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  আগামীকাল ({tomorrowStr})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFilterDate(todayStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedFilterDate === todayStr
                      ? "bg-emerald-700 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  আজকে ({todayStr})
                </button>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={
                      selectedFilterDate === "ALL" ? "" : selectedFilterDate
                    }
                    onChange={(e) => setSelectedFilterDate(e.target.value)}
                    className="text-xs font-bold bg-transparent text-slate-700 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFilterDate("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedFilterDate === "ALL"
                      ? "bg-emerald-700 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  সব দিন একসঙ্গে
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">
                  মোট সক্রিয় কাস্টমার
                </span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {totalActiveCustomers} জন
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                  {selectedFilterDate}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-amber-600">
                  সকালের রান্না (Breakfast)
                </span>
                <div className="text-2xl font-black text-amber-700 mt-1">
                  {breakfastCount} টি
                </div>
                <span className="text-[10px] text-slate-400">
                  পরোটা / খিচুড়ি
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-emerald-600">
                  দুপুরের রান্না (Lunch)
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {lunchCount} টি
                </div>
                <span className="text-[10px] text-slate-400">
                  মাছ / মুরগি / ডিম
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-blue-600">
                  রাতের রান্না (Dinner)
                </span>
                <div className="text-2xl font-black text-blue-700 mt-1">
                  {dinnerCount} টি
                </div>
                <span className="text-[10px] text-slate-400">ভাত / খিচুড়ি</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    ডেলিভারি শিট —{" "}
                    {selectedFilterDate === tomorrowStr
                      ? "আগামীকাল"
                      : selectedFilterDate}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ডেলিভারি বয়দের জন্য মেস ও রুম ভিত্তিক তালিকা
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  সক্রিয় বিল: ৳{totalRevenue}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">কাস্টমার</th>
                      <th className="p-3.5">মোবাইল</th>
                      <th className="p-3.5">মেস ও রুম নং</th>
                      <th className="p-3.5">তারিখ</th>
                      <th className="p-3.5">যে যে বেলা খাবে</th>
                      <th className="p-3.5">অতিরিক্ত খাবার / নোট</th>
                      <th className="p-3.5 text-right">বিল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center p-8 text-slate-400"
                        >
                          এই তারিখে কোনো অনুমোদিত অর্ডার নেই।
                        </td>
                      </tr>
                    ) : (
                      displayedOrders.map((order) => {
                        const slots = parseOrderSlots(order);
                        const hasAnySlot =
                          slots.breakfast || slots.lunch || slots.dinner;
                        const hasExtras =
                          order.packageType.includes("• [অতিরিক্ত:");
                        const extraText = hasExtras
                          ? order.packageType
                              .split("• [অতিরিক্ত:")[1]
                              .replace("]", "")
                          : "—";

                        return (
                          <tr
                            key={order.id}
                            className={`hover:bg-slate-50/80 transition-colors ${order.isSkipped || !hasAnySlot ? "bg-rose-50/40 opacity-60" : ""}`}
                          >
                            <td className="p-3.5">
                              <span className="font-bold text-slate-800 block">
                                {order.customerName}
                              </span>
                              {(order.isSkipped || !hasAnySlot) && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                                  সারাদিন স্কিপ
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-medium flex items-center gap-1 text-slate-700">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {order.customerPhone}
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold text-slate-800">
                                {order.messName}
                              </span>
                              <span className="text-emerald-700 ml-1.5 font-bold">
                                (রুম: {order.roomNo})
                              </span>
                            </td>
                            <td className="p-3.5 font-medium text-slate-700">
                              {order.targetDate}
                            </td>
                            <td className="p-3.5">
                              <div className="flex gap-1">
                                {slots.breakfast && (
                                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    সকাল
                                  </span>
                                )}
                                {slots.lunch && (
                                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    দুপুর
                                  </span>
                                )}
                                {slots.dinner && (
                                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    রাত
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 max-w-xs truncate text-[11px] text-amber-800 font-medium">
                              {extraText}
                            </td>
                            <td className="p-3.5 font-bold text-right text-slate-900">
                              ৳{order.totalAmount}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ট্যাব ২: অর্ডার পেমেন্ট যাচাইকরণ (নতুন ট্যাব) */}
        {activeTab === "PAYMENTS" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-pink-600" />
                  বিকাশ / নগদ পেমেন্ট যাচাইকরণ তালিকা
                </h2>
                <p className="text-[11px] text-slate-500">
                  কাস্টমার TrxID দিয়ে অর্ডার করার পর এখানে জমা হবে। আপনি পেমেন্ট
                  নিশ্চিত করলে তবেই তা কিচেন শিটে যাবে।
                </p>
              </div>
              <span className="text-xs font-bold text-pink-800 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                যাচাইাধীন: {pendingPaymentCount} টি
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">কাস্টমার</th>
                    <th className="p-3.5">মোবাইল</th>
                    <th className="p-3.5">মেস ও রুম</th>
                    <th className="p-3.5">তারিখ ও প্যাকেজ</th>
                    <th className="p-3.5">পেমেন্ট ও TrxID</th>
                    <th className="p-3.5">বিল</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingPaymentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center p-8 text-slate-400"
                      >
                        এখনো যাচাই করার মতো কোনো নতুন বিকাশ অর্ডার নেই।
                      </td>
                    </tr>
                  ) : (
                    pendingPaymentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-3.5 font-bold text-slate-800">
                          {order.customerName}
                        </td>
                        <td className="p-3.5 font-medium">
                          {order.customerPhone}
                        </td>
                        <td className="p-3.5">
                          {order.messName} (রুম: {order.roomNo})
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-800 block">
                            {order.targetDate}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {order.packageType}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-pink-700 bg-pink-50/50 px-2 py-1 rounded">
                          {order.paymentMethod}
                        </td>
                        <td className="p-3.5 font-black text-slate-900">
                          ৳{order.totalAmount}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleApproveOrderPayment(order.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" /> পেমেন্ট নিশ্চিত
                            করুন
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ট্যাব ৩: ওয়ালেট রিচার্জ অনুমোদন */}
        {activeTab === "WALLET" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  কাস্টমার ওয়ালেট রিচার্জ রিকোয়েস্ট তালিকা
                </h2>
                <p className="text-[11px] text-slate-500">
                  বিকাশ/নগদ TrxID মিলিয়ে এক ক্লিকে অনুমোদন বা বাতিল করুন
                </p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                অপেক্ষারত: {pendingWalletCount} টি
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">কাস্টমারের নাম</th>
                    <th className="p-3.5">মোবাইল নম্বর</th>
                    <th className="p-3.5">টাকার পরিমাণ</th>
                    <th className="p-3.5">মাধ্যম</th>
                    <th className="p-3.5">ট্রানজেকশন আইডি (TrxID)</th>
                    <th className="p-3.5">বর্তমান স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {walletRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center p-8 text-slate-400"
                      >
                        এখনো কোনো রিচার্জ রিকোয়েস্ট আসেনি।
                      </td>
                    </tr>
                  ) : (
                    walletRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-3.5">
                          <span className="font-bold text-slate-800 block">
                            {req.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {req.user?.email}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">
                          {req.customerPhone}
                        </td>
                        <td className="p-3.5 font-black text-emerald-700 text-sm">
                          ৳{req.amount}
                        </td>
                        <td className="p-3.5 font-bold">{req.paymentMethod}</td>
                        <td className="p-3.5 font-mono text-[11px] bg-slate-50 px-2 py-1 rounded font-bold text-slate-800">
                          {req.trxId}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : req.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {req.status === "APPROVED"
                              ? "অনুমোদিত"
                              : req.status === "REJECTED"
                                ? "বাতিল"
                                : "যাচাইাধীন (Pending)"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {req.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  handleWalletAction(req.id, "APPROVE")
                                }
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" /> অনুমোদন
                              </button>
                              <button
                                onClick={() =>
                                  handleWalletAction(req.id, "REJECT")
                                }
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> বাতিল
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              সম্পন্ন
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ট্যাব ৪: মেনু ও প্রাইস ম্যানেজার */}
        {activeTab === "MENU" && (
          <div className="space-y-6">
            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMenuSubTab("REGULAR")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  menuSubTab === "REGULAR"
                    ? "bg-emerald-700 text-white shadow"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                🍱 রেগুলার প্যাকেজ রুটিন ({regularCycleItems.length})
              </button>
              <button
                type="button"
                onClick={() => setMenuSubTab("EXTRAS")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  menuSubTab === "EXTRAS"
                    ? "bg-emerald-700 text-white shadow"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                ➕ অতিরিক্ত খাবার ({extraAddonItems.length})
              </button>
              <button
                type="button"
                onClick={() => setMenuSubTab("CUSTOM")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  menuSubTab === "CUSTOM"
                    ? "bg-emerald-700 text-white shadow"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                🍛 কাস্টম প্লেট ({customPlateItems.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-600" /> নতুন খাবার
                  যোগ করুন
                </h3>
                <form onSubmit={handleAddNewItem} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      ক্যাটাগরি:
                    </label>
                    <select
                      value={newItemCategory}
                      onChange={(e) =>
                        setNewItemCategory(e.target.value as any)
                      }
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="CUSTOM">কাস্টম প্লেটের খাবার</option>
                      <option value="EXTRA_ADDON">
                        অতিরিক্ত খাবার (Add-on)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      খাবারের নাম:
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: খাসির মাংসের ঝোল"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      required
                      className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      মূল্য (টাকা):
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ১২০"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      required
                      className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingItem}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> যোগ করুন
                  </button>
                </form>
              </div>

              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">
                    খাবার তালিকা ও রেট
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {(menuSubTab === "REGULAR"
                    ? regularCycleItems
                    : menuSubTab === "EXTRAS"
                      ? extraAddonItems
                      : customPlateItems
                  ).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="max-w-[65%]">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                          {item.nameBn}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ৳{item.price}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                          >
                            {item.isAvailable ? "● স্টকে আছে" : "○ স্টক আউট"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="px-2.5 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> এডিট
                        </button>
                        <button
                          onClick={() =>
                            toggleAvailability(item.id, item.isAvailable)
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                            item.isAvailable
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {item.isAvailable ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {item.isAvailable ? "স্টক আউট" : "স্টক অন"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
