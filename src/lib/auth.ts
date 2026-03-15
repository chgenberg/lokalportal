import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./db";
import type { UserRole } from "./types";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    isBuyer: boolean;
    isSeller: boolean;
    isAdmin: boolean;
    name: string;
    email: string;
    subscriptionTier: string;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isBuyer: boolean;
      isSeller: boolean;
      isAdmin: boolean;
      name: string;
      email: string;
      subscriptionTier: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isBuyer: boolean;
    isSeller: boolean;
    isAdmin: boolean;
    subscriptionTier: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "BankID",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          isBuyer: user.isBuyer,
          isSeller: user.isSeller,
          isAdmin: user.isAdmin,
          subscriptionTier: user.subscriptionTier,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isBuyer = user.isBuyer;
        token.isSeller = user.isSeller;
        token.isAdmin = user.isAdmin;
        token.subscriptionTier = user.subscriptionTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isBuyer = token.isBuyer;
        session.user.isSeller = token.isSeller;
        session.user.isAdmin = token.isAdmin;
        session.user.subscriptionTier = token.subscriptionTier;
      }
      return session;
    },
  },
  pages: { signIn: "/logga-in" },
  secret: (() => {
    const s = process.env.NEXTAUTH_SECRET?.trim();
    if (process.env.NODE_ENV === "production" && !s) {
      throw new Error("NEXTAUTH_SECRET is required in production. Set it in your environment.");
    }
    return s || "dev-secret-change-in-production";
  })(),
};
