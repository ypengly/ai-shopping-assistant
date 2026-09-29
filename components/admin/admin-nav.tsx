import Link from "next/link";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b pb-3">
      {LINKS.map((link) => (
        <Button key={link.href} asChild size="sm" variant={active === link.href ? "default" : "ghost"}>
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ))}
    </nav>
  );
}
