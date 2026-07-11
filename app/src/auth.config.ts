import type { NextAuthConfig } from 'next-auth';

// Edge-safe base config (no Prisma/bcrypt imports) shared by auth.ts and
// the middleware. Credentials verification lives in auth.ts only.
export const authConfig = {
  trustHost: true, // self-hosted / host-agnostic deployment
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith('/signin')) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
