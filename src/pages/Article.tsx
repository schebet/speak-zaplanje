import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useDialect } from "@/contexts/DialectContext";
import { Loader2, Calendar, Clock, User, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type DBArticle = Tables<"articles">;

interface Section {
  id: string;
  title: string;
  body: string;
}

function slugify(text: string, idx: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
  return base ? `${base}-${idx}` : `section-${idx}`;
}

/**
 * Parse raw content into sections.
 * Headings are detected as:
 *   - Markdown style: lines starting with "# ", "## ", "### "
 *   - Or short standalone lines (<= 80 chars) with no trailing punctuation,
 *     surrounded by blank lines.
 * If no headings are found, the article is shown as a single section.
 */
function parseSections(content: string, fallbackTitle: string): Section[] {
  if (!content.trim()) return [];

  const lines = content.split("\n");
  const sections: Section[] = [];
  let current: { title: string; body: string[] } | null = null;
  let idx = 0;

  const pushCurrent = () => {
    if (current) {
      sections.push({
        id: slugify(current.title, idx++),
        title: current.title,
        body: current.body.join("\n").trim(),
      });
    }
  };

  const isMdHeading = (l: string) => /^#{1,3}\s+\S/.test(l.trim());
  const stripMd = (l: string) => l.trim().replace(/^#{1,3}\s+/, "");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const prevBlank = i === 0 || lines[i - 1].trim() === "";
    const nextBlank = i === lines.length - 1 || lines[i + 1].trim() === "";

    const isStandaloneHeading =
      trimmed.length > 0 &&
      trimmed.length <= 80 &&
      prevBlank &&
      nextBlank &&
      !/[.!?,:;]$/.test(trimmed);

    if (isMdHeading(trimmed) || isStandaloneHeading) {
      pushCurrent();
      current = { title: stripMd(trimmed), body: [] };
    } else {
      if (!current) current = { title: fallbackTitle, body: [] };
      current.body.push(line);
    }
  }
  pushCurrent();

  // If we ended up with just one section equal to whole content, keep it.
  if (sections.length === 0) {
    sections.push({
      id: slugify(fallbackTitle, 0),
      title: fallbackTitle,
      body: content.trim(),
    });
  }

  return sections;
}

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<DBArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const { dialect, t } = useDialect();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) setArticle(data);
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  let title = article?.title ?? "";
  let excerpt = article?.excerpt ?? "";
  let content = article?.content || "";

  if (article) {
    if (dialect === "Зона I" && article.title_zone1) {
      title = article.title_zone1;
      excerpt = article.excerpt_zone1 || article.excerpt;
      content = article.content_zone1 || article.content || "";
    } else if (dialect === "Зона II" && article.title_zone2) {
      title = article.title_zone2;
      excerpt = article.excerpt_zone2 || article.excerpt;
      content = article.content_zone2 || article.content || "";
    }
  }

  const sections = useMemo(
    () => parseSections(content, title || "Чланак"),
    [content, title]
  );

  // Scroll spy
  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
    );

    sections.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const handleTocClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    const el = sectionRefs.current[sectionId];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveId(sectionId);
    }
  };

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

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("Чланак није пронађен")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const imageUrl =
    article.image_url ||
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800";

  const showToc = sections.length > 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>

        <div className="container mx-auto px-4 py-8">
          <div
            className={cn(
              "grid gap-10",
              showToc ? "lg:grid-cols-[1fr_240px]" : "max-w-3xl mx-auto"
            )}
          >
            <article className={cn(showToc ? "max-w-3xl" : "")}>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 block">
                {article.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-black text-foreground mb-4 leading-tight">
                {title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 border-b border-border pb-6">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" /> {article.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />{" "}
                  {new Date(article.created_at).toLocaleDateString("sr-Latn-RS")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {article.read_time || "5 мин"}
                </span>
              </div>
              <p className="text-lg text-muted-foreground mb-8 font-medium leading-relaxed">
                {excerpt}
              </p>

              <div className="space-y-10">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    ref={(el) => (sectionRefs.current[section.id] = el)}
                    className="scroll-mt-28"
                  >
                    {showToc && (
                      <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
                        {section.title}
                      </h2>
                    )}
                    <div className="prose prose-lg max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                      {section.body}
                    </div>
                  </section>
                ))}
              </div>
            </article>

            {showToc && (
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="flex items-center gap-2 font-serif font-bold text-sm uppercase tracking-wider text-foreground mb-4 pb-2 border-b border-border">
                      <List className="h-4 w-4" />
                      {t("Садржај")}
                    </h3>
                    <nav>
                      <ul className="space-y-2">
                        {sections.map((s) => {
                          const isActive = s.id === activeId;
                          return (
                            <li key={s.id}>
                              <a
                                href={`#${s.id}`}
                                onClick={(e) => handleTocClick(e, s.id)}
                                className={cn(
                                  "block text-sm leading-snug border-l-2 pl-3 py-1 transition-colors",
                                  isActive
                                    ? "border-primary text-primary font-semibold"
                                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                                )}
                              >
                                {s.title}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </nav>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Article;
