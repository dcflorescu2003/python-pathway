import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const WebAdsManager = () => {
  const [enabled, setEnabled] = useState(false);
  const [publisherId, setPublisherId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("web_ads_config").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setEnabled(data.enabled);
        setPublisherId(data.publisher_id);
        setSiteId(data.site_id);
      }
    });
  }, []);

  const save = async () => {
    if (enabled && (!publisherId.trim() || !siteId.trim())) {
      toast.error("Completează Publisher ID și Site ID înainte de activare");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("web_ads_config")
      .update({ enabled, publisher_id: publisherId.trim(), site_id: siteId.trim(), updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (error) toast.error("Eroare la salvare");
    else toast.success("Salvat. Se aplică la următoarea încărcare a paginii.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reclame web (AdinPlay)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Când e activ: pe web apare butonul de reclamă pentru inimi și revine așteptarea de 30 de minute.
          Când e oprit: inimile pe web se refac imediat.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="web-ads-enabled">Activ</Label>
          <Switch id="web-ads-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="web-ads-pub">Publisher ID</Label>
          <Input id="web-ads-pub" value={publisherId} onChange={(e) => setPublisherId(e.target.value)} placeholder="ex. 1234" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="web-ads-site">Site ID</Label>
          <Input id="web-ads-site" value={siteId} onChange={(e) => setSiteId(e.target.value)} placeholder="pyroskill.info" />
        </div>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? "Se salvează..." : "Salvează"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WebAdsManager;
