import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "prisma", "user_wallet_store.json");

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  messName: string;
  roomNo: string;
  walletBalance: number;
}

export interface WalletReq {
  id: string;
  email: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: string;
  trxId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user?: { email: string; walletBalance: number };
}

interface StoreData {
  users: { [email: string]: UserProfile };
  walletRequests: WalletReq[];
}

function getStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial: StoreData = { users: {}, walletRequests: [] };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return { users: {}, walletRequests: [] };
  }
}

function saveStore(data: StoreData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save user_wallet_store:", e);
  }
}

export const userWalletStore = {
  getUser(email: string): UserProfile | null {
    if (!email) return null;
    const store = getStore();
    return store.users[email.toLowerCase().trim()] || null;
  },

  saveUser(user: Partial<UserProfile> & { email: string }): UserProfile {
    const store = getStore();
    const emailKey = user.email.toLowerCase().trim();
    const existing = store.users[emailKey] || {
      id: "usr_" + Date.now(),
      email: emailKey,
      name: user.name || "সম্মানিত গ্রাহক",
      phone: "",
      messName: "",
      roomNo: "",
      walletBalance: 0,
    };

    const updated: UserProfile = {
      ...existing,
      ...user,
      name: user.name || existing.name,
      walletBalance:
        user.walletBalance !== undefined
          ? user.walletBalance
          : existing.walletBalance,
    };

    store.users[emailKey] = updated;
    saveStore(store);
    return updated;
  },

  addWalletRequest(reqData: {
    email: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    paymentMethod: string;
    trxId: string;
  }): WalletReq {
    const store = getStore();
    const emailKey = reqData.email.toLowerCase().trim();

    // ইউজার না থাকলে তৈরি করা
    if (!store.users[emailKey]) {
      this.saveUser({
        email: emailKey,
        name: reqData.customerName,
        phone: reqData.customerPhone,
        walletBalance: 0,
      });
    }

    const newReq: WalletReq = {
      id: "wreq_" + Date.now(),
      email: emailKey,
      customerName: reqData.customerName || "সম্মানিত গ্রাহক",
      customerPhone: reqData.customerPhone || "N/A",
      amount: Number(reqData.amount),
      paymentMethod: reqData.paymentMethod || "BKASH",
      trxId: String(reqData.trxId).toUpperCase().trim(),
      status: "PENDING",
      createdAt: new Date().toISOString(),
      user: {
        email: emailKey,
        walletBalance: store.users[emailKey]?.walletBalance || 0,
      },
    };

    store.walletRequests.unshift(newReq);
    saveStore(store);
    return newReq;
  },

  getWalletRequests(): WalletReq[] {
    const store = getStore();
    return store.walletRequests.map((r) => ({
      ...r,
      user: {
        email: r.email,
        walletBalance: store.users[r.email.toLowerCase()]?.walletBalance || 0,
      },
    }));
  },

  updateWalletRequestStatus(id: string, action: "APPROVE" | "REJECT"): boolean {
    const store = getStore();
    const req = store.walletRequests.find((r) => r.id === id);
    if (!req || req.status !== "PENDING") return false;

    if (action === "APPROVE") {
      req.status = "APPROVED";
      const emailKey = req.email.toLowerCase().trim();
      const user = store.users[emailKey] || {
        id: "usr_" + Date.now(),
        email: emailKey,
        name: req.customerName,
        phone: req.customerPhone,
        messName: "",
        roomNo: "",
        walletBalance: 0,
      };
      user.walletBalance = (user.walletBalance || 0) + req.amount;
      store.users[emailKey] = user;
    } else {
      req.status = "REJECTED";
    }

    saveStore(store);
    return true;
  },
};
