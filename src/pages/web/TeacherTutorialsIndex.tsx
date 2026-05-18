import { Helmet } from "react-helmet-async";
import WebLayout from "@/components/web/WebLayout";
import TutorialCard from "@/components/web/TutorialCard";
import AppDownloadCTA from "@/components/web/AppDownloadCTA";
import { teacherTutorials } from "@/data/tutorials/teachers";

const TeacherTutorialsIndex = () => {
  return (
    <WebLayout>
      <Helmet>
        <title>Tutoriale pentru profesori | PyRo</title>
        <meta
          name="description"
          content="Ghiduri pentru profesori: verificare cont, clase, teste, notare cu AI, analitice și profil de competențe."
        />
        <link rel="canonical" href="https://pyroskill.info/tutoriale/profesori" />
        <meta property="og:title" content="Tutoriale pentru profesori | PyRo" />
        <meta property="og:description" content="Folosește PyRo în clasă: tot ce trebuie să știi ca profesor." />
        <meta property="og:url" content="https://pyroskill.info/tutoriale/profesori" />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Pentru profesori</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Tutoriale PyRo</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Ghiduri scurte pentru clase, teste, notare cu AI și analitice. De la verificare cont la
            export PDF.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teacherTutorials.map((article) => (
              <TutorialCard key={article.slug} article={article} basePath="/tutoriale/profesori" />
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

export default TeacherTutorialsIndex;
