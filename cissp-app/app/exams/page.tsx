import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ExamPractice } from "@/components/ExamPractice";

export const metadata: Metadata = {
  title: "CISSP oefenen en toetsen",
  description:
    "Oefen met directe feedback of maak een volledige toets met theorie, casussen en 400 CISSP-begrippen.",
};

export default function ExamsPage() {
  return (
    <AppShell>
      <ExamPractice />
    </AppShell>
  );
}
