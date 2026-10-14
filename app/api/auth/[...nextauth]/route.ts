import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { userWalletStore } from "@/lib/userWalletStore";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        userWalletStore.saveUser({
          email: user.email,
          name: user.name || "সম্মানিত গ্রাহক",
        });
        return true;
      } catch (err) {
        return true;
      }
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = userWalletStore.getUser(session.user.email);
        if (dbUser) {
          (session.user as any).id = dbUser.id;
          (session.user as any).phone = dbUser.phone;
          (session.user as any).messName = dbUser.messName;
          (session.user as any).roomNo = dbUser.roomNo;
          (session.user as any).walletBalance = dbUser.walletBalance;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret:
    process.env.NEXTAUTH_SECRET || "ad-dawah-food-shop-secret-super-key-2026",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
