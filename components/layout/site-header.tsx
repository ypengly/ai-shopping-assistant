import Link from "next/link";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
          </span>
          {siteConfig.name}
        </Link>

        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto sm:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Button key={link.href} asChild variant="ghost" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/ai-assistant">
              <Sparkles className="h-4 w-4" /> AI Assistant
            </Link>
          </Button>
        </nav>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Account">
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link href="/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <ThemeToggle />
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">{user.name.split(" ")[0]}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 sm:hidden" aria-label="Main">
        {NAV_LINKS.map((link) => (
          <Button key={link.href} asChild variant="ghost" size="sm" className="shrink-0">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
        <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1.5">
          <Link href="/ai-assistant">
            <Sparkles className="h-4 w-4" /> AI Assistant
          </Link>
        </Button>
      </nav>
    </header>
  );
}
