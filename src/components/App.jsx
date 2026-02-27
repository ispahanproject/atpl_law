import { useState, useMemo, useCallback } from 'react';
import { lawData, allArticles } from '../data/lawData.js';
import { useUserData, UserDataContext } from '../hooks/useUserData.js';
import { exportUserData, importUserData } from '../utils/exportImport.js';
import { s, colors } from '../styles/theme.js';
import BottomNav from './BottomNav.jsx';
import RegulationManager from './RegulationManager.jsx';
import LinkManager from './LinkManager.jsx';
import NoteEditor from './NoteEditor.jsx';
import LinkList from './LinkList.jsx';
import TextSelector from './TextSelector.jsx';
import Modal from './Modal.jsx';
import RegulationForm from './RegulationForm.jsx';

export default function App() {
  const userDataAPI = useUserData();
  const { linkCountByArticle, noteCountByArticle, userData, setFullUserData } = userDataAPI;

  // App state
  const [activeTab, setActiveTab] = useState('articles');
  const [viewMode, setViewMode] = useState('map');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailTab, setDetailTab] = useState('summary');
  const [showCreateLink, setShowCreateLink] = useState(null); // { articleId, text }
  const [showImportExport, setShowImportExport] = useState(false);

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
    setDetailTab('summary');
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

  return (
    <UserDataContext.Provider value={userDataAPI}>
      <div style={s.root}>
        {/* ===== Articles Tab ===== */}
        {activeTab === 'articles' && !selectedArticle && (
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
                    {['map', 'tree'].map(m => (
                      <button key={m} onClick={() => setViewMode(m)} style={{
                        ...s.catBtn(viewMode === m, colors.accent),
                        fontSize: 10, padding: '4px 8px',
                      }}>{m === 'map' ? 'マップ' : 'ツリー'}</button>
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
                    <button
                      style={s.btnSmall}
                      onClick={() => exportUserData(userData)}
                    >📤 エクスポート</button>
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
                  onChange={e => { setSearchTerm(e.target.value); }}
                />
                <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    style={s.catBtn(!selectedCategory, '#94a3b8')}
                  >全て</button>
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
              {/* Map View */}
              {viewMode === 'map' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {filtered.map(art => {
                    const lc = linkCountByArticle[art.id] || 0;
                    const nc = noteCountByArticle[art.id] || 0;
                    return (
                      <div
                        key={art.id}
                        onClick={() => { setSelectedArticle(art.id); setDetailTab('summary'); }}
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
                            {lc > 0 && (
                              <span style={{
                                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                                background: 'rgba(96,165,250,0.12)', color: colors.accent, fontWeight: 700,
                              }}>🔗{lc}</span>
                            )}
                            {nc > 0 && (
                              <span style={{
                                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                                background: 'rgba(167,139,250,0.12)', color: colors.accentPurple, fontWeight: 700,
                              }}>📝{nc}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tree View */}
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
                                  onClick={() => { setSelectedArticle(art.id); setDetailTab('summary'); }}
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
                                    {lc > 0 && (
                                      <span style={{
                                        fontSize: 9, padding: '2px 5px', borderRadius: 3,
                                        background: 'rgba(96,165,250,0.12)', color: colors.accent, fontWeight: 700,
                                      }}>🔗{lc}</span>
                                    )}
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
            </div>
          </>
        )}

        {/* ===== Article Detail (Full Screen) ===== */}
        {activeTab === 'articles' && selectedArt && (
          <div style={{ minHeight: '100dvh', background: colors.bg }}>
            {/* Header */}
            <div style={s.topBar}>
              <div style={s.container}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => setSelectedArticle(null)}
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

            <div style={{ ...s.container, paddingTop: 16, paddingBottom: 20 }}>
              {/* Title area */}
              <div style={{ marginBottom: 16 }}>
                <span style={s.badge(selectedArt.categoryColor)}>{selectedArt.categoryName}</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 8, color: colors.white }}>
                  {selectedArt.article}
                </h2>
                <p style={{ fontSize: 14, fontWeight: 600, color: selectedArt.categoryColor, marginTop: 2 }}>
                  {selectedArt.title}
                </p>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex', gap: 4, marginBottom: 16, padding: 3,
                background: colors.bgPanel, borderRadius: 8,
                border: `1px solid ${colors.border}`, width: 'fit-content',
              }}>
                <button onClick={() => setDetailTab('summary')} style={s.tabBtn(detailTab === 'summary')}>要約</button>
                <button
                  onClick={() => selectedArt.officialText && setDetailTab('official')}
                  style={{
                    ...s.tabBtn(detailTab === 'official'),
                    opacity: selectedArt.officialText ? 1 : 0.35,
                    cursor: selectedArt.officialText ? 'pointer' : 'not-allowed',
                  }}
                >条文</button>
              </div>

              {/* Content */}
              {detailTab === 'summary' ? (
                <p style={{ fontSize: 14, lineHeight: 1.9, color: colors.textSub, marginBottom: 16 }}>
                  {selectedArt.summary}
                </p>
              ) : selectedArt.officialText ? (
                <div style={{ marginBottom: 16 }}>
                  <TextSelector
                    articleId={selectedArt.id}
                    text={selectedArt.officialText}
                    onCreateLink={(text) => setShowCreateLink({ articleId: selectedArt.id, text })}
                  />
                  {selectedArt.eGovUrl && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={selectedArt.eGovUrl}
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
                <p style={{ fontSize: 13, color: colors.textDim, fontStyle: 'italic', marginBottom: 16 }}>
                  e-Gov条文データなし（AIP・社内規定等）
                </p>
              )}

              {/* Keywords */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 20 }}>
                {selectedArt.keywords.map(kw => (
                  <span key={kw} style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 4,
                    background: colors.bgHover, color: '#cbd5e1',
                    border: `1px solid ${colors.borderLight}`,
                  }}>#{kw}</span>
                ))}
              </div>

              {/* Links section */}
              <LinkList
                articleId={selectedArt.id}
                onAddLink={() => setShowCreateLink({ articleId: selectedArt.id, text: '' })}
              />

              {/* Notes section */}
              <NoteEditor articleId={selectedArt.id} />

              {/* Related articles */}
              {related.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={s.sectionTitle}>
                    <span>関連条項 ({related.length}件)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {related.map(r => (
                      <button key={r.id} onClick={() => { setSelectedArticle(r.id); setDetailTab('summary'); }} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                        borderRadius: 8, border: `1px solid ${r.categoryColor}33`,
                        background: `${r.categoryColor}08`, cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'inherit', color: colors.text, fontSize: 12, transition: 'all 0.15s',
                        WebkitTapHighlightColor: 'transparent',
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: r.categoryColor,
                        }} />
                        <span style={{ fontWeight: 700, color: r.categoryColor, minWidth: 80, fontSize: 11 }}>
                          {r.article}
                        </span>
                        <span style={{ color: colors.textSub, flex: 1 }}>{r.title}</span>
                        <span style={{ color: colors.textDim }}>→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Regulations Tab ===== */}
        {activeTab === 'regulations' && <RegulationManager />}

        {/* ===== Links Tab ===== */}
        {activeTab === 'links' && <LinkManager onNavigateToArticle={navigateToArticle} />}

        {/* ===== Create Link Modal ===== */}
        {showCreateLink && (
          <CreateLinkModal
            articleId={showCreateLink.articleId}
            highlightedText={showCreateLink.text}
            onClose={() => setShowCreateLink(null)}
          />
        )}

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'articles') setSelectedArticle(null);
        }} />
      </div>
    </UserDataContext.Provider>
  );
}

// Inline Create Link Modal
function CreateLinkModal({ articleId, highlightedText, onClose }) {
  const { userData, addLink, addRegulation } = useUserData();
  const regulations = Object.values(userData.regulations);
  const article = allArticles.find(a => a.id === articleId);

  const [selectedRegId, setSelectedRegId] = useState('');
  const [note, setNote] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [showNewReg, setShowNewReg] = useState(false);

  const filteredRegs = regulations.filter(r => {
    if (!regSearch) return true;
    const t = regSearch.toLowerCase();
    return r.title.toLowerCase().includes(t) || r.category.toLowerCase().includes(t) || r.referenceNumber.toLowerCase().includes(t);
  });

  const save = () => {
    if (!selectedRegId) return;
    addLink({
      sourceArticleId: articleId,
      highlightedText: highlightedText || '',
      targetRegulationId: selectedRegId,
      note: note.trim(),
    });
    onClose();
  };

  if (showNewReg) {
    return (
      <RegulationForm
        regulation={null}
        onClose={() => setShowNewReg(false)}
        onSaved={() => setShowNewReg(false)}
      />
    );
  }

  return (
    <Modal title="紐付けを作成" onClose={onClose}>
      {/* Source */}
      <div style={s.formGroup}>
        <label style={s.label}>法条項</label>
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: colors.bgCard, border: `1px solid ${colors.border}`,
          fontSize: 13, color: colors.white,
        }}>
          {article ? `${article.law} ${article.article} — ${article.title}` : articleId}
        </div>
      </div>

      {/* Highlighted text */}
      {highlightedText && (
        <div style={s.formGroup}>
          <label style={s.label}>選択テキスト</label>
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'rgba(96,165,250,0.08)',
            border: '1px solid rgba(96,165,250,0.2)',
            borderLeft: '3px solid rgba(96,165,250,0.5)',
            fontSize: 12, color: colors.textSub, lineHeight: 1.7,
          }}>
            {highlightedText}
          </div>
        </div>
      )}

      {/* Target regulation */}
      <div style={s.formGroup}>
        <label style={s.label}>紐付け先の社内規定</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            style={{ ...s.input, flex: 1, marginTop: 0 }}
            placeholder="規定を検索..."
            value={regSearch}
            onChange={e => setRegSearch(e.target.value)}
          />
          <button style={s.btnSmall} onClick={() => setShowNewReg(true)}>+ 新規</button>
        </div>
        <div style={{
          maxHeight: 200, overflow: 'auto', borderRadius: 8,
          border: `1px solid ${colors.border}`,
        }}>
          {filteredRegs.length === 0 ? (
            <p style={{ padding: 12, fontSize: 12, color: colors.textDim, textAlign: 'center' }}>
              規定が見つかりません。「+ 新規」で追加してください
            </p>
          ) : (
            filteredRegs.map(reg => (
              <div
                key={reg.id}
                onClick={() => setSelectedRegId(reg.id)}
                style={{
                  padding: '10px 12px', cursor: 'pointer',
                  background: selectedRegId === reg.id ? 'rgba(96,165,250,0.1)' : 'transparent',
                  borderBottom: `1px solid ${colors.border}`,
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedRegId === reg.id && <span style={{ color: colors.accent }}>✓</span>}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                    background: 'rgba(6,182,212,0.15)', color: '#06b6d4',
                  }}>{reg.category}</span>
                  <span style={{ fontSize: 12, color: colors.white }}>{reg.referenceNumber}</span>
                </div>
                <p style={{ fontSize: 12, color: colors.textSub, marginTop: 2, paddingLeft: selectedRegId === reg.id ? 20 : 0 }}>
                  {reg.title}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note */}
      <div style={s.formGroup}>
        <label style={s.label}>メモ（任意）</label>
        <textarea
          style={s.textarea}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="この紐付けに関するメモ..."
          rows={3}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={{ ...s.btnPrimary, opacity: selectedRegId ? 1 : 0.5 }}
          onClick={save}
          disabled={!selectedRegId}
        >紐付けを保存</button>
        <button style={s.btnSecondary} onClick={onClose}>キャンセル</button>
      </div>
    </Modal>
  );
}
