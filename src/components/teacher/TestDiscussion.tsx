import { useEffect, useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSendTestMessage, useTestMessages } from "@/hooks/useTestSharing";
import { toast } from "sonner";

const seenKey = (uid: string, testId: string) => `pyro-test-chat-seen:${uid}:${testId}`;

const TestDiscussion = ({ testId }: { testId: string }) => {
  const { user } = useAuth();
  const { data: messages = [] } = useTestMessages(testId);
  const send = useSendTestMessage();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [seenAt, setSeenAt] = useState<string>(() =>
    user ? localStorage.getItem(seenKey(user.id, testId)) ?? "" : "",
  );

  const unread = useMemo(
    () => messages.filter((m) => m.sender_id !== user?.id && m.created_at > seenAt).length,
    [messages, seenAt, user?.id],
  );

  useEffect(() => {
    if (open && user && messages.length) {
      const last = messages[messages.length - 1].created_at;
      localStorage.setItem(seenKey(user.id, testId), last);
      setSeenAt(last);
    }
  }, [open, messages, user, testId]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body) return;
    try {
      await send.mutateAsync({ testId, body: body.slice(0, 2000) });
      setText("");
    } catch {
      toast.error("Mesajul nu a putut fi trimis.");
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border bg-muted/30">
      <CollapsibleTrigger className="w-full flex items-center justify-between p-2 text-xs font-medium min-h-[44px]">
        <span className="flex items-center gap-1.5 text-foreground">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          Discuție ({messages.length})
          {unread > 0 && (
            <span className="rounded-full bg-primary text-primary-foreground px-1.5 text-[10px]">{unread} noi</span>
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pb-2 space-y-2">
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {messages.length === 0 && (
            <p className="text-[11px] text-muted-foreground">Niciun mesaj încă. Începe discuția despre test.</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`rounded-md p-2 text-xs ${mine ? "bg-primary/10 ml-6" : "bg-card mr-6"}`}>
                <p className="text-[10px] text-muted-foreground">
                  {mine ? "Tu" : m.sender_name} · {new Date(m.created_at).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })}
                </p>
                <p className="text-foreground whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 items-end">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Scrie un mesaj colegilor..."
            className="text-xs min-h-[44px]"
          />
          <Button size="icon" onClick={handleSend} disabled={!text.trim() || send.isPending} aria-label="Trimite">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TestDiscussion;
