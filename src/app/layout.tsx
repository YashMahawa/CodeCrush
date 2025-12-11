import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodeCrush - Your Ultimate Coding Companion",
  description: "AI-powered test case generation, secure code execution, and intelligent debugging assistance for competitive programmers.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#050505] relative min-h-screen`}>
        <div className="kinetic-atmosphere" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
