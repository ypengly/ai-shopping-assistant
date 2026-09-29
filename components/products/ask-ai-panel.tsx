"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AskAiPanel({ productId }: { productId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setPending(true);
    setError(null);
    setAnswer(null);

    try {
      const response = await fetch("/api/ai/product-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 flex items-center gap-2 font-medium">
        <Sparkles className="h-4 w-4 text-primary" /> Ask AI about this product
      </h3>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Is this good for programming? Does it fit a size 42?"
          rows={2}
        />
        <Button type="submit" disabled={pending || !question.trim()} className="self-end">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Ask
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {answer && <p className="mt-3 rounded-md bg-accent p-3 text-sm text-accent-foreground">{answer}</p>}
    </div>
  );
}
