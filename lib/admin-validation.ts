import { z } from "zod";

export const specSchema = z.object({ key: z.string().min(1).max(60), value: z.string().min(1).max(200) });
export const variantSchema = z.object({
  color: z.string().max(60).nullable().optional(),
  size: z.string().max(60).nullable().optional(),
  stock: z.number().int().min(0).max(100000),
  sku: z.string().min(1).max(120),
});

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  description: z.string().min(1).max(5000),
  shortDescription: z.string().max(300).default(""),
  price: z.number().min(0).max(1000000),
  originalPrice: z.number().min(0).max(1000000).nullable().optional(),
  stock: z.number().int().min(0).max(1000000),
  categoryId: z.string().min(1),
  brandId: z.string().min(1).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  featured: z.boolean().default(false),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().max(200).default("") })).max(10).default([]),
  tags: z.array(z.string().min(1).max(60)).max(20).default([]),
  specs: z.array(specSchema).max(30).default([]),
  variants: z.array(variantSchema).max(200).default([]),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  description: z.string().max(500).nullable().optional(),
  parentId: z.string().min(1).nullable().optional(),
});

export const brandSchema = z.object({
  name: z.string().min(1).max(100),
  logo: z.string().url().nullable().optional(),
});
