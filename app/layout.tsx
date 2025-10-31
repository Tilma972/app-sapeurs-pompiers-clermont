import type { Metadata, Viewport } from "next";
import { Montserrat, Roboto } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { OverflowDebugger } from "@/components/overflow-debugger";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Amicale des Sapeurs-Pompiers de Clermont l'Hérault",
  description: "L'Amicale des Sapeurs-Pompiers de Clermont l'Hérault œuvre chaque jour pour la cohésion et le soutien de nos héros du quotidien.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Fonts du Projet 2 (meilleur responsive)
const montserrat = Montserrat({
  variable: "--font-montserrat",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="scroll-smooth overflow-x-clip">
      <body
        className={[
          "min-h-dvh w-full overflow-x-hidden bg-background text-foreground antialiased",
          "touch-pan-y",
          montserrat.variable,
          roboto.variable,
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

          <main id="content" className="w-full">
            {children}
          </main>

          <Toaster position="top-right" />
          {process.env.NODE_ENV === "development" ? <OverflowDebugger /> : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
