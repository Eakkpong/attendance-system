import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customAdapter = PrismaAdapter(prisma) as any;

export const authOptions: AuthOptions = {
  adapter: {
    ...customAdapter,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createSession: (session: any) => prisma.authSession.create({ data: session }),
    getSessionAndUser: async (sessionToken: string) => {
      const userAndSession = await prisma.authSession.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!userAndSession) return null;
      const { user, ...session } = userAndSession;
      return { user, session };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateSession: (session: any) => prisma.authSession.update({ where: { sessionToken: session.sessionToken }, data: session }),
    deleteSession: (sessionToken: string) => prisma.authSession.delete({ where: { sessionToken } }),
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // We will build a custom login page
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
