import { useEffect, useState } from 'react';
import { BookOpen, Loader2, ArrowLeft, Clock, Tag, Search } from 'lucide-react';
import { type AwarenessArticle } from '@/lib/supabase';
import { apiGet } from '@/lib/api';
import { ViewHeader } from '@/components/UrlChecker';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'phishing', label: 'Phishing' },
  { id: 'passwords', label: 'Passwords' },
  { id: 'malware', label: 'Malware' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'social', label: 'Social Engineering' },
  { id: 'data', label: 'Data Breaches' },
  { id: 'others', label: 'Others' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  phishing: 'from-rose-500 to-red-600',
  passwords: 'from-emerald-500 to-teal-600',
  malware: 'from-orange-500 to-red-600',
  privacy: 'from-cyan-500 to-blue-600',
  social: 'from-amber-500 to-orange-600',
  data: 'from-violet-500 to-purple-600',
  others: 'from-indigo-500 to-purple-600',
};

export default function Awareness() {
  const [articles, setArticles] = useState<AwarenessArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AwarenessArticle | null>(null);

  useEffect(() => {
    async function load() {
      const { items } = await apiGet<{ items: AwarenessArticle[] }>('/articles');
      setArticles(items);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = articles.filter((a) => {
    const matchCat = category === 'all' || a.category === category;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (selected) {
    return <ArticleView article={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-8">
      <ViewHeader
        icon={BookOpen}
        title="Cyber Awareness"
        subtitle="Learn how to recognize and defend against the most common online threats. Browse curated guides on phishing, passwords, malware, and more."
      />

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-3 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === c.id
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-sm text-slate-500">
          No articles match your search.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 text-left transition-all hover:border-slate-700 hover:bg-slate-900"
            >
              <div className={`h-2 w-full bg-gradient-to-r ${CATEGORY_COLORS[a.category] || 'from-slate-600 to-slate-700'}`} />
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[a.category] || 'from-slate-600 to-slate-700'}`}>
                    <BookOpen className="h-4 w-4 text-white" />
                  </span>
                  <span className="text-xs font-medium capitalize text-slate-500">{a.category}</span>
                </div>
                <h3 className="font-semibold leading-snug text-slate-100 group-hover:text-cyan-300">{a.title}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-400 line-clamp-3">{a.summary}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {a.read_time} min read
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleView({ article, onBack }: { article: AwarenessArticle; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300">
        <ArrowLeft className="h-4 w-4" />
        Back to articles
      </button>

      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[article.category] || 'from-slate-600 to-slate-700'}`}>
            <BookOpen className="h-5 w-5 text-white" />
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Tag className="h-3.5 w-3.5" />
            <span className="capitalize">{article.category}</span>
            <span>·</span>
            <Clock className="h-3.5 w-3.5" />
            {article.read_time} min read
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
        <p className="mt-2 text-lg text-slate-400">{article.summary}</p>
      </div>

      <div className="h-px bg-slate-800" />

      <article className="prose-invert max-w-none space-y-4 text-slate-300 [&>p]:leading-relaxed">
        {article.content.split('\n').map((line, i) =>
          line.trim() === '' ? (
            <div key={i} className="h-2" />
          ) : (
            <p key={i} className="whitespace-pre-line text-[15px] leading-relaxed text-slate-300">
              {line}
            </p>
          )
        )}
      </article>
    </div>
  );
}
