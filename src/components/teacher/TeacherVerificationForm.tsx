import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  KeyRound,
  Link2,
  FileImage,
  Users,
  ArrowLeft,
  Upload,
  CheckCircle,
  Loader2,
  Mail,
  School,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { schools } from "@/data/schools";

type Method = "invite_code" | "public_link" | "document" | "referral" | null;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

const methods = [
  {
    id: "invite_code" as const,
    icon: KeyRound,
    title: "Cod de invitație",
    desc: "Ai primit un cod de la școală sau administrator",
  },
  {
    id: "public_link" as const,
    icon: Link2,
    title: "Link public",
    desc: "Trimite un link unde apari ca profesor",
  },
  {
    id: "document" as const,
    icon: FileImage,
    title: "Document",
    desc: "Încarcă o legitimație sau adeverință",
  },
  {
    id: "referral" as const,
    icon: Users,
    title: "Cod de la un profesor",
    desc: "Un profesor verificat ți-a dat un cod",
  },
];

const TeacherVerificationForm = ({ onSuccess, onCancel }: Props) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Method>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [publicLink, setPublicLink] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  // Pre-populate school from profile if already set
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const sid = data?.school_id;
      if (sid) {
        const s = schools.find((x) => x.id === sid);
        if (s) setSelectedSchool(`${s.name}, ${s.city}`);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const filteredSchools = useMemo(() => {
    if (!schoolSearch.trim()) return [];
    const q = schoolSearch.toLowerCase();
    return schools.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)).slice(0, 50);
  }, [schoolSearch]);

  const submit = async () => {
    if (!user) return;

    // Validate contact email
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      toast.error("Introdu o adresă de email validă.");
      return;
    }

    // Validate school
    if (!selectedSchool.trim()) {
      toast.error("Selectează liceul la care predai.");
      return;
    }

    setLoading(true);

    try {
      let data: Record<string, string> = { contact_email: contactEmail.trim(), school_name: selectedSchool.trim() };

      if (selected === "invite_code") {
        if (!inviteCode.trim()) { toast.error("Introdu codul."); return; }
        data = { ...data, code: inviteCode.trim().toUpperCase() };
      } else if (selected === "referral") {
        if (!referralCode.trim()) { toast.error("Introdu codul."); return; }
        data = { ...data, code: referralCode.trim().toUpperCase() };
      } else if (selected === "public_link") {
        if (!publicLink.trim()) { toast.error("Introdu un link."); return; }
        data = { ...data, link: publicLink.trim(), note: linkNote.trim() };
      } else if (selected === "document") {
        if (!docFile) { toast.error("Selectează un document."); return; }
        const path = `${user.id}/${Date.now()}-${docFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("teacher-documents")
          .upload(path, docFile);
        if (upErr) throw upErr;
        data = { ...data, document_path: path, file_name: docFile.name };
      }

      const { data: result, error } = await supabase.rpc(
        "submit_teacher_verification",
        { p_method: selected!, p_data: data as any }
      );

      if (error) throw error;

      const res = result as any;
      if (res?.error) {
        toast.error(res.error);
        return;
      }

      if (res?.status === "approved") {
        toast.success("Cont de profesor verificat! 🎓");
      } else {
        toast.success("Cererea a fost trimisă! Vei fi notificat. 📨");
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Eroare la trimiterea cererii.");
    } finally {
      setLoading(false);
    }
  };

  if (!selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onCancel} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h3 className="text-base font-bold text-foreground">Verificare profesor</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Alege o metodă pentru a-ți verifica calitatea de profesor:
        </p>
        <div className="grid gap-3">
          {methods.map((m) => {
            const Icon = m.icon;
            return (
              <Card
                key={m.id}
                className="cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.98]"
                onClick={() => setSelected(m.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setSelected(null)} className="active:scale-90 transition-transform">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h3 className="text-base font-bold text-foreground">
          {methods.find((m) => m.id === selected)?.title}
        </h3>
      </div>

      {/* Contact email — always required */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-primary" />
          Email de contact *
        </label>
        <Input
          type="email"
          placeholder="adresa@email.com"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Adresa la care poți fi contactat dacă este nevoie de informații suplimentare.
        </p>
      </div>

      {/* School picker — always required */}
      <div className="space-y-2 relative">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <School className="h-3.5 w-3.5 text-primary" />
          Liceul la care predai *
        </label>
        {selectedSchool ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm text-foreground">
              {selectedSchool}
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setSelectedSchool(""); setSchoolSearch(""); }}
            >
              Schimbă
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Caută liceul..."
                value={schoolSearch}
                onChange={(e) => { setSchoolSearch(e.target.value); setShowSchoolDropdown(true); }}
                onFocus={() => setShowSchoolDropdown(true)}
                className="pl-9"
              />
            </div>
            {showSchoolDropdown && filteredSchools.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredSchools.map((s) => (
                  <button
                    key={s.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      setSelectedSchool(`${s.name}, ${s.city}`);
                      setSchoolSearch("");
                      setShowSchoolDropdown(false);
                    }}
                  >
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-1">— {s.city}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selected === "invite_code" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Introdu codul de invitație primit de la școală sau administrator.
          </p>
          <Input
            placeholder="Ex: CANTEMIR2026"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={30}
          />
        </div>
      )}

      {selected === "referral" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Introdu codul primit de la un profesor verificat.
          </p>
          <Input
            placeholder="Ex: REF-a1b2c3d4"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            maxLength={30}
          />
        </div>
      )}

      {selected === "public_link" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Trimite un link unde apare numele tău ca profesor (site școală, pagină catedră, etc).
          </p>
          <Input
            placeholder="https://scoala.ro/catedra-info"
            value={publicLink}
            onChange={(e) => setPublicLink(e.target.value)}
            type="url"
          />
          <Textarea
            placeholder="Informații adiționale (opțional)"
            value={linkNote}
            onChange={(e) => setLinkNote(e.target.value)}
            rows={2}
            maxLength={500}
          />
        </div>
      )}

      {selected === "document" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Încarcă o poză cu legitimația sau adeverința. Poți ascunde CNP, seria și alte date sensibile — ne interesează doar numele, școala și calitatea de profesor.
          </p>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
            {docFile ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{docFile.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Upload className="h-5 w-5" />
                <span className="text-sm">Alege fișierul</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      )}

      <Button
        className="w-full gap-2"
        onClick={submit}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        {loading ? "Se trimite..." : "Trimite cererea"}
      </Button>
    </div>
  );
};

export default TeacherVerificationForm;
