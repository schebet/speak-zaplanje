import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, LogOut, Trash2, Edit, Eye, EyeOff, Star, Sparkles, Loader2, Users, Upload, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

type Article = Tables<"articles">;
const categories = ["Вести", "Култура", "Традиција", "Догађаји", "Природа", "Спорт"] as const;

interface EditorUser {
  user_id: string;
  role: "admin" | "editor";
  email?: string;
  display_name?: string;
}

const Admin = () => {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Editor management
  const [editors, setEditors] = useState<EditorUser[]>([]);
  const [newEditorEmail, setNewEditorEmail] = useState("");
  const [addingEditor, setAddingEditor] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Вести" as string,
    image_url: "",
    is_featured: false,
    is_published: false,
  });

  useEffect(() => {
    if (!authLoading && (!user || !role)) {
      navigate("/login");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && role) {
      fetchArticles();
      if (role === "admin") fetchEditors();
    }
  }, [user, role]);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Грешка при учитавању чланака");
    else setArticles(data || []);
    setLoading(false);
  };

  const fetchEditors = async () => {
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("user_id, role");
    if (error || !roles) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    const editorList: EditorUser[] = roles.map((r) => {
      const profile = profiles?.find((p) => p.user_id === r.user_id);
      return {
        user_id: r.user_id,
        role: r.role as "admin" | "editor",
        display_name: profile?.display_name || undefined,
      };
    });
    setEditors(editorList);
  };

  const handleAddEditor = async () => {
    if (!newEditorEmail.trim()) {
      toast.error("Унесите email адресу");
      return;
    }
    setAddingEditor(true);
    try {
      // Find user by email via profiles (display_name often stores email initially)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .ilike("display_name", newEditorEmail.trim());

      if (!profiles || profiles.length === 0) {
        toast.error("Корисник са тим email-ом није пронађен. Корисник мора прво да се региструје.");
        setAddingEditor(false);
        return;
      }

      const targetUserId = profiles[0].user_id;

      // Check if already has a role
      const existing = editors.find((e) => e.user_id === targetUserId);
      if (existing) {
        toast.error("Корисник већ има улогу: " + existing.role);
        setAddingEditor(false);
        return;
      }

      const { error } = await supabase.from("user_roles").insert({
        user_id: targetUserId,
        role: "editor" as const,
      });

      if (error) throw error;
      toast.success("Уредник додат!");
      setNewEditorEmail("");
      fetchEditors();
    } catch (e: any) {
      toast.error("Грешка: " + (e.message || "Непозната грешка"));
    } finally {
      setAddingEditor(false);
    }
  };

  const handleRemoveEditor = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("Не можете уклонити себе");
      return;
    }
    if (!confirm("Да ли сте сигурни да желите да уклоните овог уредника?")) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "editor" as const);
    if (error) toast.error("Грешка: " + error.message);
    else {
      toast.success("Уредник уклоњен");
      fetchEditors();
    }
  };

  const resetForm = () => {
    setForm({ title: "", excerpt: "", content: "", category: "Вести", image_url: "", is_featured: false, is_published: false });
    setEditing(null);
    setShowForm(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Само слике су дозвољене");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Максимална величина слике је 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("article-images")
        .getPublicUrl(fileName);

      setForm({ ...form, image_url: urlData.publicUrl });
      toast.success("Слика отпремљена!");
    } catch (e: any) {
      toast.error("Грешка при отпремању: " + (e.message || "Непозната грешка"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim()) {
      toast.error("Наслов и извод су обавезни");
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("articles")
        .update({
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          category: form.category,
          image_url: form.image_url,
          is_featured: form.is_featured,
          is_published: form.is_published,
        })
        .eq("id", editing);
      if (error) toast.error("Грешка: " + error.message);
      else {
        toast.success("Чланак ажуриран");
        resetForm();
        fetchArticles();
      }
    } else {
      const { error } = await supabase.from("articles").insert({
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        image_url: form.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        is_featured: form.is_featured,
        is_published: form.is_published,
        author: user?.email || "Уредник",
        author_id: user?.id,
      });
      if (error) toast.error("Грешка: " + error.message);
      else {
        toast.success("Чланак креиран");
        resetForm();
        fetchArticles();
      }
    }
  };

  const handleEdit = (article: Article) => {
    setForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content || "",
      category: article.category,
      image_url: article.image_url || "",
      is_featured: article.is_featured || false,
      is_published: article.is_published || false,
    });
    setEditing(article.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Да ли сте сигурни?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) toast.error("Грешка: " + error.message);
    else {
      toast.success("Чланак обрисан");
      fetchArticles();
    }
  };

  const handleTranslate = async (article: Article) => {
    setTranslating(article.id);
    try {
      const { data, error } = await supabase.functions.invoke("translate-dialect", {
        body: {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content || "",
        },
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("articles")
        .update({
          title_zone1: data.zone1.title,
          excerpt_zone1: data.zone1.excerpt,
          content_zone1: data.zone1.content,
          title_zone2: data.zone2.title,
          excerpt_zone2: data.zone2.excerpt,
          content_zone2: data.zone2.content,
        })
        .eq("id", article.id);

      if (updateError) throw updateError;
      toast.success("Превод генерисан за обе зоне!");
      fetchArticles();
    } catch (e: any) {
      toast.error("Грешка при превођењу: " + (e.message || "Непозната грешка"));
    } finally {
      setTranslating(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="accent-border-strip" />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-black text-foreground">Заплање CMS</h1>
            <p className="text-xs text-muted-foreground">
              {role === "admin" ? "Администратор" : "Уредник"} — {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Портал
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Одјави се
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Укупно", value: articles.length },
            { label: "Објављено", value: articles.filter((a) => a.is_published).length },
            { label: "Нацрти", value: articles.filter((a) => !a.is_published).length },
            { label: "Преведено", value: articles.filter((a) => a.title_zone1).length },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="articles">
          <TabsList className="mb-6">
            <TabsTrigger value="articles">Чланци</TabsTrigger>
            {role === "admin" && <TabsTrigger value="editors"><Users className="h-4 w-4 mr-1" /> Уредници</TabsTrigger>}
          </TabsList>

          <TabsContent value="articles">
            {/* Actions */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif font-bold text-foreground">Чланци</h2>
              <Button onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Нови чланак
              </Button>
            </div>

            {/* Form */}
            {showForm && (
              <div className="bg-card rounded-xl border border-border p-6 mb-6">
                <h3 className="font-serif font-bold text-foreground mb-4">
                  {editing ? "Измени чланак" : "Нови чланак"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Наслов</label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Извод</label>
                    <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Садржај</label>
                    <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Категорија</label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Слика</label>
                    <div className="flex gap-2">
                      <Input
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        placeholder="URL слике или отпремите..."
                        className="flex-1"
                      />
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <Button type="button" variant="outline" size="icon" disabled={uploading} asChild>
                          <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                        </Button>
                      </label>
                    </div>
                    {form.image_url && (
                      <div className="mt-2 relative rounded-lg overflow-hidden h-32 bg-muted">
                        <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                      Објави
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                      Истакнут
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSave}>{editing ? "Сачувај" : "Креирај"}</Button>
                  <Button variant="outline" onClick={resetForm}>Откажи</Button>
                </div>
              </div>
            )}

            {/* Articles list */}
            <div className="space-y-3">
              {articles.map((article) => (
                <div key={article.id} className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                  {article.image_url && (
                    <img src={article.image_url} alt="" className="w-16 h-16 rounded object-cover hidden sm:block" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {article.category}
                      </span>
                      {article.is_published ? (
                        <Eye className="h-3 w-3 text-cat-tradition" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      )}
                      {article.is_featured && <Star className="h-3 w-3 text-accent" />}
                      {article.title_zone1 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-cat-tradition rounded">AI преведено</span>
                      )}
                    </div>
                    <h4 className="font-serif font-bold text-foreground text-sm truncate">{article.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{article.excerpt}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => handleTranslate(article)} disabled={translating === article.id}>
                      {translating === article.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(article)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {role === "admin" && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(article.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {articles.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  Нема чланака. Креирајте први чланак!
                </p>
              )}
            </div>
          </TabsContent>

          {role === "admin" && (
            <TabsContent value="editors">
              <div className="bg-card rounded-xl border border-border p-6 mb-6">
                <h3 className="font-serif font-bold text-foreground mb-4">Додај уредника</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Корисник мора прво да се региструје на порталу. Затим унесите његов email да бисте му доделили улогу уредника.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newEditorEmail}
                    onChange={(e) => setNewEditorEmail(e.target.value)}
                    placeholder="email@primer.com"
                    className="max-w-sm"
                  />
                  <Button onClick={handleAddEditor} disabled={addingEditor}>
                    {addingEditor ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    Додај
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {editors.map((editor) => (
                  <div key={editor.user_id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{editor.display_name || editor.user_id}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        editor.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                      }`}>
                        {editor.role === "admin" ? "Администратор" : "Уредник"}
                      </span>
                    </div>
                    {editor.role === "editor" && editor.user_id !== user?.id && (
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveEditor(editor.user_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {editors.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Нема корисника са улогама.</p>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
