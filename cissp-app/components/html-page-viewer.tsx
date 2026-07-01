"use client";

import { useEffect, useRef } from "react";
import type { PageContent } from "@/lib/pages";
import { cn } from "@/lib/utils";

type HtmlPageViewerProps = {
  page: PageContent;
  className?: string;
};

export function HtmlPageViewer({ page, className }: HtmlPageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const triggers = root.querySelectorAll<HTMLElement>("[data-dialog-target]");
    const cleanups: (() => void)[] = [];

    triggers.forEach((trigger) => {
      const handler = () => {
        const id = trigger.dataset.dialogTarget;
        if (!id) return;
        const dialog = root.querySelector<HTMLDialogElement>(`#${CSS.escape(id)}`);
        dialog?.showModal();
      };
      trigger.addEventListener("click", handler);
      cleanups.push(() => trigger.removeEventListener("click", handler));
    });

    root.querySelectorAll<HTMLElement>("[data-dialog-close]").forEach((btn) => {
      const handler = () => btn.closest("dialog")?.close();
      btn.addEventListener("click", handler);
      cleanups.push(() => btn.removeEventListener("click", handler));
    });

    return () => cleanups.forEach((fn) => fn());
  }, [page.slug]);

  return (
    <div ref={containerRef} className={cn("learn-content", className)}>
      {page.nav.length > 0 && (
        <nav className="learn-page-nav" aria-label="Page sections">
          {page.nav.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      )}
      <div dangerouslySetInnerHTML={{ __html: page.html }} />
      {page.dialogs && (
        <div dangerouslySetInnerHTML={{ __html: page.dialogs }} />
      )}
    </div>
  );
}
