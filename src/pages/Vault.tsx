import { useState, useEffect } from "react";
import { BookOpen, FileText, Video, BookMarked, ChevronUp, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { knowledgeBase } from "@/lib/knowledgeBase";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  video: Video,
  guide: BookMarked,
};

const categories = ["All", "First Aid", "Survival", "Communications", "Shelter"];

const EXIT_DURATION = 300;

export default function Vault() {
  const [selectedCat, setSelectedCat] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [readerArticleId, setReaderArticleId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const filtered = knowledgeBase.filter((a) => {
    const matchCat = selectedCat === "All" || a.category === selectedCat;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.sections.some(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const toggleExpanded = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    setExpandedId(expandedId === articleId ? null : articleId);
  };

  const openReader = (articleId: string) => {
    setReaderArticleId(articleId);
    setMounted(true);
  };

  const closeReader = () => {
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      setReaderArticleId(null);
    }, EXIT_DURATION);
  };

  useEffect(() => {
    if (mounted) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [mounted]);

  const readerArticle = knowledgeBase.find((a) => a.id === readerArticleId);

  return (
    <>
      <div className="space-y-5">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 gap-2 ">
          {categories.map((cat) => (
            <Button key={cat} onClick={() => setSelectedCat(cat)} className={selectedCat === cat ? "bg-primary text-black font-semibold" : "bg-secondary/70 text-white font-semibold"} >
              {cat}
            </Button>
          ))}
        </div>

        {/* Articles */}
        <div className="space-y-2">
          {filtered.map((article) => {
            const isExpanded = expandedId === article.id;
            return (
              <Card
                key={article.id}
                onClick={() => openReader(article.id)}
                className={cn("transition-all duration-500 cursor-pointer", isExpanded && "border-primary")}
              >
                <CardContent className="py-3">
                  <div
                    onClick={(e) => toggleExpanded(e, article.id)}
                    className="flex items-center gap-3 w-full text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-heading font-semibold truncate">{article.title}</p>
                      <p className="text-xs text-muted-foreground">{article.category} • {article.sections.length} sections</p>
                    </div>
                    <ChevronUp className={isExpanded ? `h-4 w-4 text-primary shrink-0 rotate-180 duration-300 transition-all` : `h-4 w-4 text-muted-foreground shrink-0 duration-300 transition-all`} />
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 pt-4">
                      {article.sections.map((section, idx) => (
                        <div key={idx} className="space-y-2">
                          <h4 className="text-sm font-heading font-bold text-primary">{section.title}</h4>
                          {section.diagram && (
                            <div
                              className="bg-secondary/30 rounded-lg p-2 overflow-hidden max-w-2xl mx-auto"
                              dangerouslySetInnerHTML={{ __html: section.diagram }}
                            />
                          )}
                          {section.diagramImage && (
                            <div className="bg-secondary/30 rounded-lg p-2 overflow-hidden max-w-2xl mx-auto">
                              <img
                                src={section.diagramImage}
                                alt={`Diagram for ${section.title}`}
                                className="w-full h-auto rounded"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="text-foreground/90 whitespace-pre-line leading-relaxed font-mono text-xs bg-secondary/50 rounded-lg p-3">
                            {section.content}
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground text-center pt-1">
                        Tap anywhere else on the card for fullscreen reading
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin resultados</p>
          </div>
        )}
      </div>

      {/* Fullscreen Reader */}
      {mounted && readerArticle && (
        <div
          className={cn(
            "fixed inset-0 z-[1000] bg-background overflow-y-auto transition-opacity duration-300 ease-in-out",
            visible ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <p className="text-base font-heading font-bold truncate">{readerArticle.title}</p>
              <p className="text-xs text-muted-foreground">{readerArticle.category} • {readerArticle.sections.length} sections</p>
            </div>
            <button
              onClick={closeReader}
              className="shrink-0 bg-card rounded-full p-2 shadow-lg text-primary hover:text-critical transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className={cn(
              "p-4 space-y-6 max-w-2xl mx-auto transition-all duration-300 ease-out",
              visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            )}
          >
            {readerArticle.sections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="text-base font-heading font-bold text-primary">{section.title}</h4>
                {section.diagram && (
                  <div
                    className="bg-secondary/30 rounded-lg p-3 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: section.diagram }}
                  />
                )}
                {section.diagramImage && (
                  <div className="bg-secondary/30 rounded-lg p-3 overflow-hidden">
                    <img
                      src={section.diagramImage}
                      alt={`Diagram for ${section.title}`}
                      className="w-full h-auto rounded"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="text-foreground/90 whitespace-pre-line leading-relaxed font-mono text-sm bg-secondary/50 rounded-lg p-4">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}