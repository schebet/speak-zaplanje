export type Category = "Вести" | "Култура" | "Традиција" | "Догађаји" | "Природа" | "Спорт";

export type DialectZone = "Стандардни" | "Зона I" | "Зона II";

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: Category;
  author: string;
  date: string;
  readTime: string;
  imageUrl: string;
  isFeatured?: boolean;
}

export const categoryColorMap: Record<Category, string> = {
  "Вести": "cat-news",
  "Култура": "cat-culture",
  "Традиција": "cat-tradition",
  "Догађаји": "cat-events",
  "Природа": "cat-nature",
  "Спорт": "cat-sport",
};
