import { Article } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { Clock, User } from "lucide-react";
import { useDialect } from "@/contexts/DialectContext";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { t } = useDialect();

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="aspect-video overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <CategoryBadge category={article.category} className="mb-2" />
        <h3 className="font-serif font-bold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-accent-foreground transition-colors">
          {t(article.title)}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {t(article.excerpt)}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {article.author}
          </span>
          <span>{article.date}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t(article.readTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
