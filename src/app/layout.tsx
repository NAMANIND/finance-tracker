import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryClientProvider } from "@/providers/tanstack";
import { Toaster } from "sonner";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loan Management System",
  description: "A comprehensive loan management system for admin and agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryClientProvider>
          <main className="min-h-screen bg-gray-50">{children}</main>
        </ReactQueryClientProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
