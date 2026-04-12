import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const CouponRedemption = () => {
  const { session } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !session?.access_token) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-coupon", {
        body: { code: code.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setRedeemed(true);
      const isTeacher = data.coupon_type === "teacher";
      toast.success(
        isTeacher
          ? `Profesor AI activat pentru ${data.duration_days} zile! 🎓`
          : `Premium activat pentru ${data.duration_days} zile! 🎉`
      );
    } catch (err: any) {
      toast.error(err?.message || "Eroare la activare.");
    } finally {
      setLoading(false);
    }
  };

  if (redeemed) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm font-medium text-foreground">Premium activat cu succes!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <p className="text-sm font-bold text-foreground">Ai un cupon?</p>
        </div>
        <form onSubmit={handleRedeem} className="flex gap-2">
          <Input
            placeholder="Introdu codul..."
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 font-mono uppercase"
            maxLength={20}
          />
          <Button type="submit" size="sm" disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activează"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CouponRedemption;
