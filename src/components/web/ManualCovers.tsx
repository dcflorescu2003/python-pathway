import matInfAsset from "@/assets/manual-clasa-9-c1-mat-inf.webp.asset.json";
import stiinteAsset from "@/assets/manual-clasa-9-c1-stiinte-naturii.webp.asset.json";
import { cn } from "@/lib/utils";

const MANUALS_URL = "https://edulit.ro/collections/informatica";

const manuals = [
  {
    src: matInfAsset.url,
    label: "Manual pentru clasa a IX-a — profil matematică-informatică",
    alt: "Coperta manualului de Informatică pentru clasa a IX-a, profil matematică-informatică, Editura Litera",
  },
  {
    src: stiinteAsset.url,
    label: "Manual pentru clasa a IX-a — profil științe ale naturii",
    alt: "Coperta manualului de Informatică pentru clasa a IX-a, profil științe ale naturii, Editura Litera",
  },
];

const ManualCovers = ({ className }: { className?: string }) => (
  <div className={cn("grid grid-cols-2 gap-4 sm:gap-6", className)}>
    {manuals.map((manual) => (
      <a
        key={manual.label}
        href={MANUALS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group block text-center"
      >
        <img
          src={manual.src}
          alt={manual.alt}
          width={1211}
          height={1535}
          loading="lazy"
          decoding="async"
          className="w-full rounded-lg border border-border/60 shadow-xl transition-transform duration-300 group-hover:-translate-y-1"
        />
        <p className="mt-2 text-xs leading-snug text-muted-foreground">{manual.label}</p>
      </a>
    ))}
  </div>
);

export default ManualCovers;
