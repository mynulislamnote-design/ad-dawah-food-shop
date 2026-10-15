// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // সার্ভার স্টার্ট হওয়ার সাথে সাথে ক্রন জব ও হোয়াটসঅ্যাপ সেশন ইনিশিয়ালাইজ হবে
    await import("./lib/cron");
  }
}
