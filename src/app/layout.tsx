import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/next"
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SkillSphere",
  icons: {
    icon: ["/favicon.ico"],
    apple:["apple-touch-icon.png?v=4"],
    shortcut:["/apple-touch-icon.png"]
  },
  description: "SkillSphere LMS A modern, responsive Learning Management System built with Next.js. Offers seamless course browsing, video streaming, PDF downloads, and user-friendly dashboards for learners and instructors.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navbar/>
          {children}
          <SpeedInsights />
          <Analytics />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

