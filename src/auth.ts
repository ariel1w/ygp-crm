import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_EMAILS = [
  "yoav.gross.n@gmail.com",
  "ariel1w@gmail.com",
  "maayanisak@gmail.com",
  "osher7@gmail.com",
  "zivarnon@gmail.com",
  "natashajkaminsky@gmail.com",
  "shanigolan22@gmail.com",
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    signIn({ user }) {
      return ALLOWED_EMAILS.includes(user.email?.toLowerCase() ?? "");
    },
  },
});
