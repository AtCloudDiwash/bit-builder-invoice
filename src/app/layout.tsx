import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Invoicing System",
  description: "BitBuilders Hackathon Project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <header className="bg-gray-800 p-4 shadow-md">
          <nav className="container mx-auto flex justify-between">
            <Link href="/" className="text-xl font-bold">
              InvoiceApp
            </Link>
            <div className="space-x-4">
              <Link href="/admin" className="hover:text-gray-400">
                Admin
              </Link>
              <Link href="/cashier" className="hover:text-gray-400">
                Cashier
              </Link>
              <Link href="/history" className="hover:text-gray-400">
                History
              </Link>
            </div>
          </nav>
        </header>
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
