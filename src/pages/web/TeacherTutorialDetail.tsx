import WebLayout from "@/components/web/WebLayout";
import TutorialArticleView from "@/components/web/TutorialArticleView";
import { teacherTutorials } from "@/data/tutorials/teachers";

const TeacherTutorialDetail = () => {
  return (
    <WebLayout>
      <TutorialArticleView
        articles={teacherTutorials}
        basePath="/tutoriale/profesori"
        audience="Profesori"
      />
    </WebLayout>
  );
};

export default TeacherTutorialDetail;
