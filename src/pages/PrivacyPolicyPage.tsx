import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background"
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="active:scale-90 transition-transform">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Politica de confidențialitate</h1>
        </div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto prose prose-sm prose-invert">
        <p className="text-xs text-muted-foreground mb-6">Ultima actualizare: 23 martie 2026</p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">1. Introducere</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PyRo („noi", „aplicația") respectă confidențialitatea datelor dumneavoastră. Această politică explică ce date colectăm, cum le folosim și drepturile pe care le aveți în conformitate cu Regulamentul General privind Protecția Datelor (GDPR).
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">2. Date colectate</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Colectăm următoarele categorii de date:</p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li><strong className="text-foreground">Date de cont:</strong> adresa de email, numele de afișare, metoda de autentificare (email/Google/Apple)</li>
          <li><strong className="text-foreground">Date de progres:</strong> lecții completate, scor, XP acumulat, serie zilnică</li>
          <li><strong className="text-foreground">Date de profil:</strong> liceul selectat (opțional), statusul premium</li>
          <li><strong className="text-foreground">Date tehnice:</strong> tip dispozitiv, sistem de operare (pentru compatibilitate)</li>
        </ul>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">3. Scopul prelucrării</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Folosim datele pentru:</p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li>Furnizarea serviciului educațional și sincronizarea progresului</li>
          <li>Clasamente între utilizatori (leaderboard)</li>
          <li>Gestionarea abonamentelor și cupoanelor premium</li>
          <li>Îmbunătățirea conținutului și experienței aplicației</li>
        </ul>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">4. Temeiul juridic</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Prelucrăm datele pe baza consimțământului dumneavoastră (la crearea contului) și pe baza interesului nostru legitim de a furniza și îmbunătăți serviciul.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">5. Partajarea datelor</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nu vindem datele dumneavoastră. Le partajăm doar cu furnizorii de servicii necesari funcționării aplicației (infrastructură cloud, procesare plăți). Clasamentele afișează doar numele de afișare și scorul.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">6. Stocarea datelor</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Datele sunt stocate pe servere securizate în Uniunea Europeană. Păstrăm datele cât timp contul este activ. După ștergerea contului, datele sunt eliminate în termen de 30 de zile.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">7. Drepturile dumneavoastră</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Conform GDPR, aveți dreptul la:</p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li><strong className="text-foreground">Acces:</strong> puteți solicita o copie a datelor dumneavoastră</li>
          <li><strong className="text-foreground">Rectificare:</strong> puteți corecta datele inexacte</li>
          <li><strong className="text-foreground">Ștergere:</strong> puteți solicita ștergerea contului și a tuturor datelor asociate din secțiunea Contul meu</li>
          <li><strong className="text-foreground">Portabilitate:</strong> puteți solicita exportul datelor</li>
          <li><strong className="text-foreground">Opoziție:</strong> vă puteți opune prelucrării datelor</li>
        </ul>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">8. Cookie-uri</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Folosim doar cookie-uri esențiale pentru autentificare și funcționarea aplicației. Nu folosim cookie-uri de tracking sau publicitate.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">9. Minori</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Aplicația este destinată elevilor de liceu (14+ ani). Pentru utilizatori sub 16 ani, recomandăm consimțământul unui părinte sau tutore legal.
        </p>

        <h2 className="text-base font-bold text-foreground mt-6 mb-2">10. Contact</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pentru orice întrebări legate de datele dumneavoastră, ne puteți contacta la adresa de email: <span className="text-primary">contact@pyro-learn.app</span>
        </p>

        <div className="h-12" />
      </main>
    </motion.div>
  );
};

export default PrivacyPolicyPage;
