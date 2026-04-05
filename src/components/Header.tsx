import { useState } from "react";
import { Menu, X, Globe, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Category, DialectZone } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDialect } from "@/contexts/DialectContext";
import { useAuth } from "@/hooks/useAuth";

const categories: { name: Category; colorClass: string }[] = [
  { name: "Вести", colorClass: "text-cat-news hover:text-cat-news/80" },
  { name: "Култура", colorClass: "text-cat-culture hover:text-cat-culture/80" },
  { name: "Традиција", colorClass: "text-cat-tradition hover:text-cat-tradition/80" },
  { name: "Догађаји", colorClass: "text-cat-events hover:text-cat-events/80" },
  { name: "Природа", colorClass: "text-cat-nature hover:text-cat-nature/80" },
  { name: "Спорт", colorClass: "text-cat-sport hover:text-cat-sport/80" },
];

const dialects: DialectZone[] = ["Стандардни", "Зона I", "Зона II"];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dialect, setDialect, t } = useDialect();
  const { user, role } = useAuth();

  return (
    <header className="bg-card border-b border-border">
      <div className="accent-border-strip" />
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-black text-foreground leading-none">
                Заплање
              </h1>
              <p className="text-[10px] md:text-xs font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("Локални портал")}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <Globe className="h-4 w-4 text-muted-foreground mr-1" />
              {dialects.map((d) => (
                <button
                  key={d}
                  onClick={() => setDialect(d)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    dialect === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            {(role === "admin" || role === "editor") ? (
              <Link to="/admin" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="h-4 w-4" /> CMS
              </Link>
            ) : (
              <Link to="/login" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Пријава
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Category nav - desktop */}
        <nav className="hidden md:flex items-center gap-6 pb-3">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className={cn("text-sm font-semibold transition-colors", cat.colorClass)}
            >
              {t(cat.name)}
            </a>
          ))}
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <nav className="flex flex-col gap-2">
              {categories.map((cat) => (
                <a
                  key={cat.name}
                  href="#"
                  className={cn("text-sm font-semibold py-1", cat.colorClass)}
                >
                  {t(cat.name)}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 w-fit">
              <Globe className="h-4 w-4 text-muted-foreground mr-1" />
              {dialects.map((d) => (
                <button
                  key={d}
                  onClick={() => setDialect(d)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    dialect === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
