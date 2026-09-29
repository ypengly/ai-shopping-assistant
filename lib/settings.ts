import { db } from "@/lib/db";

const DEFAULTS: Record<string, string> = {
  contactChannel: "Contact form",
  contactValue: "",
  contactInstructions: "Message us and we'll get back to you about this product.",
};

export async function getSetting(key: keyof typeof DEFAULTS) {
  const row = await db.setting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key];
}

export async function getContactSettings() {
  const rows = await db.setting.findMany({ where: { key: { in: Object.keys(DEFAULTS) } } });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return {
    channel: byKey.get("contactChannel") ?? DEFAULTS.contactChannel,
    value: byKey.get("contactValue") ?? DEFAULTS.contactValue,
    instructions: byKey.get("contactInstructions") ?? DEFAULTS.contactInstructions,
  };
}

export async function setSettings(values: Partial<Record<keyof typeof DEFAULTS, string>>) {
  await db.$transaction(
    Object.entries(values).map(([key, value]) =>
      db.setting.upsert({ where: { key }, update: { value: value ?? "" }, create: { key, value: value ?? "" } }),
    ),
  );
}
