import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface TeacherProfile {
  user_id: string;
  display_name: string | null;
  teacher_status: string | null;
  created_at: string;
}

const TeacherApproval = () => {
  const qc = useQueryClient();

  const { data: pendingTeachers = [], isLoading: loadingPending } = useQuery({
    queryKey: ["admin-teachers-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, teacher_status, created_at")
        .eq("teacher_status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeacherProfile[];
    },
  });

  const { data: verifiedTeachers = [], isLoading: loadingVerified } = useQuery({
    queryKey: ["admin-teachers-verified"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, teacher_status, created_at")
        .eq("teacher_status", "verified")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeacherProfile[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string | null }) => {
      // Admin updates via RPC or direct (admin bypasses trigger)
      const { error } = await supabase
        .from("profiles")
        .update({ teacher_status: status, is_teacher: status === "verified" })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-teachers-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-teachers-verified"] });
    },
  });

  const handleApprove = async (userId: string) => {
    await updateStatus.mutateAsync({ userId, status: "verified" });
    toast.success("Profesor aprobat! ✅");
  };

  const handleReject = async (userId: string) => {
    await updateStatus.mutateAsync({ userId, status: null });
    toast.success("Cerere respinsă.");
  };

  const handleRevoke = async (userId: string) => {
    await updateStatus.mutateAsync({ userId, status: null });
    toast.success("Acces profesor revocat.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          Cereri în așteptare ({pendingTeachers.length})
        </h3>
        {loadingPending ? (
          <p className="text-sm text-muted-foreground">Se încarcă...</p>
        ) : pendingTeachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nicio cerere în așteptare.</p>
        ) : (
          <div className="space-y-2">
            {pendingTeachers.map((t) => (
              <Card key={t.user_id} className="border-warning/30">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.display_name || "Fără nume"}</p>
                    <p className="text-xs text-muted-foreground">
                      Cerere: {new Date(t.created_at).toLocaleDateString("ro-RO")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1"
                      onClick={() => handleApprove(t.user_id)}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Aprobă
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      onClick={() => handleReject(t.user_id)}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Respinge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          Profesori verificați ({verifiedTeachers.length})
        </h3>
        {loadingVerified ? (
          <p className="text-sm text-muted-foreground">Se încarcă...</p>
        ) : verifiedTeachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Niciun profesor verificat.</p>
        ) : (
          <div className="space-y-2">
            {verifiedTeachers.map((t) => (
              <Card key={t.user_id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.display_name || "Fără nume"}</p>
                    <Badge variant="secondary" className="text-xs">Verificat</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive gap-1"
                    onClick={() => handleRevoke(t.user_id)}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Revocă
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherApproval;
