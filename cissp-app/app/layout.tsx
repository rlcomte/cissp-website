import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="nl"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <TooltipProvider>
          <LanguageProvider>
            <CommandMenuProvider>{children}</CommandMenuProvider>
          </LanguageProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
