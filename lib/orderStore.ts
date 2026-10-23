import fs from "fs";
import path from "path";

const ORDERS_FILE = path.join(process.cwd(), "prisma", "orders_store.json");

export interface StoredOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  messName: string;
  roomNo: string;
  targetDate: string;
  mealSlot: string;
  packageType: string;
  deliveryType: string;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  isSkipped: boolean;
  createdAt: string;
}

function getOrdersData(): StoredOrder[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveOrdersData(orders: StoredOrder[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save orders_store:", e);
  }
}

export const orderStore = {
  getAllOrders(phone?: string): StoredOrder[] {
    const orders = getOrdersData();
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      return orders.filter((o) =>
        o.customerPhone.replace(/\D/g, "").includes(cleanPhone),
      );
    }
    return orders;
  },

  createOrder(
    orderData: Omit<StoredOrder, "id" | "createdAt" | "isSkipped">,
  ): StoredOrder {
    const orders = getOrdersData();
    const newOrder: StoredOrder = {
      ...orderData,
      id: "ord_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      isSkipped: false,
      createdAt: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    saveOrdersData(orders);
    return newOrder;
  },

  updateOrderSkip(orderId: string, isSkipped: boolean): StoredOrder | null {
    const orders = getOrdersData();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;

    orders[idx].isSkipped = isSkipped;
    saveOrdersData(orders);
    return orders[idx];
  },

  updateOrderDetails(
    orderId: string,
    updates: Partial<StoredOrder>,
  ): StoredOrder | null {
    const orders = getOrdersData();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;

    orders[idx] = { ...orders[idx], ...updates };
    saveOrdersData(orders);
    return orders[idx];
  },
};
