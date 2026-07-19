import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/((?!api/auth|api/mcp|api/sse|_next/static|_next/image|icon.svg|favicon.ico).*)'],
};
