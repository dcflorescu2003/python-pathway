import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  duration_days: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const CouponManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDays, setNewDays] = useState("30");
  const [newMaxUses, setNewMaxUses] = useState("1");
  const [newExpiry, setNewExpiry] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "PYRO-";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleCreate = async () => {
    const code = newCode.trim().toUpperCase() || generateCode();
    const { error } = await supabase.from("coupons").insert({
      code,
      duration_days: parseInt(newDays) || 30,
      max_uses: parseInt(newMaxUses) || 1,
      expires_at: newExpiry ? new Date(newExpiry).toISOString() : null,
    } as any);

    if (error) {
      toast.error(error.message.includes("unique") ? "Codul există deja." : error.message);
      return;
    }

    toast.success(`Cupon ${code} creat!`);
    setShowCreate(false);
    setNewCode("");
    setNewDays("30");
    setNewMaxUses("1");
    setNewExpiry("");
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons((c) => c.filter((x) => x.id !== id));
    toast.success("Cupon șters.");
  };

  const handleToggle = async (coupon: Coupon) => {
    await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active } as any)
      .eq("id", coupon.id);
    fetchCoupons();
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <p className="text-sm text-muted-foreground p-4">Se încarcă cupoanele...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">🎟️ Cupoane Premium</h2>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-1" /> Nou
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Cod (lăsați gol pt auto-generare)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Durata (zile)</label>
                <Input type="number" value={newDays} onChange={(e) => setNewDays(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Nr. max utilizări</label>
                <Input type="number" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Expiră la (opțional)</label>
              <Input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} className="flex-1">Creează</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Anulează</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {coupons.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Niciun cupon creat încă.</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className={`border-border ${!coupon.is_active ? "opacity-50" : ""}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-foreground">{coupon.code}</span>
                    <button onClick={() => copyCode(coupon.code, coupon.id)}>
                      {copiedId === coupon.id ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {coupon.duration_days}z · {coupon.used_count}/{coupon.max_uses} utilizări
                    {coupon.expires_at && ` · exp: ${new Date(coupon.expires_at).toLocaleDateString("ro-RO")}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(coupon)}
                  className="text-xs"
                >
                  {coupon.is_active ? "Dezact." : "Activ."}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(coupon.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponManager;
