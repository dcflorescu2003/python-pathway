export interface LevelInfo {
  minLevel: number;
  name: string;
  emoji: string;
  scale: number;
}

const levelTiers: LevelInfo[] = [
  { minLevel: 25, name: "Master of Python", emoji: "👑🐍", scale: 1.6 },
  { minLevel: 22, name: "Recursion King", emoji: "🐉", scale: 1.5 },
  { minLevel: 19, name: "Algorithm Anaconda", emoji: "🐍", scale: 1.4 },
  { minLevel: 16, name: "Data Cobra", emoji: "🐍", scale: 1.3 },
  { minLevel: 13, name: "Loop Viper", emoji: "🐍", scale: 1.2 },
  { minLevel: 10, name: "Script Serpent", emoji: "🐍", scale: 1.15 },
  { minLevel: 7, name: "Code Crawler", emoji: "🐍", scale: 1.1 },
  { minLevel: 4, name: "Little Snake", emoji: "🐍", scale: 1.05 },
  { minLevel: 2, name: "Baby Python", emoji: "🐣", scale: 1.0 },
  { minLevel: 1, name: "Oul Misterios", emoji: "🥚", scale: 0.9 },
];

export const getLevelInfo = (level: number): LevelInfo => {
  for (const tier of levelTiers) {
    if (level >= tier.minLevel) return { ...tier, name: tier.minLevel === 2 ? `Baby Python Lvl ${level - 1}` : tier.name };
  }
  return levelTiers[levelTiers.length - 1];
};

export const getAllLevelTiers = (): LevelInfo[] => [...levelTiers].reverse();
