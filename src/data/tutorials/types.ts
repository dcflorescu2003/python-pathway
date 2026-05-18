export interface TutorialSection {
  heading?: string;
  body: string[];
  image?: { src?: string; alt: string; placeholder?: string };
  tip?: string;
}

export interface TutorialArticle {
  slug: string;
  title: string;
  excerpt: string;
  durationMin: number;
  sections: TutorialSection[];
}
