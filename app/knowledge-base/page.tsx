'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createKBCategory, updateKBCategory, archiveKBCategory, createKBArticle } from '@/lib/actions';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  BookOpen, Plus, Search, X, Loader2, Pencil, Archive, Eye, Globe, Lock,
  Hash, Tag, ChevronRight, FileText, Folder, FolderOpen, Filter,
} from 'lucide-react';
import type { KBCategory, KBArticle } from '@/lib/data';

// ─── Category Modal ───────────────────────────────────────────────────────────

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category?: KBCategory;
  onClose: () => void;
  onSave: (saved: KBCategory) => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    setLoading(true);
    try {
      if (category) {
        await updateKBCategory(category.id, { name: name.trim(), description: description.trim() || undefined });
        onSave({ ...category, name: name.trim(), description: description.trim() || undefined });
        toast.success('Category updated');
      } else {
        const row = await createKBCategory({ name: name.trim(), description: description.trim() || undefined });
        onSave({ id: row.id, name: row.name, description: row.description, createdAt: row.created_at });
        toast.success('Category created');
      }
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {category ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X size={15} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Category name..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what articles belong in this category..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[#3B5BDB] text-white rounded-lg hover:bg-[#3B5BDB] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            {loading ? 'Saving...' : category ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { KB_CATEGORIES = [], KB_ARTICLES = [], TEAM_MEMBERS = [], refresh } = useAppData();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'internal' | 'public'>('all');
  const [filterTag, setFilterTag] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KBCategory | undefined>();
  const [localCategories, setLocalCategories] = useState<KBCategory[]>([]);
  const [creatingArticle, setCreatingArticle] = useState(false);

  // Merge server categories with local
  const allCategories = useMemo(() => {
    const ids = new Set(KB_CATEGORIES.map(c => c.id));
    const merged = [...KB_CATEGORIES];
    localCategories.forEach(c => { if (!ids.has(c.id)) merged.push(c); });
    return merged;
  }, [KB_CATEGORIES, localCategories]);

  // All unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    KB_ARTICLES.forEach(a => a.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [KB_ARTICLES]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return KB_ARTICLES.filter(a => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategory && a.categoryId !== selectedCategory) return false;
      if (filterVisibility === 'internal' && a.visibility !== 'internal') return false;
      if (filterVisibility === 'public' && a.visibility !== 'all') return false;
      if (filterTag && !a.tags.includes(filterTag)) return false;
      return true;
    });
  }, [KB_ARTICLES, search, selectedCategory, filterVisibility, filterTag]);

  const handleCategorySaved = (saved: KBCategory) => {
    setLocalCategories(prev => {
      const existing = prev.find(c => c.id === saved.id);
      if (existing) return prev.map(c => c.id === saved.id ? saved : c);
      return [...prev, saved];
    });
    refresh?.();
  };

  const handleArchiveCategory = async (cat: KBCategory) => {
    if (!confirm(`Archive category "${cat.name}"? Articles will remain but lose their category.`)) return;
    try {
      await archiveKBCategory(cat.id);
      toast.success('Category archived');
      if (selectedCategory === cat.id) setSelectedCategory(null);
      refresh?.();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleNewArticle = async () => {
    setCreatingArticle(true);
    try {
      const row = await createKBArticle({
        title: 'Untitled Article',
        categoryId: selectedCategory || undefined,
      });
      router.push(`/knowledge-base/${row.id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setCreatingArticle(false);
    }
  };

  const getAuthor = (id?: string) => id ? TEAM_MEMBERS.find(m => m.id === id) : undefined;
  const getCategoryName = (id?: string) => allCategories.find(c => c.id === id)?.name;

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />

      <div className="px-4 sm:px-6 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Knowledge Base</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Internal articles, guides, and documentation</p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-13rem)]">
        {/* Left panel: Categories */}
        <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</span>
            <button
              onClick={() => { setEditingCategory(undefined); setShowCategoryModal(true); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-[#3B5BDB]"
              title="New category"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {/* All articles */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                selectedCategory === null
                  ? 'bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#3B5BDB] dark:text-indigo-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <BookOpen size={14} />
              <span className="flex-1 text-left">All Articles</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded-full">{KB_ARTICLES.length}</span>
            </button>

            {/* Category list */}
            {allCategories.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Folder size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-400">No categories yet</p>
                <button
                  onClick={() => { setEditingCategory(undefined); setShowCategoryModal(true); }}
                  className="mt-2 text-xs text-[#3B5BDB] hover:underline"
                >
                  Create one
                </button>
              </div>
            ) : (
              allCategories.map(cat => {
                const count = KB_ARTICLES.filter(a => a.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className={`group flex items-center gap-2.5 px-4 py-2 text-sm cursor-pointer transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[#EEF2FF] dark:bg-indigo-900/30 text-[#3B5BDB] dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {selectedCategory === cat.id ? <FolderOpen size={14} /> : <Folder size={14} />}
                    <span className="flex-1 truncate">{cat.name}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded-full">{count}</span>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingCategory(cat); setShowCategoryModal(true); }}
                        className="p-0.5 hover:text-[#3B5BDB] transition-colors"
                      ><Pencil size={10} /></button>
                      <button
                        onClick={e => { e.stopPropagation(); handleArchiveCategory(cat); }}
                        className="p-0.5 hover:text-red-500 transition-colors"
                      ><Archive size={10} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel: Articles */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
              />
            </div>

            {/* Visibility filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              {(['all', 'internal', 'public'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setFilterVisibility(v)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                    filterVisibility === v
                      ? 'bg-[#3B5BDB] text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >{v === 'all' ? 'All' : v === 'public' ? 'All Staff' : 'Internal'}</button>
              ))}
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <select
                value={filterTag}
                onChange={e => setFilterTag(e.target.value)}
                className="px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#3B5BDB]"
              >
                <option value="">All Tags</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            <button
              onClick={handleNewArticle}
              disabled={creatingArticle}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold bg-[#3B5BDB] text-white rounded-lg hover:bg-[#3B5BDB] transition-colors disabled:opacity-50"
            >
              {creatingArticle ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              New Article
            </button>
          </div>

          {/* Category header */}
          {selectedCategory && (
            <div className="px-6 py-2 bg-[#EEF2FF] dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/40">
              {(() => {
                const cat = allCategories.find(c => c.id === selectedCategory);
                return cat ? (
                  <div className="flex items-center gap-2">
                    <FolderOpen size={14} className="text-[#3B5BDB]" />
                    <span className="text-sm font-semibold text-[#3B5BDB] dark:text-indigo-300">{cat.name}</span>
                    {cat.description && <span className="text-xs text-[#3B5BDB] dark:text-indigo-400"> — {cat.description}</span>}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Articles list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No articles found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {search || selectedCategory || filterTag ? 'Try adjusting your filters' : 'Create your first article to get started'}
                </p>
                <button
                  onClick={handleNewArticle}
                  disabled={creatingArticle}
                  className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#3B5BDB] text-white rounded-lg hover:bg-[#3B5BDB] transition-colors mx-auto disabled:opacity-50"
                >
                  {creatingArticle ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  New Article
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredArticles.map(article => {
                  const author = getAuthor(article.authorId);
                  const category = getCategoryName(article.categoryId);
                  return (
                    <button
                      key={article.id}
                      onClick={() => router.push(`/knowledge-base/${article.id}`)}
                      className="w-full text-left flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-[#C7D2FE] dark:hover:border-indigo-700 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-[#3B5BDB]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#3B5BDB] dark:group-hover:text-indigo-400 transition-colors truncate">
                            {article.title}
                          </h3>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            article.visibility === 'all'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>
                            {article.visibility === 'all' ? 'All Staff' : 'Internal'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {category && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Folder size={10} /> {category}
                            </span>
                          )}
                          {author && (
                            <span className="text-xs text-gray-400">{author.name}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {format(parseISO(article.updatedAt), 'MMM d, yyyy')}
                          </span>
                          {article.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="flex items-center gap-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">
                              <Hash size={8} /> {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(undefined); }}
          onSave={handleCategorySaved}
        />
      )}
    </div>
  );
}
