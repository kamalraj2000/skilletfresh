import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@skilletfresh/db';
import { authConfig } from '@/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.toLowerCase() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { profile: true },
        });
        if (!user?.profile) return null;
        if (!(await bcrypt.compare(password, user.passwordHash))) return null;

        return { id: user.id, email: user.email, name: user.name, profileId: user.profile.id };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.profileId = (user as { profileId?: string }).profileId;
      }
      return token;
    },
    session({ session, token }) {
      session.userId = token.userId as string;
      session.profileId = token.profileId as string;
      return session;
    },
  },
});

declare module 'next-auth' {
  interface Session {
    userId: string;
    profileId: string;
  }
}
