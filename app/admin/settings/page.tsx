"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminSettingsPage() {
  const [channel, setChannel] = useState("Contact form");
  const [value, setValue] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setChannel(d.channel);
        setValue(d.value);
        setInstructions(d.instructions);
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactChannel: channel, contactValue: value, contactInstructions: instructions }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="container max-w-xl py-8">
      <AdminNav active="/admin/settings" />
      <h1 className="mb-6 text-2xl font-semibold">Store settings</h1>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Contact channel</label>
            <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="Telegram">Telegram</option>
              <option value="Phone">Phone</option>
              <option value="Messenger">Messenger</option>
              <option value="Contact form">Contact form</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {channel === "Telegram" ? "Telegram username" : channel === "Phone" ? "Phone number" : channel === "Messenger" ? "Messenger username" : "Contact link"}
            </label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={channel === "Telegram" ? "@yourstore" : channel === "Phone" ? "+1 555 0100" : ""} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Instructions shown to customers</label>
            <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save settings
          </Button>
          {saved && <p className="text-sm text-emerald-600">Saved.</p>}
        </form>
      )}
    </div>
  );
}
