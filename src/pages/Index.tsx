import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroArticle } from "@/components/HeroArticle";
import { ArticleCard } from "@/components/ArticleCard";
import { PortalSidebar } from "@/components/PortalSidebar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useDialect } from "@/contexts/DialectContext";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type DBArticle = Tables<"articles">;

export interface DisplayArticle {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  imageUrl: string;
  isFeatured?: boolean;
}

function toDisplayArticle(a: DBArticle, dialect: string): DisplayArticle {
  let title = a.title;
  let excerpt = a.excerpt;
  let content = a.content || "";

  if (dialect === "Зона I" && a.title_zone1) {
    title = a.title_zone1;
    excerpt = a.excerpt_zone1 || a.excerpt;
    content = a.content_zone1 || a.content || "";
  } else if (dialect === "Зона II" && a.title_zone2) {
    title = a.title_zone2;
    excerpt = a.excerpt_zone2 || a.excerpt;
    content = a.content_zone2 || a.content || "";
  }

  return {
    id: a.id,
    title,
    excerpt,
    content,
    category: a.category,
    author: a.author,
    date: new Date(a.created_at).toLocaleDateString("sr-Latn-RS"),
    readTime: a.read_time || "5 мин",
    imageUrl: a.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    isFeatured: a.is_featured || false,
  };
}

const Index = () => {
  const [dbArticles, setDbArticles] = useState<DBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { dialect, t } = useDialect();

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (!error && data) setDbArticles(data);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  const articles = dbArticles.map((a) => toDisplayArticle(a, dialect));
  const featured = articles[0];
  const rest = articles.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("Нема објављених чланака")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <section className="mb-10">
            <HeroArticle article={featured} />
          </section>
          {rest.length > 0 && (
            <section>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                {t("Најновије")}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {rest.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
                <aside className="lg:col-span-1">
                  <PortalSidebar articles={articles} />
                </aside>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
