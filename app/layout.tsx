import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Amicale SP – Tableau de bord",
  description: "Application Amicale des Sapeurs-Pompiers – gestion des tournées, calendriers et statistiques.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
    <html lang="fr" suppressHydrationWarning>
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
            className="mx-auto w-full max-w-screen-lg px-4 py-4 sm:px-6 lg:max-w-screen-xl lg:px-8"
          >
            {children}
          </main>

          <footer className="mx-auto w-full max-w-screen-lg px-4 py-6 sm:px-6 lg:max-w-screen-xl lg:px-8">
            {/* Footer optionnel */}
          </footer>

          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
