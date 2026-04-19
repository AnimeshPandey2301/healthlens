import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import OfflineBanner from "@/components/OfflineBanner";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Phase 2: Hindi localisation — loaded now, applied later via CSS
const notoSans = Noto_Sans({
  subsets: ["devanagari", "latin"],
  variable: "--font-hindi",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "HealthLens — Health Awareness Platform",
  description:
    "Structured health awareness for India. Check symptoms, find conditions, get first aid guidance.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HealthLens",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-white text-gray-900 flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <OfflineBanner />
          <Navbar />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
