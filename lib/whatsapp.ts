import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import path from "path";

// সকেট গ্লোবাল ইনস্ট্যান্স (Next.js রিলোডে বারবার নতুন কানেকশন এড়াতে)
const globalForWhatsApp = globalThis as unknown as {
  waSocket?: WASocket;
  isConnecting?: boolean;
};

// ১. শতভাগ নির্ভুল মোবাইল নাম্বার ফরম্যাটার (বাংলা সংখ্যা, +, -, স্পেস হ্যান্ডেল করবে)
export function formatToWhatsAppJid(phone: string): string {
  if (!phone) return "";

  // বাংলা সংখ্যাকে ইংরেজি সংখ্যায় রূপান্তর (০-৯ -> 0-9)
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let clean = phone.toString();
  banglaDigits.forEach((digit, index) => {
    clean = clean.split(digit).join(index.toString());
  });

  // শুধু ইংরেজি সংখ্যা রেখে বাকি সব চিহ্ন (+, -, স্পেস ইত্যাদি) মুছে ফেলা
  clean = clean.replace(/\D/g, "");

  // যদি 01 দিয়ে শুরু হয় (১১ ডিজিট, যেমন: 017XXXXXXXX) -> শুরুতে 88 যোগ হবে
  if (clean.startsWith("01") && clean.length === 11) {
    clean = "88" + clean;
  }
  // যদি 1 দিয়ে শুরু হয় (১০ ডিজিট, যেমন: 17XXXXXXXX) -> শুরুতে 880 যোগ হবে
  else if (clean.startsWith("1") && clean.length === 10) {
    clean = "880" + clean;
  }
  // যদি অলরেডি 8801... (১৩ ডিজিট) থাকে তবে অপরিবর্তিত থাকবে

  // Baileys এর সঠিক JID ফরম্যাট (কোনো '+' থাকবে না)
  return `${clean}@s.whatsapp.net`;
}

// ২. WhatsApp কানেকশন ইনিশিয়ালাইজেশন
export async function connectToWhatsApp(): Promise<WASocket> {
  if (globalForWhatsApp.waSocket) {
    return globalForWhatsApp.waSocket;
  }

  if (globalForWhatsApp.isConnecting) {
    // ইতোমধ্যে কানেক্ট হতে থাকলে অপেক্ষা করা
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (globalForWhatsApp.waSocket) return globalForWhatsApp.waSocket;
  }

  globalForWhatsApp.isConnecting = true;

  try {
    const sessionDir = path.join(process.cwd(), "auth_info_baileys");
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }), // কনসোল ক্লিন রাখতে লগ সাইলেন্ট
      printQRInTerminal: false,
      auth: state,
      browser: ["Ad-Dawah Food", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      // যদি কিউআর কোড আসে তা টার্মিনালে সুন্দর করে দেখানো
      if (qr) {
        console.log(
          "\n📱 WhatsApp QR Code generated! Scan it with your phone:\n",
        );
        qrcode.generate(qr, { small: true });
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !==
          DisconnectReason.loggedOut;
        console.log("Connection closed. Reconnecting...", shouldReconnect);
        globalForWhatsApp.waSocket = undefined;
        globalForWhatsApp.isConnecting = false;

        if (shouldReconnect) {
          setTimeout(() => connectToWhatsApp(), 3000);
        }
      } else if (connection === "open") {
        console.log("✅ WhatsApp Connected Successfully!");
        globalForWhatsApp.waSocket = sock;
        globalForWhatsApp.isConnecting = false;
      }
    });

    globalForWhatsApp.waSocket = sock;
    return sock;
  } catch (error) {
    console.error("Error connecting to WhatsApp:", error);
    globalForWhatsApp.isConnecting = false;
    throw error;
  }
}

// ৩. মেসেজ পাঠানোর মূল এক্সপোর্ট ফাংশন
export async function sendWhatsAppMessage(
  phone: string,
  text: string,
): Promise<boolean> {
  try {
    const jid = formatToWhatsAppJid(phone);

    if (!jid || jid.length < 15) {
      console.error(`❌ Invalid phone number provided: ${phone}`);
      return false;
    }

    // সকেট রেডি আছে কিনা চেক, না থাকলে কানেক্ট করা
    let sock = globalForWhatsApp.waSocket;
    if (!sock) {
      sock = await connectToWhatsApp();
    }

    // মেসেজ সেন্ড
    console.log(`📤 Sending WhatsApp message to: ${jid}`);
    await sock.sendMessage(jid, { text });
    console.log(`✅ WhatsApp message sent successfully to: ${jid}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp message to ${phone}:`, error);
    return false;
  }
}

// ফাইল লোড হওয়ার সাথে সাথেই ব্যাকগ্রাউন্ডে কানেকশন চালু হবে
if (!globalForWhatsApp.waSocket && !globalForWhatsApp.isConnecting) {
  connectToWhatsApp().catch((err) =>
    console.error("Initial WhatsApp connection error:", err),
  );
}
