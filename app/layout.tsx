
import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MMU Medicine Audit",
    template: "%s | MMU Medicine Audit",
  },
  description:
    "A professional MMU medicine audit platform for auditing stock, generating reports, and managing application stock workflows.",
  keywords: [
    "MMU",
    "medicine audit",
    "medical audit",
    "application stock",
    "audit reports",
    "mobile medical unit",
    "healthcare inventory",
  ],
  authors: [{ name: "MMU Medicine Audit" }],
  creator: "MMU Medicine Audit",
  applicationName: "MMU Medicine Audit",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "MMU Medicine Audit",
    title: "MMU Medicine Audit",
    description:
      "A professional MMU medicine audit platform for stock audits and report generation.",
    images: [
      {
        url: "/mmu-logo.png",
        width: 512,
        height: 512,
        alt: "MMU Medicine Audit Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MMU Medicine Audit",
    description:
      "A professional MMU medicine audit platform for stock audits and report generation.",
    images: ["/mmu-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
