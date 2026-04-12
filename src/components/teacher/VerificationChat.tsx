import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload, CheckCircle, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  requestId: string;
  adminNotes?: string | null;
  isAdmin?: boolean;
  teacherUserId?: string;
}

const VerificationChat = ({ requestId, adminNotes, isAdmin = false, teacherUserId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["verification-messages", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_verification_messages")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const sendMessage = async () => {
    if (!user || (!message.trim() && !file)) return;
    setSending(true);
    try {
      let attachmentUrl: string | null = null;

      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("teacher-documents")
          .upload(path, file);
        if (upErr) throw upErr;
        attachmentUrl = path;
      }

      const { error } = await supabase
        .from("teacher_verification_messages")
        .insert({
          request_id: requestId,
          sender_id: user.id,
          message: message.trim(),
          attachment_url: attachmentUrl,
        });
      if (error) throw error;

      setMessage("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["verification-messages", requestId] });
      toast.success("Mesaj trimis!");
    } catch (err: any) {
      console.error(err);
      toast.error("Eroare la trimiterea mesajului.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Admin notes section */}
      {adminNotes && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            Observații administrator
          </p>
          <p className="text-xs text-muted-foreground">{adminNotes}</p>
        </div>
      )}

      {/* Messages */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Se încarcă...</p>
      ) : messages.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          {isAdmin ? "Niciun mesaj. Trimite un mesaj profesorului." : "Niciun mesaj încă. Poți trimite documente sau mesaje suplimentare."}
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {messages.map((msg: any) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`rounded-lg p-2.5 text-xs ${
                  isOwn
                    ? "bg-primary/10 ml-6"
                    : "bg-muted mr-6"
                }`}
              >
                <p className="font-semibold text-foreground mb-0.5">
                  {isOwn ? (isAdmin ? "Tu (Admin)" : "Tu") : (isAdmin ? "Profesor" : "Administrator")}
                </p>
                {msg.message && <p className="text-muted-foreground">{msg.message}</p>}
                {msg.attachment_url && (
                  <p className="text-primary flex items-center gap-1 mt-1">
                    <FileText className="h-3 w-3" />
                    Document atașat
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(msg.created_at).toLocaleString("ro-RO")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="space-y-2">
        <Textarea
          placeholder={isAdmin ? "Trimite un mesaj profesorului..." : "Scrie un mesaj sau adaugă detalii..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={1000}
          className="text-xs"
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            {file ? (
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="h-3.5 w-3.5" />
                {file.name}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Upload className="h-3.5 w-3.5" />
                Atașează document
              </span>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex-1" />
          <Button
            size="sm"
            className="gap-1"
            onClick={sendMessage}
            disabled={sending || (!message.trim() && !file)}
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Trimite
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerificationChat;
