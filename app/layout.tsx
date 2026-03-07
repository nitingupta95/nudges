import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "Nudges";
const APP_DESCRIPTION =
  "AI-powered employee referral platform that intelligently matches members to open roles, delivers personalized nudges, and streamlines the entire referral lifecycle — from smart matching to hire.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nudges-lake.vercel.app/";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "employee referrals",
    "AI hiring",
    "referral platform",
    "talent acquisition",
    "smart matching",
    "nudge engine",
    "recruiting",
    "HR tech",
  ],
  authors: [{ name: "Nudges Team" }],
  creator: "Nudges",
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
