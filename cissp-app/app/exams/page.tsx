import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ExamPractice } from "@/components/ExamPractice";

export const metadata: Metadata = {
  title: "Oefentoets CISSP",
  description: "Oefentoets met 40 theorie- en casusvragen over alle acht CISSP-domeinen.",
};

export default function ExamsPage() {
  return (
    <AppShell>
      <ExamPractice />
    </AppShell>
  );
}
