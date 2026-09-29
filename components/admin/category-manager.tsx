"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Category = { id: string; name: string; slug: string; parentId: string | null; _count: { products: number; children: number } };

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slugify(name), parentId: parentId || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create the category.");
      setName("");
      setParentId("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the category.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error ?? "Could not delete this category.");
      return;
    }
    load();
  }

  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-2 rounded-lg border p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-sm font-medium">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="min-w-[160px]">
          <label className="mb-1 block text-sm font-medium">Parent (optional)</label>
          <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None (top-level)</option>
            {topLevel.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={saving || !name.trim()} className="gap-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-4">
          {topLevel.map((top) => (
            <div key={top.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{top.name}</span>
                <Button size="sm" variant="outline" onClick={() => onDelete(top.id)} className="gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
              <div className="space-y-1 pl-4 text-sm">
                {categories
                  .filter((c) => c.parentId === top.id)
                  .map((child) => (
                    <div key={child.id} className="flex items-center justify-between border-t py-1.5 first:border-0">
                      <span>{child.name} <span className="text-muted-foreground">({child._count.products} products)</span></span>
                      <Button size="sm" variant="ghost" onClick={() => onDelete(child.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
