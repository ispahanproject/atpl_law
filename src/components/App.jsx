import { useState, useMemo, useCallback } from 'react';
import { lawData, allArticles } from '../data/lawData.js';
import { useUserData, UserDataContext } from '../hooks/useUserData.js';
import { exportUserData, importUserData } from '../utils/exportImport.js';
import { s, colors } from '../styles/theme.js';
import BottomNav from './BottomNav.jsx';
import BottomSheet from './BottomSheet.jsx';
import QuickLinkForm from './QuickLinkForm.jsx';
import RegulationManager from './RegulationManager.jsx';
import LinkManager from './LinkManager.jsx';
import NoteEditor from './NoteEditor.jsx';
import LinkList from './LinkList.jsx';
import TextSelector from './TextSelector.jsx';
import Modal from './Modal.jsx';
import RegulationForm from './RegulationForm.jsx';
import GraphView from './GraphView.jsx';

export default function App() {
  const userDataAPI = useUserData();
  const { linkCountByArticle, noteCountByArticle, linkedRegsByArticle, userData, setFullUserData } = userDataAPI;

  // App state
  const [activeTab, setActiveTab] = useState('articles');
  const [viewMode, setViewMode] = useState('list');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailTab, setDetailTab] = useState('summary');
  const [showCreateLink, setShowCreateLink] = useState(null);
  const [quickLinkArticle, setQuickLinkArticle] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  // Filtering
  const filtered = useMemo(() => {
    let items = allArticles;
    if (selectedCategory) items = items.filter(a => a.categoryId === selectedCategory);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      items = items.filter(a =>
        a.title.toLowerCase().includes(t) ||
        a.article.toLowerCase().includes(t) ||
        a.summary.toLowerCase().includes(t) ||
        a.keywords.some(k => k.toLowerCase().includes(t)) ||
        (a.officialText && a.officialText.toLowerCase().includes(t))
      );
    }
    return items;
  }, [selectedCategory, searchTerm]);

  // Related articles
  const related = useMemo(() => {
    if (!selectedArticle) return [];
    const art = allArticles.find(a => a.id === selectedArticle);
    if (!art) return [];
    const relatedIds = new Set(art.relatedTo || []);
    allArticles.filter(a => a.relatedTo?.includes(selectedArticle)).forEach(a => relatedIds.add(a.id));
    return allArticles.filter(a => relatedIds.has(a.id));
  }, [selectedArticle]);

  const selectedArt = allArticles.find(a => a.id === selectedArticle);

  const navigateToArticle = useCallback((id) => {
    setActiveTab('articles');
    setSelectedArticle(id);
    setDetailExpanded(false);
    setDetailTab('summary');
  }, []);

  const openDetail = useCallback((id) => {
    setSelectedArticle(id);
    setDetailExpanded(false);
    setDetailTab('summary');
  }, []);

  const toggleCategory = useCallback((catId) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  // Import handler
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = importUserData(userData, ev.target.result, 'merge');
        setFullUserData(imported);
        alert('インポート完了');
      } catch (err) {
        alert('インポートエラー: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Render regulation badges for an article
  const renderRegBadges = (articleId) => {
    const regs = linkedRegsByArticle[articleId] || [];
    if (regs.length === 0) return null;
    const show = regs.slice(0, 2);
    const extra = regs.length - 2;
    return (
      <>
        {show.map(r => (
          <span key={r.id} style={s.regTag}>
            {r.category.length > 6 ? r.category.slice(0, 6) : r.category}
          </span>
        ))}
        {extra > 0 && <span style={{ ...s.regTag, background: 'rgba(6,182,212,0.06)' }}>+{extra}</span>}
      </>
    );
  };

  return (
    <UserDataContext.Provider value={userDataAPI}>
      <div style={s.root}>
        {/* ===== Articles Tab ===== */}
        {activeTab === 'articles' && (
          <>
            <div style={s.topBar}>
              <div style={s.container}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={s.h1}>航空法 知識整理ツール</h1>
                    <p style={{ fontSize: 10, color: colors.textMuted, letterSpacing: '0.08em' }}>
                      法令 × 社内規定 紐付けマップ
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {['list', 'map', 'tree', 'graph'].map(m => (
                      <button key={m} onClick={() => setViewMode(m)} style={{
                        ...s.catBtn(viewMode === m, colors.accent),
                        fontSize: 10, padding: '4px 8px',
                      }}>{({ list: 'リスト', map: 'マップ', tree: 'ツリー', graph: 'グラフ' })[m]}</button>
                    ))}
                    <button
                      onClick={() => setShowImportExport(!showImportExport)}
                      style={{ ...s.catBtn(false, colors.textMuted), fontSize: 10, padding: '4px 8px' }}
                    >⚙</button>
                  </div>
                </div>

                {showImportExport && (
                  <div style={{
                    display: 'flex', gap: 8, marginTop: 8, padding: '8px 0',
                    borderTop: `1px solid ${colors.border}`,
                  }}>
                    <button style={s.btnSmall} onClick={() => exportUserData(userData)}>📤 エクスポート</button>
                    <label style={{ ...s.btnSmall, display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                      📥 インポート
                      <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}

                <input
                  style={s.search}
                  placeholder="条文番号・キーワードで検索"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setSelectedCategory(null)} style={s.catBtn(!selectedCategory, '#94a3b8')}>全て</button>
                  {lawData.categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                      style={s.catBtn(selectedCategory === c.id, c.color)}
                    >{c.name}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ ...s.container, paddingTop: 12, paddingBottom: 20 }}>
              {/* ===== List View (Default) ===== */}
              {viewMode === 'list' && (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                  {lawData.categories
                    .filter(c => !selectedCategory || c.id === selectedCategory)
                    .map(cat => {
                      const arts = cat.articles.filter(a => filtered.some(f => f.id === a.id));
                      if (!arts.length) return null;
                      const collapsed = collapsedCategories.has(cat.id);
                      return (
                        <div key={cat.id}>
                          {/* Category header */}
                          <div
                            onClick={() => toggleCategory(cat.id)}
                            style={s.listCategoryHeader(cat.color)}
                          >
                            <span style={{
                              fontSize: 10, color: colors.textDim,
                              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)',
                              transition: 'transform 0.15s',
                              display: 'inline-block',
                            }}>▼</span>
                            <span style={{
                              width: 8, height: 8, borderRadius: 2,
                              background: cat.color, flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: cat.color, flex: 1 }}>
                              {cat.name}
                            </span>
                            <span style={{ fontSize: 10, color: colors.textDim }}>{arts.length}</span>
                          </div>

                          {/* Article rows */}
                          {!collapsed && arts.map(art => {
                            const lc = linkCountByArticle[art.id] || 0;
                            const nc = noteCountByArticle[art.id] || 0;
                            return (
                              <div key={art.id} style={s.listRow}>
                                {/* Article info - clickable area */}
                                <div
                                  onClick={() => openDetail(art.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}
                                >
                                  <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: cat.color, flexShrink: 0,
                                  }} />
                                  <span style={{
                                    fontSize: 12, fontWeight: 800, color: cat.color,
                                    minWidth: 56, flexShrink: 0,
                                  }}>{art.article}</span>
                                  <span style={{
                                    fontSize: 12, fontWeight: 600, color: colors.text,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    flex: 1,
                                  }}>{art.title}</span>
                                </div>

                                {/* Badges area */}
                                <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                                  {renderRegBadges(art.id)}
                                  {lc > 0 && <span style={s.countBadge(colors.accent)}>🔗{lc}</span>}
                                  {nc > 0 && <span style={s.countBadge(colors.accentPurple)}>📝{nc}</span>}
                                </div>

                                {/* Quick link button */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setQuickLinkArticle(art.id); }}
                                  style={{
                                    width: 28, height: 28, borderRadius: 6,
                                    border: `1px solid ${colors.borderLight}`,
                                    background: 'transparent', color: colors.textMuted,
                                    fontSize: 14, cursor: 'pointer', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'inherit',
                                    WebkitTapHighlightColor: 'transparent',
                                  }}
                                >+</button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ===== Map View ===== */}
              {viewMode === 'map' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {filtered.map(art => {
                    const lc = linkCountByArticle[art.id] || 0;
                    const nc = noteCountByArticle[art.id] || 0;
                    return (
                      <div
                        key={art.id}
                        onClick={() => openDetail(art.id)}
                        style={s.card(false, false, art.categoryColor)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                          <span style={s.badge(art.categoryColor)}>{art.law}</span>
                          {art.officialText && (
                            <span style={{
                              fontSize: 8, padding: '1px 4px', borderRadius: 3,
                              background: 'rgba(96,165,250,0.12)', color: colors.accent, fontWeight: 700,
                            }}>条文</span>
                          )}
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: colors.white, marginBottom: 2 }}>
                          {art.article}
                        </h3>
                        <p style={{ fontSize: 12, fontWeight: 600, color: art.categoryColor, marginBottom: 6 }}>
                          {art.title}
                        </p>
                        <p style={{
                          fontSize: 11, lineHeight: 1.6, color: colors.textMuted,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{art.summary}</p>
                        {(lc > 0 || nc > 0) && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            {lc > 0 && <span style={s.countBadge(colors.accent)}>🔗{lc}</span>}
                            {nc > 0 && <span style={s.countBadge(colors.accentPurple)}>📝{nc}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ===== Tree View ===== */}
              {viewMode === 'tree' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {lawData.categories
                    .filter(c => !selectedCategory || c.id === selectedCategory)
                    .map(cat => {
                      const arts = cat.articles.filter(a => filtered.some(f => f.id === a.id));
                      if (!arts.length) return null;
                      return (
                        <div key={cat.id}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                            paddingBottom: 6, borderBottom: `2px solid ${cat.color}33`,
                          }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color }} />
                            <h2 style={{ fontSize: 14, fontWeight: 800, color: cat.color }}>{cat.name}</h2>
                            <span style={{ fontSize: 11, color: colors.textDim }}>({arts.length})</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12, borderLeft: `2px solid ${cat.color}22` }}>
                            {arts.map(art => {
                              const lc = linkCountByArticle[art.id] || 0;
                              return (
                                <div
                                  key={art.id}
                                  onClick={() => openDetail(art.id)}
                                  style={{
                                    padding: '10px 14px', borderRadius: 8,
                                    background: colors.bgCard, border: `1px solid ${colors.border}`,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: cat.color, minWidth: 80 }}>
                                      {art.article}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.text, flex: 1 }}>
                                      {art.title}
                                    </span>
                                    {lc > 0 && <span style={s.countBadge(colors.accent)}>🔗{lc}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ===== Graph View ===== */}
              {viewMode === 'graph' && (
                <GraphView
                  onSelectArticle={(id) => setSelectedArticle(id)}
                  onOpenDetail={openDetail}
                />
              )}
            </div>
          </>
        )}

        {/* ===== Article Detail BottomSheet ===== */}
        {selectedArt && !detailExpanded && (
          <BottomSheet
            title={`${selectedArt.law} ${selectedArt.article}`}
            onClose={() => setSelectedArticle(null)}
            height="75dvh"
          >
            <ArticleDetailContent
              art={selectedArt}
              detailTab={detailTab}
              setDetailTab={setDetailTab}
              related={related}
              onExpand={() => setDetailExpanded(true)}
              onNavigate={(id) => { setSelectedArticle(id); setDetailTab('summary'); }}
              onCreateLink={(text) => setShowCreateLink({ articleId: selectedArt.id, text })}
              onAddLink={() => setShowCreateLink({ articleId: selectedArt.id, text: '' })}
            />
          </BottomSheet>
        )}

        {/* ===== Article Detail Full Screen (expanded) ===== */}
        {selectedArt && detailExpanded && (
          <div style={{ position: 'fixed', inset: 0, background: colors.bg, zIndex: 35, overflow: 'auto' }}>
            <div style={s.topBar}>
              <div style={s.container}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => setDetailExpanded(false)}
                    style={{
                      background: 'none', border: 'none', color: colors.accent,
                      fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                      padding: '4px 0',
                    }}
                  >← 戻る</button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.white }}>
                    {selectedArt.law} {selectedArt.article}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ ...s.container, paddingTop: 16, paddingBottom: 80 }}>
              <ArticleDetailContent
                art={selectedArt}
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                related={related}
                expanded={true}
                onClose={() => { setSelectedArticle(null); setDetailExpanded(false); }}
                onNavigate={(id) => { setSelectedArticle(id); setDetailTab('summary'); }}
                onCreateLink={(text) => setShowCreateLink({ articleId: selectedArt.id, text })}
                onAddLink={() => setShowCreateLink({ articleId: selectedArt.id, text: '' })}
              />
            </div>
          </div>
        )}

        {/* ===== Regulations Tab ===== */}
        {activeTab === 'regulations' && <RegulationManager />}

        {/* ===== Links / Relationship Tab ===== */}
        {activeTab === 'links' && <LinkManager onNavigateToArticle={navigateToArticle} />}

        {/* ===== Quick Link BottomSheet ===== */}
        {quickLinkArticle && (
          <BottomSheet
            title="紐付けを追加"
            onClose={() => setQuickLinkArticle(null)}
            height="65dvh"
          >
            <QuickLinkForm
              articleId={quickLinkArticle}
              onClose={() => setQuickLinkArticle(null)}
              onNewRegulation={() => {
                setQuickLinkArticle(null);
                setActiveTab('regulations');
              }}
            />
          </BottomSheet>
        )}

        {/* ===== Create Link BottomSheet (from detail view) ===== */}
        {showCreateLink && (
          <BottomSheet
            title="紐付けを作成"
            onClose={() => setShowCreateLink(null)}
            height="70dvh"
          >
            <QuickLinkForm
              articleId={showCreateLink.articleId}
              highlightedText={showCreateLink.text}
              onClose={() => setShowCreateLink(null)}
              onNewRegulation={() => {
                setShowCreateLink(null);
                setActiveTab('regulations');
              }}
            />
          </BottomSheet>
        )}

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'articles') {
            setSelectedArticle(null);
            setDetailExpanded(false);
          }
        }} />
      </div>
    </UserDataContext.Provider>
  );
}

// ===== Article Detail Content (shared between BottomSheet and full screen) =====
function ArticleDetailContent({
  art, detailTab, setDetailTab, related,
  expanded, onExpand, onClose, onNavigate, onCreateLink, onAddLink,
}) {
  return (
    <>
      {/* Title area */}
      <div style={{ marginBottom: 12 }}>
        <span style={s.badge(art.categoryColor)}>{art.categoryName}</span>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginTop: 6, color: colors.white }}>
          {art.article}
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: art.categoryColor, marginTop: 2 }}>
          {art.title}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 14, padding: 3,
        background: colors.bgPanel, borderRadius: 8,
        border: `1px solid ${colors.border}`, width: 'fit-content',
      }}>
        <button onClick={() => setDetailTab('summary')} style={s.tabBtn(detailTab === 'summary')}>要約</button>
        <button
          onClick={() => art.officialText && setDetailTab('official')}
          style={{
            ...s.tabBtn(detailTab === 'official'),
            opacity: art.officialText ? 1 : 0.35,
            cursor: art.officialText ? 'pointer' : 'not-allowed',
          }}
        >条文</button>
      </div>

      {/* Content */}
      {detailTab === 'summary' ? (
        <p style={{ fontSize: 13, lineHeight: 1.9, color: colors.textSub, marginBottom: 14 }}>
          {art.summary}
        </p>
      ) : art.officialText ? (
        <div style={{ marginBottom: 14 }}>
          {expanded ? (
            <TextSelector
              articleId={art.id}
              text={art.officialText}
              onCreateLink={onCreateLink}
            />
          ) : (
            <div>
              <p style={{
                fontSize: 12, lineHeight: 1.8, color: colors.textSub,
                maxHeight: 120, overflow: 'hidden',
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              }}>
                {art.officialText}
              </p>
              {onExpand && (
                <button
                  onClick={onExpand}
                  style={{
                    ...s.btnSmall, marginTop: 8, width: '100%',
                    padding: '8px 12px', textAlign: 'center',
                    color: colors.accent, borderColor: 'rgba(96,165,250,0.3)',
                  }}
                >条文全文を表示してテキスト選択 →</button>
              )}
            </div>
          )}
          {art.eGovUrl && (
            <div style={{ marginTop: 8 }}>
              <a
                href={art.eGovUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 10, color: colors.accent, textDecoration: 'none',
                  padding: '2px 8px', borderRadius: 4,
                  border: '1px solid rgba(96,165,250,0.3)',
                  background: 'rgba(96,165,250,0.08)',
                }}
              >e-Govで確認 →</a>
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: colors.textDim, fontStyle: 'italic', marginBottom: 14 }}>
          e-Gov条文データなし（AIP・社内規定等）
        </p>
      )}

      {/* Keywords */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
        {art.keywords.map(kw => (
          <span key={kw} style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 4,
            background: colors.bgHover, color: '#cbd5e1',
            border: `1px solid ${colors.borderLight}`,
          }}>#{kw}</span>
        ))}
      </div>

      {/* Links section */}
      <LinkList articleId={art.id} onAddLink={onAddLink} />

      {/* Notes section */}
      <NoteEditor articleId={art.id} />

      {/* Related articles */}
      {related.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={s.sectionTitle}>
            <span>関連条項 ({related.length}件)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {related.map(r => (
              <button key={r.id} onClick={() => onNavigate(r.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                borderRadius: 8, border: `1px solid ${r.categoryColor}33`,
                background: `${r.categoryColor}08`, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', color: colors.text, fontSize: 11,
                WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: r.categoryColor,
                }} />
                <span style={{ fontWeight: 700, color: r.categoryColor, minWidth: 64, fontSize: 11 }}>
                  {r.article}
                </span>
                <span style={{ color: colors.textSub, flex: 1 }}>{r.title}</span>
                <span style={{ color: colors.textDim }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
