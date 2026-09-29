"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Brand = { id: string; name: string; _count: { products: number } };

export function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create the brand.");
      setName("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the brand.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this brand?")) return;
    const response = await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error ?? "Could not delete this brand.");
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="flex items-end gap-2 rounded-lg border p-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Brand name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <Button type="submit" disabled={saving || !name.trim()} className="gap-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="divide-y rounded-lg border">
          {brands.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 text-sm">
              <span>{b.name} <span className="text-muted-foreground">({b._count.products} products)</span></span>
              <Button size="sm" variant="ghost" onClick={() => onDelete(b.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
