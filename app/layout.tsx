import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { OverflowDebugger } from "@/components/overflow-debugger";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Amicale SP Clermont-l'Hérault",
    template: "%s | Amicale ASPCH",
  },
  description: "Application de gestion pour l'Amicale des Sapeurs-Pompiers - Tournées, calendriers, dons fiscaux et services aux membres",
  
  // PWA Configuration
  manifest: "/manifest.json",
  
  
  // Apple Web App
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Amicale ASPCH",
  },
  
  // Metadata supplémentaires
  applicationName: "Amicale ASPCH",
  authors: [{ name: "Amicale des Sapeurs-Pompiers de Clermont-l'Hérault" }],
  keywords: ["pompiers", "sapeurs-pompiers", "amicale", "clermont", "hérault", "calendriers", "dons"],
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Amicale SP Clermont-l'Hérault",
    title: "Amicale des Sapeurs-Pompiers",
    description: "Application de gestion Amicale SP",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Logo Amicale ASPCH",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary",
    title: "Amicale SP Clermont-l'Hérault",
    description: "Application de gestion Amicale des Sapeurs-Pompiers",
    images: ["/icons/icon-512x512.png"],
  },
  
  // Icons
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icons/icon-192x192.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#C63320",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="overflow-x-clip">
      <head>
        {/* Apple Touch Icons (iOS) */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-152x152.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
        
        {/* Apple Mobile Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Amicale SP" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#C63320" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body
        className={[
          "min-h-dvh w-full overflow-x-hidden bg-background text-foreground antialiased",
          "touch-pan-y",
          geistSans.variable,
        ].join(" ")}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
          >
            Aller au contenu
          </a>

          <header className="w-full">
            {/* Header global optionnel */}
          </header>

          <main
            id="content"
            className="w-full"
          >
            {children}
          </main>

          <footer className="w-full">
            {/* Footer optionnel */}
          </footer>

          <Toaster position="bottom-center" />
          {process.env.NODE_ENV === "development" ? <OverflowDebugger /> : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
