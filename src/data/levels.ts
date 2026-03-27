import level1 from "@/assets/levels/1_ou.png";
import level2 from "@/assets/levels/2_baby_python.png";
import level3 from "@/assets/levels/3_little_snake.png";
import level4 from "@/assets/levels/4_code_crawler.png";
import level5 from "@/assets/levels/5_script_serpent.png";
import level6 from "@/assets/levels/6_loop_viper.png";
import level7 from "@/assets/levels/7_data_cobra.png";
import level8 from "@/assets/levels/8_algorithm_anaconda.png";
import level9 from "@/assets/levels/9_recursion_king.png";
import level10 from "@/assets/levels/10_master_of_python.png";

export interface LevelInfo {
  minLevel: number;
  name: string;
  emoji: string;
  image: string;
  scale: number;
}

const levelTiers: LevelInfo[] = [
  { minLevel: 25, name: "Master of Python", emoji: "👑🐍", image: level10, scale: 1.6 },
  { minLevel: 22, name: "Recursion King", emoji: "🐉", image: level9, scale: 1.5 },
  { minLevel: 19, name: "Algorithm Anaconda", emoji: "🐍", image: level8, scale: 1.4 },
  { minLevel: 16, name: "Data Cobra", emoji: "🐍", image: level7, scale: 1.3 },
  { minLevel: 13, name: "Loop Viper", emoji: "🐍", image: level6, scale: 1.2 },
  { minLevel: 10, name: "Script Serpent", emoji: "🐍", image: level5, scale: 1.15 },
  { minLevel: 7, name: "Code Crawler", emoji: "🐍", image: level4, scale: 1.1 },
  { minLevel: 4, name: "Little Snake", emoji: "🐍", image: level3, scale: 1.05 },
  { minLevel: 2, name: "Baby Python", emoji: "🐣", image: level2, scale: 1.0 },
  { minLevel: 1, name: "Oul Misterios", emoji: "🥚", image: level1, scale: 0.9 },
];

export const getLevelInfo = (level: number): LevelInfo => {
  for (const tier of levelTiers) {
    if (level >= tier.minLevel) return { ...tier, name: tier.minLevel === 2 ? `Baby Python Lvl ${level - 1}` : tier.name };
  }
  return levelTiers[levelTiers.length - 1];
};

export const getAllLevelTiers = (): LevelInfo[] => [...levelTiers].reverse();
