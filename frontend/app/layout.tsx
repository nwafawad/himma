import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/navigation/Header";
import QuickCaptureModal from "@/components/ui/QuickCaptureModal";
import ImportModal from "@/components/ui/ImportModal";
import PageTransition from "@/components/ui/PageTransition";
import FloatingLogButton from "@/components/ui/FloatingLogButton";

import InstallPromptBanner from "@/components/pwa/InstallPromptBanner";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";

export const metadata: Metadata = {
  title: "Momentum — Quiet reflection for self-directed learners",
  description: "Log study activity and view AI-generated career direction insights.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Momentum",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#6366F1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-canvas text-charcoal min-h-screen flex flex-col font-sans selection:bg-[#A5B4FC]">
        <Header />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <QuickCaptureModal />
        <ImportModal />
        <FloatingLogButton />
        <InstallPromptBanner />
        <MobileBottomNav />
      </body>
    </html>
  );
}
