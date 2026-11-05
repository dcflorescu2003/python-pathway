import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const SITE = "https://pyroskill.info";

export interface Crumb {
  name: string;
  path: string;
}

/** Visible author line + Article/Breadcrumb structured data for public content pages. */
const AuthorNote = ({ crumbs, headline, description }: { crumbs: Crumb[]; headline: string; description?: string }) => {
  const last = crumbs[crumbs.length - 1];
  const author = {
    "@type": "Person",
    name: "Cosmin Florescu",
    jobTitle: "Profesor de informatică, autor de manuale pentru clasa a IX-a",
    url: `${SITE}/about`,
  };
  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE}${c.path}` })),
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            headline,
            name: headline,
            description,
            inLanguage: "ro",
            url: `${SITE}${last.path}`,
            author,
            publisher: { "@type": "Organization", name: "PyRo", url: SITE },
            isAccessibleForFree: true,
          })}
        </script>
      </Helmet>
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3 text-sm text-muted-foreground">
        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Material elaborat și verificat de <Link to="/about" className="text-foreground hover:underline">prof. Cosmin Florescu</Link>,
          profesor de informatică și autor de manuale pentru clasa a IX-a.
        </p>
      </div>
    </>
  );
};

export default AuthorNote;
