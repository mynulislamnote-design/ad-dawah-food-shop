import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// প্রতিদিন সকাল ১০টায় রান করার ক্রন এক্সপ্রেশন: "0 10 * * *"
// (টেস্ট করার জন্য আপনি চাইলে প্রতি ১ মিনিট পর পর দিতে পারেন: "* * * * *")
cron.schedule("0 10 * * *", async () => {
  console.log("⏰ সকাল ১০টার অটোমেটিক WhatsApp রিমাইন্ডার জব শুরু হয়েছে...");

  try {
    // ১. ডেটাবেজ থেকে এমন কাস্টমারদের খুঁজুন যাদের বকেয়া (Due) আছে বা আজকের নোটিফিকেশন পাঠানো দরকার
    // (আপনার ডেটাবেজ স্ট্রাকচার অনুযায়ী কুয়েরি পরিবর্তন করে নেবেন)
    const customersToRemind = await prisma.dailyOrder.findMany({
      where: {
        // উদাহরণস্বরূপ শর্ত: যাদের পেমেন্ট বাকি বা নির্দিষ্ট ক্রাইটেরিয়া মিলে
        // isSkipped: false
      },
      distinct: ["customerPhone"], // একই কাস্টমারকে বারবার না পাঠিয়ে ইউনিক নাম্বার নেওয়া
    });

    for (const customer of customersToRemind) {
      if (!customer.customerPhone) continue;

      const message = `প্রিয় ${customer.customerName}, আপনার আজকের হিসাব বা বকেয়া চেক করুন এবং সময়মতো পরিশোধ করুন। ধন্যবাদ! - আদ-দাওয়া ফুড শপ`;

      try {
        await sendWhatsAppMessage(customer.customerPhone, message);
        console.log(
          `✅ অটোমেটিক মেসেজ পাঠানো হয়েছে: ${customer.customerPhone}`,
        );
      } catch (err) {
        console.error(
          `❌ মেসেজ পাঠানো ব্যর্থ হয়েছে ${customer.customerPhone}:`,
          err,
        );
      }
    }
  } catch (error) {
    console.error("Cron job database error:", error);
  }
});
