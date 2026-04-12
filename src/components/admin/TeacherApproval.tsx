import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle, XCircle, Clock, UserCheck, Plus, Copy,
  Link2, FileImage, KeyRound, Users, ExternalLink, Trash2,
  Mail, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import VerificationChat from "@/components/teacher/VerificationChat";

// ─── Requests Tab ───
const RequestsTab = () => {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-verification-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_verification_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = data.map((r: any) => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      return data.map((r: any) => ({
        ...r,
        display_name: profiles?.find((p: any) => p.user_id === r.user_id)?.display_name || "Fără nume",
      }));
    },
  });

  const approve = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const { error } = await supabase.rpc("approve_teacher_request", {
        p_request_id: id,
        p_notes: adminNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      // Send notification
      const req = requests.find((r: any) => r.id === id);
      if (req) {
        supabase.from("notifications").insert({
          user_id: req.user_id,
          title: "Cont de profesor aprobat! 🎓",
          body: "Felicitări! Contul tău de profesor a fost verificat.",
        });
      }
      qc.invalidateQueries({ queryKey: ["admin-verification-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-teachers-verified"] });
      toast.success("Profesor aprobat! ✅");
    },
  });

  const reject = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const { error } = await supabase.rpc("reject_teacher_request", {
        p_request_id: id,
        p_notes: adminNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-verification-requests"] });
      toast.success("Cerere respinsă.");
    },
  });

  const methodIcon: Record<string, any> = {
    invite_code: KeyRound,
    public_link: Link2,
    document: FileImage,
    referral: Users,
  };
  const methodLabel: Record<string, string> = {
    invite_code: "Cod invitație",
    public_link: "Link public",
    document: "Document",
    referral: "Referral",
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Se încarcă...</p>;
  if (requests.length === 0)
    return <p className="text-sm text-muted-foreground">Nicio cerere în așteptare.</p>;

  return (
    <div className="space-y-3">
      {requests.map((r: any) => {
        const Icon = methodIcon[r.method] || Clock;
        return (
          <Card key={r.id} className="border-warning/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{r.display_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {methodLabel[r.method]}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("ro-RO")}
                </span>
              </div>

              {/* Show data based on method */}
              {r.method === "public_link" && r.data?.link && (
                <a
                  href={r.data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {r.data.link}
                </a>
              )}
              {r.method === "public_link" && r.data?.note && (
                <p className="text-xs text-muted-foreground">{r.data.note}</p>
              )}
              {r.method === "document" && r.data?.file_name && (
                <p className="text-xs text-muted-foreground">
                  📎 {r.data.file_name}
                </p>
              )}
              {r.method === "invite_code" && r.data?.code && (
                <p className="text-xs text-muted-foreground">Cod folosit: {r.data.code}</p>
              )}

              <Textarea
                placeholder="Note admin (opțional)"
                value={notes[r.id] || ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                rows={1}
                className="text-xs"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1 flex-1"
                  onClick={() => approve.mutate({ id: r.id, adminNotes: notes[r.id] })}
                  disabled={approve.isPending || reject.isPending}
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Aprobă
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1 flex-1"
                  onClick={() => reject.mutate({ id: r.id, adminNotes: notes[r.id] })}
                  disabled={approve.isPending || reject.isPending}
                >
                  <XCircle className="h-3.5 w-3.5" /> Respinge
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ─── Invite Codes Tab ───
const InviteCodesTab = () => {
  const qc = useQueryClient();
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("10");

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["admin-invite-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_invite_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCode = useMutation({
    mutationFn: async () => {
      if (!newCode.trim()) throw new Error("Codul e obligatoriu");
      const { error } = await supabase.from("teacher_invite_codes").insert({
        code: newCode.trim().toUpperCase(),
        label: newLabel.trim() || null,
        max_uses: parseInt(newMaxUses) || 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invite-codes"] });
      setNewCode("");
      setNewLabel("");
      setNewMaxUses("10");
      toast.success("Cod creat!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("teacher_invite_codes")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-invite-codes"] }),
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teacher_invite_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invite-codes"] });
      toast.success("Cod șters.");
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Cod nou</p>
          <Input
            placeholder="Cod (ex: CANTEMIR2026)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
          />
          <Input
            placeholder="Etichetă (opțional)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Utilizări max"
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(e.target.value)}
              className="w-28"
            />
            <Button size="sm" className="gap-1" onClick={() => createCode.mutate()} disabled={createCode.isPending}>
              <Plus className="h-3.5 w-3.5" /> Creează
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Se încarcă...</p>
      ) : codes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Niciun cod.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((c: any) => (
            <Card key={c.id} className={!c.is_active ? "opacity-50" : ""}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-foreground">{c.code}</span>
                    {c.label && <span className="text-xs text-muted-foreground">({c.label})</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.used_count}/{c.max_uses} utilizări • {c.is_active ? "Activ" : "Inactiv"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(c.code);
                      toast.success("Copiat!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive.mutate({ id: c.id, active: !c.is_active })}
                  >
                    {c.is_active ? "Dezactivează" : "Activează"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteCode.mutate(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Verified Teachers Tab ───
const VerifiedTeachersTab = () => {
  const qc = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["admin-teachers-verified"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, teacher_status, verification_method, created_at")
        .eq("teacher_status", "verified")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: referralCodes = [] } = useQuery({
    queryKey: ["admin-all-referral-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_referral_codes")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const revoke = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("revoke_teacher_status", {
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-teachers-verified"] });
      toast.success("Acces profesor revocat.");
    },
  });

  const methodLabel: Record<string, string> = {
    invite_code: "Cod invitație",
    public_link: "Link public",
    document: "Document",
    referral: "Referral",
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Se încarcă...</p>;
  if (teachers.length === 0)
    return <p className="text-sm text-muted-foreground">Niciun profesor verificat.</p>;

  return (
    <div className="space-y-2">
      {teachers.map((t: any) => {
        const codes = referralCodes.filter((c: any) => c.teacher_id === t.user_id);
        return (
          <Card key={t.user_id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.display_name || "Fără nume"}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Verificat</Badge>
                    {t.verification_method && (
                      <span className="text-xs text-muted-foreground">
                        prin {methodLabel[t.verification_method] || t.verification_method}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive gap-1"
                  onClick={() => revoke.mutate(t.user_id)}
                  disabled={revoke.isPending}
                >
                  <XCircle className="h-3.5 w-3.5" /> Revocă
                </Button>
              </div>
              {codes.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Coduri referral:{" "}
                  {codes.map((c: any) => (
                    <span key={c.id} className={`font-mono mr-2 ${c.used_by ? "line-through" : "text-foreground"}`}>
                      {c.code}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ─── Main Component ───
const TeacherApproval = () => {
  return (
    <Tabs defaultValue="requests" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="requests" className="flex-1 gap-1">
          <Clock className="h-3.5 w-3.5" /> Cereri
        </TabsTrigger>
        <TabsTrigger value="codes" className="flex-1 gap-1">
          <KeyRound className="h-3.5 w-3.5" /> Coduri
        </TabsTrigger>
        <TabsTrigger value="verified" className="flex-1 gap-1">
          <UserCheck className="h-3.5 w-3.5" /> Verificați
        </TabsTrigger>
      </TabsList>
      <TabsContent value="requests" className="mt-4">
        <RequestsTab />
      </TabsContent>
      <TabsContent value="codes" className="mt-4">
        <InviteCodesTab />
      </TabsContent>
      <TabsContent value="verified" className="mt-4">
        <VerifiedTeachersTab />
      </TabsContent>
    </Tabs>
  );
};

export default TeacherApproval;
