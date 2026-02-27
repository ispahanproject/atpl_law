import { useState, useMemo } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { allArticles } from '../data/lawData.js';
import { s, colors } from '../styles/theme.js';

export default function LinkManager({ onNavigateToArticle }) {
  const { userData, deleteLink } = useUserDataContext();
  const links = Object.values(userData.links);

  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const enrichedLinks = useMemo(() => {
    return links.map(link => {
      const article = allArticles.find(a => a.id === link.sourceArticleId);
      const reg = userData.regulations[link.targetRegulationId];
      return { ...link, article, reg };
    }).filter(l => {
      if (!search) return true;
      const t = search.toLowerCase();
      return (
        (l.article?.title?.toLowerCase().includes(t)) ||
        (l.article?.article?.toLowerCase().includes(t)) ||
        (l.reg?.title?.toLowerCase().includes(t)) ||
        (l.reg?.category?.toLowerCase().includes(t)) ||
        (l.highlightedText?.toLowerCase().includes(t)) ||
        (l.note?.toLowerCase().includes(t))
      );
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [links, userData.regulations, search]);

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      deleteLink(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div style={{ ...s.container, paddingTop: 12, paddingBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: colors.white }}>紐付け一覧</h2>
        <span style={{ fontSize: 12, color: colors.textMuted }}>{enrichedLinks.length}件</span>
      </div>

      <input
        style={s.search}
        placeholder="検索..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ marginTop: 12 }}>
        {enrichedLinks.length === 0 ? (
          <div style={s.emptyState}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔗</p>
            <p>{search ? '一致する紐付けはありません' : '紐付けはまだありません'}</p>
            <p style={{ marginTop: 4 }}>法令タブから条文を開き、テキストを選択して紐付けを作成できます</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {enrichedLinks.map(link => (
              <div key={link.id} style={{
                padding: '14px 16px', borderRadius: 10,
                background: colors.bgCard, border: `1px solid ${colors.border}`,
              }}>
                {/* Source article */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}
                  onClick={() => link.article && onNavigateToArticle?.(link.article.id)}
                >
                  {link.article && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                      background: `${link.article.categoryColor}25`,
                      color: link.article.categoryColor,
                    }}>{link.article.law}</span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.white }}>
                    {link.article ? `${link.article.article} ${link.article.title}` : link.sourceArticleId}
                  </span>
                </div>

                {/* Arrow + target */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingLeft: 8 }}>
                  <span style={{ color: colors.textDim }}>↓</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                    background: 'rgba(6,182,212,0.15)', color: '#06b6d4',
                  }}>{link.reg?.category || '不明'}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>
                    {link.reg ? `${link.reg.referenceNumber} ${link.reg.title}` : '(削除済み)'}
                  </span>
                </div>

                {/* Highlighted text */}
                {link.highlightedText && (
                  <p style={{
                    fontSize: 11, color: colors.textSub, marginBottom: 4,
                    padding: '4px 8px', borderRadius: 4,
                    background: 'rgba(96,165,250,0.08)',
                    borderLeft: '3px solid rgba(96,165,250,0.3)',
                  }}>
                    "{link.highlightedText.length > 80
                      ? link.highlightedText.slice(0, 80) + '...'
                      : link.highlightedText}"
                  </p>
                )}

                {/* Note */}
                {link.note && (
                  <p style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5, marginTop: 4 }}>
                    {link.note}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    style={{ ...s.btnSmall, color: confirmDelete === link.id ? '#ef4444' : colors.textDim }}
                    onClick={() => handleDelete(link.id)}
                  >
                    {confirmDelete === link.id ? '本当に削除？' : '削除'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
