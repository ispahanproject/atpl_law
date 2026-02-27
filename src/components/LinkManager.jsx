import { useState, useMemo } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { allArticles } from '../data/lawData.js';
import { s, colors } from '../styles/theme.js';

export default function LinkManager({ onNavigateToArticle }) {
  const { userData, linkedRegsByArticle, linksByRegulation, deleteLink } = useUserDataContext();
  const regulations = Object.values(userData.regulations);

  const [subView, setSubView] = useState('byReg');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const searchLower = search.toLowerCase();

  // ===== By Regulation view =====
  const regGroups = useMemo(() => {
    return regulations
      .map(reg => {
        const links = (linksByRegulation[reg.id] || []).map(link => {
          const article = allArticles.find(a => a.id === link.sourceArticleId);
          return { ...link, article };
        }).filter(l => {
          if (!search) return true;
          return (
            l.article?.title?.toLowerCase().includes(searchLower) ||
            l.article?.article?.toLowerCase().includes(searchLower) ||
            l.highlightedText?.toLowerCase().includes(searchLower) ||
            l.note?.toLowerCase().includes(searchLower)
          );
        });
        return { reg, links };
      })
      .filter(g => {
        if (!search) return true;
        if (g.links.length > 0) return true;
        return (
          g.reg.title.toLowerCase().includes(searchLower) ||
          g.reg.category.toLowerCase().includes(searchLower) ||
          g.reg.referenceNumber.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => b.links.length - a.links.length);
  }, [regulations, linksByRegulation, search, searchLower]);

  // ===== By Article view =====
  const artGroups = useMemo(() => {
    return allArticles
      .map(art => {
        const artLinks = Object.values(userData.links).filter(l => l.sourceArticleId === art.id);
        const enrichedLinks = artLinks.map(link => {
          const reg = userData.regulations[link.targetRegulationId];
          return { ...link, reg };
        }).filter(l => {
          if (!search) return true;
          return (
            l.reg?.title?.toLowerCase().includes(searchLower) ||
            l.reg?.category?.toLowerCase().includes(searchLower) ||
            l.highlightedText?.toLowerCase().includes(searchLower) ||
            l.note?.toLowerCase().includes(searchLower)
          );
        });
        return { art, links: enrichedLinks };
      })
      .filter(g => {
        if (!search) return true;
        if (g.links.length > 0) return true;
        return (
          g.art.title.toLowerCase().includes(searchLower) ||
          g.art.article.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => b.links.length - a.links.length);
  }, [userData.links, userData.regulations, search, searchLower]);

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      deleteLink(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const totalLinks = Object.keys(userData.links).length;
  const linkedArticleCount = Object.keys(linkedRegsByArticle).length;
  const totalArticles = allArticles.length;

  return (
    <div style={{ ...s.container, paddingTop: 12, paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: colors.white }}>関係マップ</h2>
        <span style={{ fontSize: 11, color: colors.textMuted }}>
          {totalLinks}件 ・ {linkedArticleCount}/{totalArticles}条文
        </span>
      </div>

      {/* Sub-view toggle */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 10, padding: 3,
        background: colors.bgPanel, borderRadius: 8,
        border: `1px solid ${colors.border}`, width: 'fit-content',
      }}>
        <button onClick={() => setSubView('byReg')} style={s.tabBtn(subView === 'byReg')}>規定別</button>
        <button onClick={() => setSubView('byArt')} style={s.tabBtn(subView === 'byArt')}>条文別</button>
      </div>

      <input
        style={s.search}
        placeholder="検索..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div style={{ marginTop: 12 }}>
        {/* ===== By Regulation ===== */}
        {subView === 'byReg' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {regGroups.length === 0 ? (
              <div style={s.emptyState}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>📋</p>
                <p>規定タブから社内規定を追加し、</p>
                <p style={{ marginTop: 4 }}>法令タブから紐付けを作成してください</p>
              </div>
            ) : (
              regGroups.map(({ reg, links }) => (
                <div key={reg.id} style={{
                  borderRadius: 10, overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                  background: colors.bgCard,
                }}>
                  {/* Regulation header */}
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(6,182,212,0.05)',
                    borderBottom: links.length > 0 ? `1px solid ${colors.border}` : 'none',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={s.regTag}>{reg.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4', flex: 1 }}>
                      {reg.referenceNumber} {reg.title}
                    </span>
                    <span style={{ fontSize: 10, color: colors.textDim }}>
                      {links.length}件
                    </span>
                  </div>

                  {/* Linked articles */}
                  {links.map(link => (
                    <div
                      key={link.id}
                      style={{
                        padding: '8px 12px',
                        borderBottom: `1px solid ${colors.border}`,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: link.article?.categoryColor || colors.textDim, flexShrink: 0,
                      }} />
                      <div
                        onClick={() => link.article && onNavigateToArticle?.(link.article.id)}
                        style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: link.article?.categoryColor || colors.accent,
                          }}>{link.article?.article || '?'}</span>
                          <span style={{ fontSize: 11, color: colors.textSub }}>
                            {link.article?.title || '(不明)'}
                          </span>
                        </div>
                        {link.highlightedText && (
                          <p style={{
                            fontSize: 10, color: colors.textDim, marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            "{link.highlightedText.slice(0, 60)}"
                          </p>
                        )}
                        {link.note && (
                          <p style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
                            💬 {link.note.slice(0, 40)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(link.id)}
                        style={{
                          ...s.btnSmall, fontSize: 10, padding: '2px 6px',
                          color: confirmDelete === link.id ? '#ef4444' : colors.textDim,
                          border: confirmDelete === link.id ? '1px solid #ef444444' : `1px solid ${colors.borderLight}`,
                        }}
                      >{confirmDelete === link.id ? '削除?' : '×'}</button>
                    </div>
                  ))}

                  {links.length === 0 && (
                    <div style={{ padding: '8px 12px', fontSize: 11, color: colors.textDim, textAlign: 'center' }}>
                      紐付けなし
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== By Article ===== */}
        {subView === 'byArt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {artGroups.length === 0 ? (
              <div style={s.emptyState}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>📖</p>
                <p>検索に一致する条文はありません</p>
              </div>
            ) : (
              <div style={{
                borderRadius: 10, overflow: 'hidden',
                border: `1px solid ${colors.border}`,
              }}>
                {artGroups.map(({ art, links }) => (
                  <div key={art.id} style={{
                    borderBottom: `1px solid ${colors.border}`,
                  }}>
                    {/* Article row */}
                    <div
                      onClick={() => onNavigateToArticle?.(art.id)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: links.length > 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: art.categoryColor, flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 11, fontWeight: 800, color: art.categoryColor,
                        minWidth: 56, flexShrink: 0,
                      }}>{art.article}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: colors.text,
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{art.title}</span>
                      {links.length > 0 ? (
                        <span style={s.countBadge(colors.accent)}>{links.length}</span>
                      ) : (
                        <span style={{ fontSize: 9, color: colors.textDim }}>未紐付</span>
                      )}
                    </div>

                    {/* Linked regulations */}
                    {links.length > 0 && (
                      <div style={{ paddingLeft: 32, paddingBottom: 6 }}>
                        {links.map(link => (
                          <div key={link.id} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '3px 0',
                          }}>
                            <span style={{ fontSize: 10, color: colors.textDim }}>→</span>
                            <span style={s.regTag}>{link.reg?.category || '?'}</span>
                            <span style={{ fontSize: 10, color: '#06b6d4' }}>
                              {link.reg ? `${link.reg.referenceNumber} ${link.reg.title}` : '(削除済み)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
