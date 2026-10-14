export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/cron"); // ক্রন ফাইলটি ব্যাকগ্রাউন্ডে স্টার্ট হয়ে যাবে
  }
}
