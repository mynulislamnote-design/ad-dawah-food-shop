import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import qrcodeTerminal from "qrcode-terminal";

let sock: any = null;
let latestQr: string | null = null;

async function connectToWhatsApp() {
  const authFolder = path.join(process.cwd(), "auth_info_baileys");
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  sock = makeWASocket({
    logger: pino({ level: "silent" }) as any,
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQr = qr;
      qrcodeTerminal.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting...", shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      latestQr = null;
      console.log("✅ WhatsApp Connected Successfully!");
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

export async function sendWhatsAppMessage(phone: string, message: string) {
  if (!sock) {
    throw new Error("WhatsApp is not connected yet.");
  }

  let formattedPhone = phone.trim().replace("+", "");
  if (!formattedPhone.startsWith("88")) {
    formattedPhone = "88" + formattedPhone;
  }
  const jid = `${formattedPhone}@s.whatsapp.net`;

  await sock.sendMessage(jid, { text: message });
  return { success: true };
}

// অটো কানেক্ট ইনিশিয়ালাইজ করার জন্য
if (!sock) {
  connectToWhatsApp();
}
