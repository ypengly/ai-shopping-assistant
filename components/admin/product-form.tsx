"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Category = { id: string; name: string; parentId: string | null };
type Brand = { id: string; name: string };
type Spec = { key: string; value: string };
type Variant = { color: string; size: string; stock: number; sku: string };
type ImageInput = { url: string; alt: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  categoryId: string;
  brandId: string | null;
  status: "ACTIVE" | "INACTIVE";
  featured: boolean;
  images: ImageInput[];
  tags: string[];
  specs: Spec[];
  variants: Variant[];
};

const EMPTY: ProductFormValues = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: 0,
  originalPrice: null,
  stock: 0,
  categoryId: "",
  brandId: null,
  status: "ACTIVE",
  featured: false,
  images: [{ url: "", alt: "" }],
  tags: [],
  specs: [],
  variants: [],
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ProductForm({ initial }: { initial?: ProductFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(", ") ?? "");
  const [features, setFeatures] = useState("");
  const [generating, setGenerating] = useState<"description" | "tags" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/admin/categories").then((r) => r.json()), fetch("/api/admin/brands").then((r) => r.json())]).then(
      ([c, b]) => {
        setCategories(c.categories ?? []);
        setBrands(b.brands ?? []);
      },
    );
  }, []);

  const categoryOptions = useMemo(() => categories.filter((c) => c.parentId), [categories]);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onNameChange(name: string) {
    set("name", name);
    if (!slugTouched) set("slug", slugify(name));
  }

  async function generateDescription() {
    if (!values.name || !features) return;
    setGenerating("description");
    setError(null);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, features }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not generate a description.");
      set("shortDescription", data.shortDescription || values.shortDescription);
      set("description", data.fullDescription || values.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a description.");
    } finally {
      setGenerating(null);
    }
  }

  async function generateTags() {
    if (!values.name || !features) return;
    setGenerating("tags");
    setError(null);
    try {
      const response = await fetch("/api/ai/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, features }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not generate tags.");
      setTagsInput((data.tags ?? []).join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate tags.");
    } finally {
      setGenerating(null);
    }
  }

  function updateImage(i: number, patch: Partial<ImageInput>) {
    set("images", values.images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)));
  }
  function updateSpec(i: number, patch: Partial<Spec>) {
    set("specs", values.specs.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function updateVariant(i: number, patch: Partial<Variant>) {
    set("variants", values.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...values,
      brandId: values.brandId || null,
      originalPrice: values.originalPrice || null,
      images: values.images.filter((img) => img.url.trim()),
      tags: Array.from(new Set(tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))),
      specs: values.specs.filter((s) => s.key.trim() && s.value.trim()),
      variants: values.variants.filter((v) => v.sku.trim()),
    };

    try {
      const response = await fetch(values.id ? `/api/admin/products/${values.id}` : "/api/admin/products", {
        method: values.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save the product.");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <section className="space-y-4">
        <h2 className="font-semibold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={values.name} onChange={(e) => onNameChange(e.target.value)} required />
          </Field>
          <Field label="Slug (URL)">
            <Input value={values.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} required />
          </Field>
        </div>
        <Field label="Short description">
          <Input value={values.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={160} />
        </Field>
        <Field label="Full description">
          <Textarea value={values.description} onChange={(e) => set("description", e.target.value)} rows={5} required />
        </Field>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> AI description &amp; tag generator
        </h2>
        <p className="text-sm text-muted-foreground">List the product&apos;s real features below, then generate copy from them. Review before saving — nothing publishes automatically.</p>
        <Textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={3} placeholder={"40-hour battery\nBluetooth 5.3\nNoise cancellation"} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={generateDescription} disabled={!values.name || !features || generating !== null}>
            {generating === "description" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate description
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={generateTags} disabled={!values.name || !features || generating !== null}>
            {generating === "tags" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate tags
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Pricing &amp; inventory</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price ($)">
            <Input type="number" step="0.01" min={0} value={values.price} onChange={(e) => set("price", Number(e.target.value))} required />
          </Field>
          <Field label="Original price (optional, for a discount)">
            <Input type="number" step="0.01" min={0} value={values.originalPrice ?? ""} onChange={(e) => set("originalPrice", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Stock">
            <Input type="number" min={0} value={values.stock} onChange={(e) => set("stock", Number(e.target.value))} required />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Organization</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)} required>
              <option value="">Select a category</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Brand">
            <Select value={values.brandId ?? ""} onChange={(e) => set("brandId", e.target.value || null)}>
              <option value="">No brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Tags (comma-separated)">
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="wireless, noise cancelling, travel" />
        </Field>
        <div className="flex items-center gap-6">
          <Select value={values.status} onChange={(e) => set("status", e.target.value as "ACTIVE" | "INACTIVE")} className="w-40">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-primary" />
            Featured
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Images</h2>
        {values.images.map((img, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="https://…" value={img.url} onChange={(e) => updateImage(i, { url: e.target.value })} />
            <Input placeholder="Alt text" value={img.alt} onChange={(e) => updateImage(i, { alt: e.target.value })} className="max-w-[180px]" />
            <Button type="button" variant="outline" size="icon" onClick={() => set("images", values.images.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => set("images", [...values.images, { url: "", alt: "" }])}>
          <Plus className="h-4 w-4" /> Add image
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Specifications</h2>
        {values.specs.map((spec, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Key (e.g. RAM)" value={spec.key} onChange={(e) => updateSpec(i, { key: e.target.value })} />
            <Input placeholder="Value (e.g. 16GB)" value={spec.value} onChange={(e) => updateSpec(i, { value: e.target.value })} />
            <Button type="button" variant="outline" size="icon" onClick={() => set("specs", values.specs.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => set("specs", [...values.specs, { key: "", value: "" }])}>
          <Plus className="h-4 w-4" /> Add spec
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Variants (color / size)</h2>
        <p className="text-sm text-muted-foreground">Leave empty for products without color or size options.</p>
        {values.variants.map((variant, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_100px_1fr_auto] gap-2">
            <Input placeholder="Color" value={variant.color} onChange={(e) => updateVariant(i, { color: e.target.value })} />
            <Input placeholder="Size" value={variant.size} onChange={(e) => updateVariant(i, { size: e.target.value })} />
            <Input type="number" min={0} placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })} />
            <Input placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
            <Button type="button" variant="outline" size="icon" onClick={() => set("variants", values.variants.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => set("variants", [...values.variants, { color: "", size: "", stock: 0, sku: `${values.slug || "sku"}-${values.variants.length + 1}` }])}
        >
          <Plus className="h-4 w-4" /> Add variant
        </Button>
      </section>

      <div className="flex items-center gap-3 border-t pt-6">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {values.id ? "Save changes" : "Create product"}
        </Button>
        {values.id && <Badge variant="outline">Editing existing product</Badge>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
