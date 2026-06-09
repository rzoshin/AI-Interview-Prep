import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import { loginSchema } from "@/lib/validators/auth.schema";

export const authConfig: NextAuthConfig = {
  providers: [
    Google,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await connectDB();
        const user = await User.findOne({ email }).select("+hashedPassword").lean();
        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email,
            avatar: user.image,
            role: "user",
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        const patch = session as { image?: string; name?: string };
        if (patch.image !== undefined) token.picture = patch.image;
        if (patch.name !== undefined) token.name = patch.name;
        return token;
      }

      // Backfill avatar for sessions created before picture was stored on the token.
      if (!user && token.id && token.picture === undefined) {
        await connectDB();
        const dbUser = await User.findById(token.id as string).select("avatar name").lean();
        if (dbUser) {
          token.picture = dbUser.avatar ?? null;
          if (!token.name && dbUser.name) token.name = dbUser.name;
        } else {
          token.picture = null;
        }
      }

      // On initial sign-in, sync id, role, and avatar from MongoDB.
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email }).lean();
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role ?? "user";
          token.picture = dbUser.avatar ?? user.image ?? null;
          token.name = dbUser.name ?? user.name;
        } else {
          token.id = user.id;
          token.role = (user as { role?: string }).role ?? "user";
          token.picture = user.image ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = (token.picture as string | null | undefined) ?? null;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
};
