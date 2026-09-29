import { MessageCircle, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, typeof MessageCircle> = { Telegram: Send, Phone: Phone, Messenger: MessageCircle };

export function ContactSeller({ channel, value, instructions, productName }: { channel: string; value: string; instructions: string; productName: string }) {
  const Icon = ICONS[channel] ?? MessageCircle;

  const href =
    channel === "Telegram" && value
      ? `https://t.me/${value.replace(/^@/, "")}`
      : channel === "Phone" && value
        ? `tel:${value}`
        : channel === "Messenger" && value
          ? `https://m.me/${value}`
          : undefined;

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-3 text-sm text-muted-foreground">{instructions}</p>
      {href ? (
        <Button asChild className="w-full gap-2">
          <a href={href} target="_blank" rel="noopener noreferrer">
            <Icon className="h-4 w-4" /> Contact via {channel} about {productName}
          </a>
        </Button>
      ) : (
        <Button className="w-full gap-2" disabled>
          <Icon className="h-4 w-4" /> Contact channel not configured yet
        </Button>
      )}
    </div>
  );
}
