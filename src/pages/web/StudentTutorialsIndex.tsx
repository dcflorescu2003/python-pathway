import { Helmet } from "react-helmet-async";
import WebLayout from "@/components/web/WebLayout";
import TutorialCard from "@/components/web/TutorialCard";
import AppDownloadCTA from "@/components/web/AppDownloadCTA";
import { studentTutorials } from "@/data/tutorials/students";

const StudentTutorialsIndex = () => {
  return (
    <WebLayout>
      <Helmet>
        <title>Tutoriale pentru elevi | PyRo</title>
        <meta
          name="description"
          content="Ghiduri pas-cu-pas pentru elevi: cum îți creezi cont, cum funcționează lecțiile, vieți, streak, probleme și provocări."
        />
        <link rel="canonical" href="https://pyroskill.info/tutoriale/elevi" />
        <meta property="og:title" content="Tutoriale pentru elevi | PyRo" />
        <meta property="og:description" content="Învață cum să folosești PyRo eficient ca elev." />
        <meta property="og:url" content="https://pyroskill.info/tutoriale/elevi" />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Pentru elevi</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Tutoriale PyRo</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Ghiduri scurte care te ajută să profiți la maxim de aplicație: cont, progres, probleme,
            provocări și mult mai mult.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {studentTutorials.map((article) => (
              <TutorialCard key={article.slug} article={article} basePath="/tutoriale/elevi" />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold">Începe acum</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Descarcă aplicația sau intră direct din browser.
          </p>
          <AppDownloadCTA className="mt-6 justify-center" />
        </div>
      </section>
    </WebLayout>
  );
};

export default StudentTutorialsIndex;
