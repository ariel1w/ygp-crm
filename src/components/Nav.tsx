"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const isCRM =
    pathname === "/" ||
    pathname === "/contacts" ||
    pathname.startsWith("/contacts/") ||
    pathname === "/projects" ||
    pathname.startsWith("/projects/");

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
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
                className={`px-3 py-1.5 text-sm font-bold rounded-full transition-colors ${
                  isCRM
                    ? "bg-foreground text-white"
                    : "text-muted hover:text-primary"
                }`}
              >
                CRM
              </Link>
              <Link
                href="/reading-list"
                className={`px-3 py-1.5 text-sm font-bold rounded-full transition-colors ${
                  pathname.startsWith("/reading-list")
                    ? "bg-foreground text-white"
                    : "text-muted hover:text-primary"
                }`}
              >
                Reading List
              </Link>
              <Link
                href="/slate"
                className={`px-3 py-1.5 text-sm font-bold rounded-full transition-colors ${
                  pathname.startsWith("/slate")
                    ? "bg-foreground text-white"
                    : "text-muted hover:text-primary"
                }`}
              >
                Central Project List
              </Link>
            </div>
            {isCRM && (
              <div className="flex items-center gap-1 border-l border-border pl-4">
                <Link
                  href="/contacts"
                  className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                    pathname === "/contacts" || pathname.startsWith("/contacts/")
                      ? "text-primary"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  Contacts
                </Link>
                <Link
                  href="/"
                  className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                    pathname === "/"
                      ? "text-primary"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/projects"
                  className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                    pathname === "/projects" || pathname.startsWith("/projects/")
                      ? "text-primary"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  Projects
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
