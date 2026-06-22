"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useProgress } from "@/hooks/use-progress";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, Copy, Loader2, RefreshCw, Save } from "lucide-react";

export function ProgressSync() {
  const { language } = useLanguage();
  const { known, favorites, code, setSyncCode, importProgress } = useProgress();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [input, setInput] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setSavedCode(null);
    setCopied(false);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ known, favorites, code }),
      });
      const json = await res.json();
      if (res.ok && json.code) {
        setSavedCode(json.code);
        setSyncCode(json.code);
      } else {
        setRestoreMsg({ ok: false, text: t("syncError", language) });
      }
    } catch {
      setSavedCode(null);
      setRestoreMsg({ ok: false, text: t("syncError", language) });
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!savedCode) return;
    try {
      await navigator.clipboard.writeText(savedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable - code is shown on screen anyway */
    }
  }

  async function handleRestore() {
    const trimmed = input.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setRestoreMsg({ ok: false, text: t("codeNotFound", language) });
      return;
    }
    setRestoring(true);
    setRestoreMsg(null);
    try {
      const res = await fetch(`/api/progress?code=${trimmed}`);
      if (res.status === 404) {
        setRestoreMsg({ ok: false, text: t("codeNotFound", language) });
        return;
      }
      if (!res.ok) {
        setRestoreMsg({ ok: false, text: t("syncError", language) });
        return;
      }
      const json = await res.json();
      importProgress({ known: json.known, favorites: json.favorites, code: trimmed });
      setRestoreMsg({ ok: true, text: t("restored", language) });
      setInput("");
    } catch {
      setRestoreMsg({ ok: false, text: t("syncError", language) });
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Save className="size-3.5" />
            {t("saveCode", language)}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("syncTitle", language)}</DialogTitle>
          <DialogDescription>{t("syncDesc", language)}</DialogDescription>
        </DialogHeader>

        {/* Save section */}
        <div className="space-y-3">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? t("saving", language) : t("saveProgress", language)}
          </Button>

          {savedCode && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-center space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("yourCode", language)}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-3xl font-semibold tracking-[0.3em] tabular-nums">
                  {savedCode}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copy code">
                  {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("codeHint", language)}</p>
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Restore section */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("enterCode", language)}
          </label>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              pattern="\d*"
              maxLength={4}
              placeholder="1234"
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRestore();
              }}
              className="h-9 text-center font-mono text-lg tracking-[0.3em] tabular-nums"
            />
            <Button onClick={handleRestore} disabled={restoring || input.length !== 4} size="sm">
              {restoring ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {restoring ? t("restoring", language) : t("restore", language)}
            </Button>
          </div>
          {restoreMsg && (
            <p className={restoreMsg.ok ? "text-xs text-success" : "text-xs text-destructive"}>
              {restoreMsg.text}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
