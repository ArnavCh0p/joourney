import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SplashScreen from "@/components/SplashScreen";
import UpdateChecker from "@/components/UpdateChecker";
import Providers from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Joourney",
  description: "Your personal gaming journal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="bg-[#0f172a] min-h-screen">
        <Providers>
          <SplashScreen />
          <UpdateChecker />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 px-8 py-8 max-w-6xl w-full mx-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
