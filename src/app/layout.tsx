import type { Metadata } from "next";
import { Bebas_Neue, Black_Ops_One, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const blackOps = Black_Ops_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-black-ops",
});

const shareTech = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech",
});

export const metadata: Metadata = {
  title: "UrbanQuest — Civic Mission Control",
  description:
    "Report, verify, and track community issues through a gamified mission control interface.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${blackOps.variable} ${shareTech.variable}`}
    >
      <body className="font-mono antialiased">{children}</body>
    </html>
  );
}
