import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ChatWindow } from "@/components/ai/chat-window";

export const metadata: Metadata = { title: "AI Shopping Assistant" };
export const dynamic = "force-dynamic";

export default async function AiAssistantPage() {
  await requireUser("/ai-assistant");
  return <ChatWindow />;
}
