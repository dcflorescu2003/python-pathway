import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: Props) => {
  return (
    <Card className="h-full transition-colors hover:border-primary/50">
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
