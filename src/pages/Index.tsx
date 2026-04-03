import { Header } from "@/components/Header";
import { HeroArticle } from "@/components/HeroArticle";
import { ArticleCard } from "@/components/ArticleCard";
import { PortalSidebar } from "@/components/PortalSidebar";
import { Footer } from "@/components/Footer";
import { articles } from "@/lib/mockData";

const Index = () => {
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Hero */}
          <section className="mb-10">
            <HeroArticle article={featured} />
          </section>

          {/* Content grid */}
          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
              Најновије
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
