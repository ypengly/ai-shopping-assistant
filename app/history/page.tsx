import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Recommendation history" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await requireUser("/history");
  const conversations = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: { _count: { select: { recommendations: true } } },
  });

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-semibold">Recommendation history</h1>

      {conversations.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No conversations yet. <Link href="/ai-assistant" className="text-primary underline-offset-4 hover:underline">Ask the AI assistant</Link> to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link key={c.id} href={`/ai-assistant?conversationId=${c.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription>
                    {c.updatedAt.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {c._count.recommendations} product{c._count.recommendations === 1 ? "" : "s"} found
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
