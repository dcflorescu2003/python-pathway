import WebLayout from "@/components/web/WebLayout";
import TutorialArticleView from "@/components/web/TutorialArticleView";
import { studentTutorials } from "@/data/tutorials/students";

const StudentTutorialDetail = () => {
  return (
    <WebLayout>
      <TutorialArticleView
        articles={studentTutorials}
        basePath="/tutoriale/elevi"
        audience="Elevi"
      />
    </WebLayout>
  );
};

export default StudentTutorialDetail;
