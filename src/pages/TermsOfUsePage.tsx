import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const TermsOfUsePage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background"
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[var(--sat)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Termeni de utilizare (EULA)</h1>
        </div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto prose prose-sm prose-invert pb-[calc(var(--sab)+24px)]">
        <p className="text-xs text-muted-foreground mb-6">Ultima actualizare: 3 mai 2026</p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">1. Acceptarea termenilor</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Prin descărcarea, instalarea sau utilizarea aplicației PyRo („Aplicația"), acceptați acești
          Termeni de utilizare („EULA"). Dacă nu sunteți de acord, vă rugăm să nu folosiți Aplicația.
          Acest contract se încheie între dumneavoastră și PyRo. Apple Inc. nu este parte la acest contract
          și nu este responsabilă pentru Aplicație sau conținutul acesteia.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">2. Licență de utilizare</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vă acordăm o licență neexclusivă, limitată, netransferabilă, revocabilă, pentru a utiliza
          Aplicația pe orice dispozitiv Apple pe care îl dețineți sau controlați, conform regulilor
          de utilizare stabilite în App Store Terms of Service.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">3. Abonamente cu reînnoire automată</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PyRo oferă următoarele abonamente cu reînnoire automată, achiziționate prin App Store:
        </p>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
          <li>
            <strong className="text-foreground">PyRo Elev Premium</strong> — durată: 1 lună, reînnoire
            automată lunară. Preț: 14,99 RON / lună (sau echivalentul afișat în App Store, care
            prevalează). Beneficii: inimi nelimitate, fără reclame, sumar personalizat,
            challenge-uri și probleme premium.
          </li>
          <li>
            <strong className="text-foreground">PyRo Profesor AI</strong> — durată: 1 lună, reînnoire
            automată lunară. Preț: 29 RON / lună (sau echivalentul afișat în App Store, care
            prevalează). Beneficii: până la 10 teste/lună cu max. 3 itemi evaluați AI/test, feedback
            AI automat, statistici și rapoarte avansate, inimi nelimitate.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Plata este încasată de contul dumneavoastră Apple ID la confirmarea cumpărării. Abonamentul
          se reînnoiește automat dacă reînnoirea automată nu este dezactivată cu cel puțin 24 de ore
          înainte de finalul perioadei curente. Costul reînnoirii este perceput în ultimele 24 de ore
          ale perioadei curente.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Puteți gestiona abonamentul și dezactiva reînnoirea automată din Setări iOS → numele
          dumneavoastră → Subscriptions, oricând după achiziție. Anularea va intra în vigoare la
          finalul perioadei plătite curente. Nu se acordă rambursări pentru perioade parțiale.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">4. Utilizare permisă</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vă angajați să nu folosiți Aplicația pentru activități ilegale, să nu o reproduceți,
          decompilați sau redistribuiți, și să nu interferați cu funcționarea ei. Conturile multiple
          create pentru a abuza de promoții sau cupoane pot fi suspendate.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">5. Conținut și proprietate intelectuală</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tot conținutul didactic (lecții, exerciții, probleme, materiale teoretice) este proprietatea
          PyRo sau a licențiatorilor săi. Aveți dreptul să îl utilizați doar pentru învățare personală.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">6. Garanții</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          În măsura permisă de lege, Aplicația este oferită „ca atare". Dacă Aplicația nu se conformează
          unei garanții aplicabile, ne puteți notifica și solicita rambursarea prețului. În măsura
          maximă permisă, Apple nu va avea nicio obligație de garanție.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">7. Limitarea răspunderii</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PyRo nu răspunde pentru daune indirecte, pierderi de date sau de profit. Răspunderea totală
          este limitată la suma plătită în ultimele 12 luni pentru abonament.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">8. Drepturi terți (Apple)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Apple și subsidiarele sale sunt beneficiari terți ai acestui EULA și au dreptul (și se
          consideră că au acceptat dreptul) de a-l aplica împotriva dumneavoastră.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">9. Confidențialitate</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Prelucrarea datelor este descrisă în{" "}
          <a href="/privacy-policy" className="text-primary underline">
            Politica de confidențialitate
          </a>
          .
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">10. Modificări</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Putem actualiza acești termeni periodic. Modificările vor fi publicate în această pagină;
          continuarea utilizării înseamnă acceptarea noii versiuni.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">11. Lege aplicabilă</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Acest EULA este guvernat de legislația din România, fără a aduce atingere normelor
          referitoare la conflictul de legi.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">12. Contact</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pentru întrebări legate de acești termeni: <strong className="text-foreground">support@pyroskill.info</strong>
        </p>

        <p className="text-xs text-muted-foreground mt-6">
          Alternativ, puteți consulta și{" "}
          <a
            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            Apple Standard EULA
          </a>
          .
        </p>
      </main>
    </motion.div>
  );
};

export default TermsOfUsePage;
