import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./db";

declare module "next-auth" {
  interface User {
    id: string;
    role: "landlord" | "tenant";
    name: string;
    email: string;
  }
  interface Session {
    user: {
      id: string;
      role: "landlord" | "tenant";
      name: string;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "landlord" | "tenant";
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
          role: user.role as "landlord" | "tenant",
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: { signIn: "/logga-in" },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (process.env.NODE_ENV === "production" && !secret?.trim()) {
      console.warn(
        "[auth] NEXTAUTH_SECRET is not set in production. Set it in your environment to secure sessions."
      );
    }
    return secret?.trim() || "dev-secret-change-in-production";
  })(),
};
