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
      const { pathname, searchParams } = request.nextUrl;
      if (pathname.startsWith('/signin')) return true;
      // the agent's PDF renderer reaches the print route with a shared token
      if (
        pathname.endsWith('/print') &&
        !!process.env.PRINT_TOKEN &&
        searchParams.get('token') === process.env.PRINT_TOKEN
      ) {
        return true;
      }
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
