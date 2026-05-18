import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TutorialArticle } from "@/data/tutorials/types";

interface Props {
  article: TutorialArticle;
  basePath: string;
}

const TutorialCard = ({ article, basePath }: Props) => {
  return (
    <Link to={`${basePath}/${article.slug}`}>
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {article.durationMin} min
          </div>
          <h3 className="text-lg font-semibold leading-snug">{article.title}</h3>
          <p className="flex-1 text-sm text-muted-foreground">{article.excerpt}</p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Citește <ArrowRight className="h-4 w-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
};

export default TutorialCard;
