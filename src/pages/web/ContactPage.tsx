import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Mail, LifeBuoy, ShieldCheck } from "lucide-react";
import WebLayout from "@/components/web/WebLayout";
import { useSeoHead } from "@/hooks/useSeoHead";

const ContactPage = () => {
  useSeoHead({ canonicalPath: "/contact", ogType: "website" });
  return (
    <WebLayout>
      <Helmet>
        <title>Contact | PyRo — platformă de învățare Python</title>
        <meta name="description" content="Date de contact PyRo: cine administrează platforma, adresa de email pentru întrebări, suport și protecția datelor." />
      </Helmet>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="mt-3 text-muted-foreground">
          PyRo este un proiect educațional creat și administrat de Cosmin Florescu, profesor de informatică și autor de
          manuale pentru clasa a IX-a. Răspundem de obicei în 1–2 zile lucrătoare.
        </p>
        <div className="mt-8 space-y-4">
          <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
            <Mail className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">Întrebări generale, colaborări, școli</h2>
              <a href="mailto:florescu.cosmin.tr@gmail.com" className="text-primary hover:underline">florescu.cosmin.tr@gmail.com</a>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">Protecția datelor (GDPR)</h2>
              <a href="mailto:gdpr@pyroskill.info" className="text-primary hover:underline">gdpr@pyroskill.info</a>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
            <LifeBuoy className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">Ajutor cu contul sau aplicația</h2>
              <Link to="/support" className="text-primary hover:underline">Vezi întrebările frecvente</Link>
            </div>
          </div>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Site oficial: pyroskill.info · România
        </p>
      </article>
    </WebLayout>
  );
};

export default ContactPage;
