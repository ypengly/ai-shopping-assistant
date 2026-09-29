import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type SeedProduct = {
  name: string;
  top: string;
  category: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  description: string;
  specs: Record<string, string>;
  tags: string[];
  variants: { color: string; size: string; stock: number }[];
  featured: boolean;
};

type SeedData = {
  categories: Record<string, string[]>;
  products: SeedProduct[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123";

  if (process.env.NODE_ENV === "production" && password === "ChangeMe123") {
    throw new Error("Set a strong ADMIN_PASSWORD before seeding in production.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`Admin account already exists: ${email}`);
  } else {
    await prisma.user.create({
      data: { name: "Store Admin", email, password: await bcrypt.hash(password, 12), role: "ADMIN" },
    });
    console.log(`Created admin account: ${email}`);
  }
}

async function seedCatalog() {
  const dataPath = path.join(__dirname, "seed-data.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8")) as SeedData;

  const productCount = await prisma.product.count();
  if (productCount > 0) {
    console.log(`Catalog already has ${productCount} products — skipping catalog seed.`);
    return;
  }

  const categoryIdByName = new Map<string, string>();
  for (const topName of Object.keys(data.categories)) {
    const top = await prisma.category.upsert({
      where: { slug: slugify(topName) },
      update: {},
      create: { name: topName, slug: slugify(topName) },
    });
    categoryIdByName.set(topName, top.id);

    for (const childName of data.categories[topName]) {
      const child = await prisma.category.upsert({
        where: { slug: slugify(childName) },
        update: { parentId: top.id },
        create: { name: childName, slug: slugify(childName), parentId: top.id },
      });
      categoryIdByName.set(childName, child.id);
    }
  }
  console.log(`Seeded ${categoryIdByName.size} categories.`);

  const brandNames = Array.from(new Set(data.products.map((p) => p.brand)));
  const brandIdByName = new Map<string, string>();
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
    brandIdByName.set(name, brand.id);
  }
  console.log(`Seeded ${brandIdByName.size} brands.`);

  let created = 0;
  for (const p of data.products) {
    const categoryId = categoryIdByName.get(p.category);
    const brandId = brandIdByName.get(p.brand);
    if (!categoryId) throw new Error(`Unknown category "${p.category}" for product "${p.name}"`);

    const slug = slugify(p.name);

    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        featured: p.featured,
        status: "ACTIVE",
        categoryId,
        brandId,
        images: {
          create: [
            { url: `https://picsum.photos/seed/${slug}-1/640/640`, alt: p.name, order: 0 },
            { url: `https://picsum.photos/seed/${slug}-2/640/640`, alt: `${p.name} alternate view`, order: 1 },
          ],
        },
        specs: { create: Object.entries(p.specs).map(([key, value]) => ({ key, value })) },
        tags: { create: p.tags.map((tag) => ({ tag })) },
        variants: {
          create: p.variants.map((v, i) => ({
            color: v.color,
            size: v.size,
            stock: v.stock,
            sku: `${slug}-${slugify(v.color)}-${v.size}-${i}`.toUpperCase(),
          })),
        },
      },
    });
    created += 1;
  }
  console.log(`Seeded ${created} products.`);
}

async function main() {
  await seedAdmin();
  await seedCatalog();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
