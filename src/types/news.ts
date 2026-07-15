export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: number; // epoch ms
  summary: string;
  image?: string;
}

export interface FullArticle {
  title: string;
  html: string; // sanitized
  image?: string;
  summary?: string;
}