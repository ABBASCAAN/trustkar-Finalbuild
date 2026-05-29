import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import BackToTop from "@/components/BackToTop";
import StandaloneBoot from "@/components/StandaloneBoot";
import GetAppInstallPrompt from "@/components/GetAppInstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "TrustKar | Buy & Sell Securely with Escrow",
  description:
    "Pakistan's escrow-protected marketplace. Funds held until delivery verified.",
  keywords: ["TrustKar", "escrow", "marketplace", "Pakistan", "safe buying"],
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TrustKar",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0284c7",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="tk-app-shell flex min-h-screen flex-col antialiased">
        <AuthProvider>
          <ToastProvider>
            <StandaloneBoot />
            <Navbar />
            <main className="tk-main flex-1 pb-mobile-nav md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
            <GetAppInstallPrompt />
            <BackToTop />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
