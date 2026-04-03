import { Article, categoryColorMap } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDialect } from "@/contexts/DialectContext";

const dotClasses: Record<string, string> = {
  "cat-news": "bg-cat-news",
  "cat-culture": "bg-cat-culture",
  "cat-tradition": "bg-cat-tradition",
  "cat-events": "bg-cat-events",
  "cat-nature": "bg-cat-nature",
  "cat-sport": "bg-cat-sport",
};

interface PortalSidebarProps {
  articles: Article[];
}

export function PortalSidebar({ articles }: PortalSidebarProps) {
  const { t } = useDialect();
  const top5 = articles.slice(0, 5);

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="font-serif font-bold text-lg text-foreground mb-4 pb-2 border-b border-border">
        {t("Најчитаније")}
      </h3>
      <ol className="space-y-4">
        {top5.map((article, i) => (
          <li key={article.id} className="flex items-start gap-3 cursor-pointer group">
            <span className="text-2xl font-serif font-black text-muted-foreground/40 leading-none min-w-[28px]">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    dotClasses[categoryColorMap[article.category]]
                  )}
                />
                <span className="text-xs text-muted-foreground">{t(article.category)}</span>
              </div>
              <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-accent-foreground transition-colors">
                {t(article.title)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
