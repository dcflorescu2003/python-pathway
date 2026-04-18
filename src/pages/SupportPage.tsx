import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, ChevronDown, ChevronUp, LifeBuoy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "florescu.cosmin.tr@gmail.com";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Cum îmi creez un cont PyRo?",
    a: "Apasă pe „Cont” din bara de jos sau accesează ecranul de autentificare. Te poți înregistra cu email și parolă, cu Google sau cu Apple ID.",
  },
  {
    q: "Mi-am uitat parola. Ce fac?",
    a: "Pe ecranul de autentificare apasă „Am uitat parola”, introdu adresa de email și vei primi un link de resetare. Linkul este valabil 1 oră.",
  },
  {
    q: "Cum funcționează sistemul de vieți?",
    a: "Ai 5 vieți. Pierzi o viață la fiecare răspuns greșit într-o lecție nouă. Viețile se regenerează automat (1 viață la fiecare 30 de minute). Utilizatorii Premium au vieți nelimitate.",
  },
  {
    q: "Ce primesc cu abonamentul Premium?",
    a: "Acces nelimitat la toate lecțiile și problemele Premium, vieți nelimitate, sumar personalizat al progresului și suport prioritar. Plata se face securizat prin Stripe.",
  },
  {
    q: "Cum activez un cod cupon?",
    a: "Mergi la „Cont” → secțiunea „Cod promoțional” → introdu codul (ex. PYRO-XXXX sau PROF-XXXX) și apasă „Activează”.",
  },
  {
    q: "Cum mă alătur unei clase de profesor?",
    a: "Mergi la „Cont” → tabul „Elev” → introdu codul de 6 caractere primit de la profesor și apasă „Alătură-mă”. Te poți înscrie într-o singură clasă activă.",
  },
  {
    q: "Cum devin profesor verificat?",
    a: "Mergi la „Cont” → activează modul Profesor → alege o metodă de verificare (cod de invitație, link public, document justificativ sau referral). După verificare ai acces la crearea testelor și gestionarea claselor.",
  },
  {
    q: "Cum îmi anulez abonamentul?",
    a: "Mergi la „Cont” → „Gestionează abonamentul”. Vei fi redirecționat către portalul Stripe unde poți anula sau modifica abonamentul oricând.",
  },
  {
    q: "Cum îmi șterg contul?",
    a: "Mergi la „Cont” → „Șterge contul” sau accesează direct /delete-account. Ștergerea este definitivă și include toate datele de progres.",
  },
  {
    q: "Aplicația nu funcționează corect. Ce fac?",
    a: `Încearcă să închizi și să redeschizi aplicația. Dacă problema persistă, scrie-ne la ${SUPPORT_EMAIL} cu o descriere a problemei și, dacă e posibil, un screenshot.`,
  },
];

const SupportPage = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Suport PyRo")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background pb-12"
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="active:scale-90 transition-transform" aria-label="Înapoi">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <LifeBuoy className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Suport</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-8">
        {/* Intro */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-2">Cum te putem ajuta?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Găsește răspunsuri rapide în secțiunea de întrebări frecvente sau contactează-ne direct pe email.
            Răspundem de obicei în 24-48 de ore lucrătoare.
          </p>
        </section>

        {/* Contact card */}
        <section>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">Contact prin email</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pentru orice problemă, întrebare sau feedback, scrie-ne la:
                  </p>
                  <a
                    href={mailHref}
                    className="mt-2 inline-block break-all text-sm font-mono text-primary hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
              <Button asChild className="w-full" size="lg">
                <a href={mailHref}>
                  <Mail className="h-4 w-4 mr-2" />
                  Trimite un email
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Întrebări frecvente</h2>
          <div className="space-y-2">
            {FAQS.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <Card key={idx} className="border-border">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3 active:scale-[0.99] transition-transform"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-foreground flex-1">{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <CardContent className="px-4 pb-4 pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Legal links */}
        <section className="pt-4 border-t border-border">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <button onClick={() => navigate("/privacy-policy")} className="hover:text-foreground underline">
              Politica de confidențialitate
            </button>
            <button onClick={() => navigate("/delete-account")} className="hover:text-foreground underline">
              Șterge contul
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">© {new Date().getFullYear()} PyRo</p>
        </section>
      </main>
    </motion.div>
  );
};

export default SupportPage;
