"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Wraps the app with NextAuth's SessionProvider.
 * This makes useSession() available in any client component
 * (like Navbar) without prop-drilling.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
