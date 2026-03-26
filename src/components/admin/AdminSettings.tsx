import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Mail } from "lucide-react";
import { toast } from "sonner";

interface Props {
  currentUserEmail: string;
}

const AdminSettings = ({ currentUserEmail }: Props) => {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: adminEmails = [], isLoading } = useQuery({
    queryKey: ["admin-emails-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_emails")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Introdu un email valid.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("admin_emails").insert({ email });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("Email-ul există deja.");
      else toast.error(error.message);
      return;
    }
    setNewEmail("");
    queryClient.invalidateQueries({ queryKey: ["admin-emails-list"] });
    queryClient.invalidateQueries({ queryKey: ["admin-access"] });
    toast.success("Email admin adăugat!");
  };

  const handleDelete = async (id: string, email: string) => {
    if (email === currentUserEmail) {
      toast.error("Nu te poți elimina pe tine!");
      return;
    }
    const { error } = await supabase.from("admin_emails").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-emails-list"] });
    queryClient.invalidateQueries({ queryKey: ["admin-access"] });
    toast.success("Email eliminat.");
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email-uri admin autorizate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="email@exemplu.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={loading} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Adaugă
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Se încarcă...</p>
        ) : (
          <div className="space-y-2">
            {adminEmails.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span className="text-sm text-foreground">{item.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(item.id, item.email)}
                  disabled={item.email === currentUserEmail}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
