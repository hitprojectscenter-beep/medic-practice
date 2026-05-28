import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "תרגול חובשים | קורס רפואת חירום",
  description: "אפליקציית תרגול לקורס חובשי רפואת חירום ונהגי אמבולנס - שאלות אמריקאיות, אנמנזה, ומבחנים מעורבים",
  applicationName: "תרגול חובשים",
  keywords: ["חובשים", "רפואת חירום", "אנמנזה", "תרגול", "מבחן"]
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d9488"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
