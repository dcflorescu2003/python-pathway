import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bell, Send } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin-only quick tool: trigger a test push to a specific user_id (or your own
 * account by default). Lands as both a system push and an in-app bell entry.
 */
const AdminPushTester = () => {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState("");
  const [title, setTitle] = useState("Test PyRo 🔔");
  const [body, setBody] = useState("Notificare de test din panoul admin.");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const recipient = (targetUserId.trim() || user?.id || "").trim();
    if (!recipient) {
      toast.error("Introdu un user_id sau autentifică-te.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast.error("Titlul și mesajul sunt obligatorii.");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push", {
        body: {
          student_ids: [recipient],
          title: title.trim(),
          body: body.trim(),
        },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      toast.success(
        sent > 0
          ? `Trimisă! ${sent} push livrat(e) + bell sincronizat.`
          : "Bell sincronizat (niciun device token activ pentru push)."
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Eroare la trimitere.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Test notificare push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            User ID destinatar (gol = contul tău: {user?.id?.slice(0, 8)}…)
          </Label>
          <Input
            placeholder="ex: 5fc1d69b-..."
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Titlu</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Mesaj</Label>
          <Input value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <Button onClick={handleSend} disabled={sending} className="w-full gap-2">
          <Send className="h-4 w-4" />
          {sending ? "Se trimite..." : "Trimite test"}
        </Button>
        <p className="text-[11px] text-muted-foreground/80">
          Apare ca push pe device + în clopoțelul aplicației (real-time).
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminPushTester;
