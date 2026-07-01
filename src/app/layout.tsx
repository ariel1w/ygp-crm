import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YGP CRM",
  description: "Yoav Gross Productions - Contact & Follow-Up CRM",
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="sticky top-0 z-50 bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-8">
                <Link href="/contacts" className="flex items-center gap-3">
                  <Image
                    src="/logo.jpg"
                    alt="YGP"
                    width={160}
                    height={56}
                    className="h-12 w-auto"
                    priority
                  />
                </Link>
                <div className="flex items-center gap-1">
                  <Link
                    href="/contacts"
                    className="px-4 py-1.5 text-sm font-bold text-muted hover:text-primary transition-colors"
                  >
                    Contacts
                  </Link>
                  <Link
                    href="/"
                    className="px-4 py-1.5 text-sm font-bold text-muted hover:text-primary transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/projects"
                    className="px-4 py-1.5 text-sm font-bold text-muted hover:text-primary transition-colors"
                  >
                    Projects
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="fixed inset-0 -z-10" style={{ background: "url(/bg-contacts.png) center/cover no-repeat" }} />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 relative">
          {children}
        </main>
      </body>
    </html>
  );
}
