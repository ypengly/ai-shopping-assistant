"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard, type ProductCardData } from "@/components/products/product-card";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string; products?: ProductCardData[]; reasons?: Record<string, string> };

export function ChatWindow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(searchParams.get("conversationId"));
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "intro", role: "assistant", content: "Hi! What are you looking for today?" },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = searchParams.get("conversationId");
    if (!id) return;
    fetch(`/api/conversations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.conversation) return;
        const reasonsByProduct: Record<string, string> = {};
        for (const rec of data.conversation.recommendations) reasonsByProduct[rec.productId] = rec.reason;
        const lastProducts = data.conversation.recommendations.map((r: { product: ProductCardData }) => r.product);

        setConversationId(id);
        setMessages(
          data.conversation.messages.map((m: { id: string; role: "user" | "assistant"; content: string }, i: number, arr: unknown[]) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            ...(m.role === "assistant" && i === arr.length - 1 ? { products: lastProducts, reasons: reasonsByProduct } : {}),
          })),
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || pending) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: message }]);
    setPending(true);

    try {
      const response = await fetch("/api/ai/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await response.json();

      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/ai-assistant")}`);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply, products: data.products, reasons: data.reasons },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`flex max-w-[85%] gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </span>
              <div>
                <div className={`rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.content}
                </div>
                {m.products && m.products.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {m.products.map((p) => (
                      <ProductCard key={p.id} product={p} aiPick reason={m.reasons?.[p.id]} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse" /> AI is searching for the best products…
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t p-4">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message…" disabled={pending} />
        <Button type="submit" size="icon" disabled={pending || !input.trim()} aria-label="Send">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
