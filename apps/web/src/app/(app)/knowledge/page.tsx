'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Search, BookOpen, Plus, Tag, X } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary?: string;
  tags: string[];
  authorName: string;
  createdAt: string;
  viewCount: number;
}

export default function KnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    api.get<any>('/knowledge')
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        setArticles(list);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags)));
  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.summary || '').toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || a.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <>
      <TopBar
        title="Base de Conhecimento"
        subtitle={`${articles.length} artigo${articles.length !== 1 ? 's' : ''}`}
        actions={
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] transition-colors">
            <Plus size={12} />
            Novo Artigo
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Search */}
          <div className="relative max-w-md">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar artigos, lições aprendidas, SOPs..."
              className="w-full pl-8 pr-3 py-2 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          {/* Tags filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={12} className="text-[#888888]" />
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={cn(
                    'text-[11px] font-medium px-2 py-0.5 border transition-colors',
                    selectedTag === tag
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#E5E5E5] text-[#555555] hover:border-[#AAAAAA]',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Articles grid */}
          {loading ? (
            <div className="text-sm text-[#888888]">Carregando artigos...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen size={32} className="text-[#AAAAAA] mx-auto mb-4" />
              <p className="text-sm text-[#555555] mb-2">Nenhum artigo encontrado</p>
              <p className="text-[11px] text-[#888888]">
                {search || selectedTag ? 'Tente outros termos de busca' : 'Comece adicionando lições aprendidas e SOPs dos seus projetos'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((article) => (
                <div
                  key={article.id}
                  className="bg-white border border-[#E5E5E5] p-5 hover:border-[#AAAAAA] hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-[#111111] leading-tight">{article.title}</h3>
                  </div>
                  {article.summary && (
                    <p className="text-[11px] text-[#888888] leading-relaxed mb-3 line-clamp-3">{article.summary}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] text-[#888888] border border-[#E5E5E5] px-1.5 py-0.5">{tag}</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-[#AAAAAA]">{article.viewCount} views</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
                    <span className="text-[10px] text-[#888888]">{article.authorName}</span>
                    <span className="text-[10px] text-[#AAAAAA]">
                      {new Date(article.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
