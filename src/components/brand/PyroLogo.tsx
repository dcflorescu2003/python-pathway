import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

interface PyroLogoProps {
  size?: Size;
  showWordmark?: boolean;
  showTagline?: boolean;
  premium?: boolean;
  className?: string;
}

const SIZE_MAP: Record<Size, { img: string; radius: string; text: string; gap: string }> = {
  sm: { img: "h-7 w-7", radius: "rounded-lg", text: "text-xl", gap: "gap-2" },
  md: { img: "h-10 w-10", radius: "rounded-xl", text: "text-2xl", gap: "gap-2" },
  lg: { img: "h-16 w-16", radius: "rounded-2xl", text: "text-3xl", gap: "gap-3" },
  xl: { img: "h-32 w-32", radius: "rounded-3xl", text: "text-4xl", gap: "gap-3" },
};

const PyroLogo = ({
  size = "md",
  showWordmark = true,
  showTagline = false,
  premium = false,
  className,
}: PyroLogoProps) => {
  const s = SIZE_MAP[size];

  return (
    <div className={cn("inline-flex flex-col items-center", s.gap, className)}>
      <div className={cn("inline-flex items-center", s.gap)}>
        <img src={logo} alt="PyRo" className={cn(s.img, s.radius, "object-contain")} />
        {showWordmark && (
          <span className={cn("font-mono font-bold leading-none", s.text)}>
            <span className="text-gradient-primary">Py</span>
            <span className="text-tricolor">Ro</span>
            {premium && (
              <span className="ml-1 text-xs text-yellow-500 font-bold align-top">PRO</span>
            )}
          </span>
        )}
      </div>
      {showTagline && (
        <p className="text-sm text-muted-foreground">Învață Python pas cu pas</p>
      )}
    </div>
  );
};

export default PyroLogo;
