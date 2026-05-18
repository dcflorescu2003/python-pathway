import { Link } from "react-router-dom";
import { Smartphone, Apple, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=ro.pythonpathway.app";
const APP_STORE_URL = "https://apps.apple.com/us/app/pyro/id6762510941";

interface Props {
  className?: string;
  showWebButton?: boolean;
}

const AppDownloadCTA = ({ className, showWebButton = true }: Props) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ""}`}>
      <Button asChild size="lg" className="gap-2">
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
          <Smartphone className="h-5 w-5" />
          Google Play
        </a>
      </Button>
      <Button asChild size="lg" variant="secondary" className="gap-2">
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
          <Apple className="h-5 w-5" />
          App Store
        </a>
      </Button>
      {showWebButton && (
        <Button asChild size="lg" variant="outline" className="gap-2">
          <Link to="/auth">
            <Globe className="h-5 w-5" />
            Deschide aplicația web
          </Link>
        </Button>
      )}
    </div>
  );
};

export default AppDownloadCTA;
