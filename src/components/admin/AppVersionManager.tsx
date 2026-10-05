import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { APP_VERSION } from "@/lib/appVersion";

type Row = {
  platform: string;
  latest_version: string;
  min_supported_version: string;
  store_url: string;
  release_notes: string | null;
  is_active: boolean;
};

const AppVersionManager = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("app_version_config").select("*").order("platform").then(({ data }) => {
      if (data) setRows(data as Row[]);
    });
  }, []);

  const update = (p: string, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.platform === p ? { ...x, ...patch } : x)));

  const save = async (row: Row) => {
    setSaving(row.platform);
    const { error } = await supabase
      .from("app_version_config")
      .update({
        latest_version: row.latest_version.trim(),
        min_supported_version: row.min_supported_version.trim(),
        store_url: row.store_url.trim(),
        release_notes: row.release_notes?.trim() || null,
        is_active: row.is_active,
      })
      .eq("platform", row.platform);
    setSaving(null);
    if (error) toast.error("Eroare la salvare");
    else toast.success(`Salvat pentru ${row.platform}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Atenționare actualizare aplicație</CardTitle>
        <p className="text-xs text-muted-foreground">
          Versiunea din acest cod: {APP_VERSION}. Setează „Ultima versiune” doar după ce build-ul e aprobat în magazin.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {rows.map((row) => (
          <div key={row.platform} className="space-y-3 border-b border-border pb-4 last:border-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{row.platform === "ios" ? "iOS (App Store)" : "Android (Google Play)"}</span>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Activ</Label>
                <Switch checked={row.is_active} onCheckedChange={(v) => update(row.platform, { is_active: v })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Ultima versiune</Label>
                <Input value={row.latest_version} onChange={(e) => update(row.platform, { latest_version: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Versiune minimă (forțat)</Label>
                <Input value={row.min_supported_version} onChange={(e) => update(row.platform, { min_supported_version: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Link magazin</Label>
              <Input value={row.store_url} onChange={(e) => update(row.platform, { store_url: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Noutăți (opțional)</Label>
              <Textarea rows={3} value={row.release_notes ?? ""} onChange={(e) => update(row.platform, { release_notes: e.target.value })} />
            </div>
            <Button className="w-full" disabled={saving === row.platform} onClick={() => save(row)}>
              {saving === row.platform ? "Se salvează..." : "Salvează"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AppVersionManager;
