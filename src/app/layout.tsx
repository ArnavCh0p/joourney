import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import TitleBar from "@/components/TitleBar";
import SplashScreen from "@/components/SplashScreen";
import Providers from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Joourney",
  description: "Your personal gaming journal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="bg-[#1e293b] min-h-screen">
        <Providers>
          <SplashScreen />
          <div className="mx-auto max-w-6xl min-h-screen plane-texture shadow-[0_0_80px_rgba(0,0,0,0.12)]">
            <TitleBar />
            <Navbar />
            <main className="px-6 py-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
