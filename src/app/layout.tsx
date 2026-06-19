import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "PEPE MINE",
  description: "Mine des PEPE gratuitement et retire sur FaucetPay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Script
          src="//libtl.com/sdk.js"
          data-zone="11174625"
          data-sdk="show_11174625"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-black">{children}</body>
    </html>
  );
}