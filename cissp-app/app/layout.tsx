import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CommandMenuProvider } from "@/components/command-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import "./learn-content.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CISSP — 400 Begrippen",
  description:
    "Leer 400 CISSP-begrippen met snelle zoekfunctie, flashcards, quiz en voortgangstracking.",
};

const themeScript = `(function(){try{var t=localStorage.getItem("cissp-theme");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <TooltipProvider>
          <ThemeProvider>
            <LanguageProvider>
              <CommandMenuProvider>{children}</CommandMenuProvider>
            </LanguageProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
