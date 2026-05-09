/**
 * NextAuth route handler — catches all /api/auth/* requests.
 * Auth logic lives in src/lib/auth.ts; this file only wires it into Next.js.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
