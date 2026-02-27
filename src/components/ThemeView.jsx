import { useState, useMemo } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { lawData, allArticles } from '../data/lawData.js';
import { s, colors } from '../styles/theme.js';
import BottomSheet from './BottomSheet.jsx';

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
  '#10b981', '#06b6d4', '#ec4899', '#84cc16',
];

let _secCounter = 0;
const tempSecId = () => `sec_${Date.now()}_${++_secCounter}`;

// All article IDs in a theme (direct + sections)
const themeAllIds = (theme) => {
  const ids = new Set(theme.articleIds || []);
  for (const sec of theme.sections || []) {
    for (const id of sec.articleIds) ids.add(id);
  }
  return ids;
};

const themeTotal = (theme) =>
  (theme.articleIds || []).length +
  (theme.sections || []).reduce((n, sec) => n + sec.articleIds.length, 0);

// Shared article row
function ArticleRow({ art, indent, onClick }) {
  return (
    <div
      onClick={() => onClick(art.id)}
      style={{ ...s.listRow, paddingLeft: indent, borderBottom: `1px solid ${colors.border}` }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: art.categoryColor, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 800, color: art.categoryColor, minWidth: 56, flexShrink: 0 }}>{art.article}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{art.title}</span>
      <span style={s.badge(art.categoryColor)}>{art.law}</span>
    </div>
  );
}

export default function ThemeView({ onOpenDetail }) {
  const { userData, addTheme, updateTheme, deleteTheme } = useUserDataContext();
  const themes = Object.values(userData.themes || {});

  const [editingTheme, setEditingTheme] = useState(null);
  const [collapsedThemes, setCollapsedThemes] = useState(new Set());
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);

  const unassigned = useMemo(() => {
    const assigned = new Set();
    for (const theme of themes) for (const id of themeAllIds(theme)) assigned.add(id);
    return allArticles.filter(a => !assigned.has(a.id));
  }, [themes]);

  const toggle = (set, setter, id) => setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleDelete = (id) => {
    if (confirmDelete === id) { deleteTheme(id); setConfirmDelete(null); }
    else { setConfirmDelete(id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: colors.textMuted }}>{themes.length}テーマ ・ {unassigned.length}件 未分類</span>
        <button onClick={() => setEditingTheme('new')} style={{ ...s.btnSmall, color: colors.accent, borderColor: 'rgba(96,165,250,0.3)' }}>+ 新規テーマ</button>
      </div>

      {themes.length === 0 && (
        <div style={s.emptyState}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📂</p>
          <p style={{ marginBottom: 4 }}>テーマを作成して条文を整理しましょう</p>
          <p style={{ fontSize: 11, color: colors.textDim }}>例：「ATPL試験重点」「日常運航」「乗員管理」</p>
          <button onClick={() => setEditingTheme('new')} style={{ ...s.btnPrimary, marginTop: 16, fontSize: 13, padding: '8px 20px' }}>テーマを作成</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {themes.map(theme => {
          const collapsed = collapsedThemes.has(theme.id);
          const directArts = (theme.articleIds || []).map(id => allArticles.find(a => a.id === id)).filter(Boolean);
          const sections = theme.sections || [];
          const total = themeTotal(theme);
          const hasSections = sections.length > 0 && sections.some(sec => sec.articleIds.length > 0 || sec.name);

          return (
            <div key={theme.id} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${theme.color}30`, background: colors.bgCard }}>
              {/* Theme header */}
              <div
                onClick={() => toggle(collapsedThemes, setCollapsedThemes, theme.id)}
                style={{
                  padding: '10px 12px', background: `${theme.color}0a`,
                  borderBottom: !collapsed && total > 0 ? `1px solid ${colors.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 10, color: colors.textDim, transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s', display: 'inline-block' }}>▼</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: theme.color, flex: 1 }}>{theme.name}</span>
                <span style={{ fontSize: 10, color: colors.textDim, marginRight: 4 }}>
                  {hasSections ? `${sections.length}項 ` : ''}{total}件
                </span>
                <button onClick={(e) => { e.stopPropagation(); setEditingTheme(theme); }} style={{ ...s.btnSmall, fontSize: 10, padding: '2px 6px', color: colors.textDim, border: `1px solid ${colors.borderLight}` }}>編集</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(theme.id); }} style={{ ...s.btnSmall, fontSize: 10, padding: '2px 6px', color: confirmDelete === theme.id ? '#ef4444' : colors.textDim, border: confirmDelete === theme.id ? '1px solid #ef444444' : `1px solid ${colors.borderLight}` }}>{confirmDelete === theme.id ? '削除?' : '×'}</button>
              </div>

              {/* Direct articles (テーマ直下) */}
              {!collapsed && directArts.map(art => (
                <ArticleRow key={art.id} art={art} indent={12} onClick={onOpenDetail} />
              ))}

              {/* Sections */}
              {!collapsed && sections.map(sec => {
                const secKey = `${theme.id}_${sec.id}`;
                const secCollapsed = collapsedSections.has(secKey);
                const arts = sec.articleIds.map(id => allArticles.find(a => a.id === id)).filter(Boolean);
                if (!sec.name && arts.length === 0) return null;

                return (
                  <div key={sec.id}>
                    <div
                      onClick={() => toggle(collapsedSections, setCollapsedSections, secKey)}
                      style={{
                        padding: '6px 12px 6px 20px', background: `${theme.color}06`,
                        borderBottom: `1px solid ${colors.border}`,
                        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <span style={{ fontSize: 9, color: colors.textDim, transform: secCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s', display: 'inline-block' }}>▼</span>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: theme.color, opacity: 0.5, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: sec.name ? colors.textSub : colors.textDim, flex: 1 }}>{sec.name || '(名称なし)'}</span>
                      <span style={{ fontSize: 9, color: colors.textDim }}>{arts.length}件</span>
                    </div>
                    {!secCollapsed && arts.map(art => (
                      <ArticleRow key={art.id} art={art} indent={32} onClick={onOpenDetail} />
                    ))}
                    {!secCollapsed && arts.length === 0 && (
                      <div style={{ padding: '8px 12px 8px 32px', fontSize: 10, color: colors.textDim, borderBottom: `1px solid ${colors.border}` }}>条文なし</div>
                    )}
                  </div>
                );
              })}

              {!collapsed && total === 0 && (
                <div style={{ padding: '12px', fontSize: 11, color: colors.textDim, textAlign: 'center' }}>編集から条文を追加してください</div>
              )}
            </div>
          );
        })}

        {/* Unassigned */}
        {themes.length > 0 && unassigned.length > 0 && (
          <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.bgCard }}>
            <div
              onClick={() => toggle(collapsedThemes, setCollapsedThemes, '__unassigned')}
              style={{
                padding: '10px 12px', background: colors.bgPanel,
                borderBottom: !collapsedThemes.has('__unassigned') ? `1px solid ${colors.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 10, color: colors.textDim, transform: collapsedThemes.has('__unassigned') ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s', display: 'inline-block' }}>▼</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.textMuted, flex: 1 }}>未分類</span>
              <span style={{ fontSize: 10, color: colors.textDim }}>{unassigned.length}件</span>
            </div>
            {!collapsedThemes.has('__unassigned') && unassigned.map(art => (
              <ArticleRow key={art.id} art={art} indent={12} onClick={onOpenDetail} />
            ))}
          </div>
        )}
      </div>

      {/* Theme Editor */}
      {editingTheme && (
        <BottomSheet
          title={editingTheme === 'new' ? 'テーマを作成' : 'テーマを編集'}
          onClose={() => setEditingTheme(null)}
          height="85dvh"
        >
          <ThemeEditor
            theme={editingTheme === 'new' ? null : editingTheme}
            onSave={(data) => {
              if (editingTheme === 'new') addTheme(data);
              else updateTheme(editingTheme.id, data);
              setEditingTheme(null);
            }}
            onClose={() => setEditingTheme(null)}
          />
        </BottomSheet>
      )}
    </div>
  );
}

// ===== Theme Editor =====
function ThemeEditor({ theme, onSave, onClose }) {
  const [name, setName] = useState(theme?.name || '');
  const [color, setColor] = useState(theme?.color || PRESET_COLORS[0]);
  const [directIds, setDirectIds] = useState(new Set(theme?.articleIds || []));
  const [sections, setSections] = useState(() => {
    if (theme?.sections?.length) return theme.sections.map(sec => ({ ...sec }));
    return [];
  });
  // 'direct' = テーマ直下, 0..n = section index
  const [activeTarget, setActiveTarget] = useState('direct');
  const [newSecName, setNewSecName] = useState('');
  const [showAddSec, setShowAddSec] = useState(false);

  // Map articleId → 'direct' | section index
  const articleOwner = useMemo(() => {
    const map = {};
    for (const id of directIds) map[id] = 'direct';
    sections.forEach((sec, idx) => {
      for (const id of sec.articleIds) map[id] = idx;
    });
    return map;
  }, [directIds, sections]);

  const totalArticles = directIds.size + sections.reduce((n, sec) => n + sec.articleIds.length, 0);

  const toggleArticle = (articleId) => {
    const owner = articleOwner[articleId];

    if (activeTarget === 'direct') {
      if (owner === 'direct') {
        // Remove from direct
        setDirectIds(prev => { const n = new Set(prev); n.delete(articleId); return n; });
      } else {
        // Remove from section if exists
        if (typeof owner === 'number') {
          setSections(prev => prev.map((sec, i) => i === owner ? { ...sec, articleIds: sec.articleIds.filter(id => id !== articleId) } : sec));
        }
        // Add to direct
        setDirectIds(prev => new Set(prev).add(articleId));
      }
    } else {
      const secIdx = activeTarget;
      if (owner === secIdx) {
        // Remove from this section
        setSections(prev => prev.map((sec, i) => i === secIdx ? { ...sec, articleIds: sec.articleIds.filter(id => id !== articleId) } : sec));
      } else {
        // Remove from wherever it currently is
        if (owner === 'direct') {
          setDirectIds(prev => { const n = new Set(prev); n.delete(articleId); return n; });
        } else if (typeof owner === 'number') {
          setSections(prev => prev.map((sec, i) => i === owner ? { ...sec, articleIds: sec.articleIds.filter(id => id !== articleId) } : sec));
        }
        // Add to this section
        setSections(prev => prev.map((sec, i) => i === secIdx ? { ...sec, articleIds: [...sec.articleIds, articleId] } : sec));
      }
    }
  };

  const addSection = () => {
    if (!newSecName.trim()) return;
    setSections(prev => [...prev, { id: tempSecId(), name: newSecName.trim(), articleIds: [] }]);
    setActiveTarget(sections.length);
    setNewSecName('');
    setShowAddSec(false);
  };

  const removeSection = (idx) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
    setActiveTarget('direct');
  };

  const renameSec = (idx, val) => {
    setSections(prev => prev.map((sec, i) => i === idx ? { ...sec, name: val } : sec));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const cleanSections = sections.filter(sec => sec.name || sec.articleIds.length > 0);
    onSave({
      name: name.trim(),
      color,
      articleIds: [...directIds],
      sections: cleanSections,
    });
  };

  // Helpers for active target label
  const activeLabel = activeTarget === 'direct'
    ? 'テーマ直下'
    : (sections[activeTarget]?.name || `項目${activeTarget + 1}`);

  return (
    <div>
      {/* Name + Color */}
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>テーマ名</label>
        <input style={{ ...s.input, fontSize: 15, padding: '8px 12px' }} placeholder="例：ATPL試験重点" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={s.label}>カラー</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 28, height: 28, borderRadius: '50%', background: c,
              border: color === c ? '2px solid white' : '2px solid transparent',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* Target tabs: テーマ直下 + sections */}
      <div style={{ marginBottom: 10 }}>
        <label style={s.label}>紐付け先</label>
        <div style={{
          display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        }}>
          {/* Direct tab */}
          <button
            onClick={() => setActiveTarget('direct')}
            style={{
              padding: '5px 10px', borderRadius: 6,
              border: `1.5px solid ${activeTarget === 'direct' ? color : colors.borderLight}`,
              background: activeTarget === 'direct' ? `${color}15` : 'transparent',
              color: activeTarget === 'direct' ? color : colors.textMuted,
              fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent', flexShrink: 0,
            }}
          >
            テーマ直下
            <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}>{directIds.size}</span>
          </button>

          {/* Section tabs */}
          {sections.map((sec, idx) => (
            <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <button
                onClick={() => setActiveTarget(idx)}
                style={{
                  padding: '5px 10px',
                  borderRadius: activeTarget === idx ? '6px 0 0 6px' : 6,
                  border: `1.5px solid ${activeTarget === idx ? color : colors.borderLight}`,
                  borderRight: activeTarget === idx ? 'none' : undefined,
                  background: activeTarget === idx ? `${color}15` : 'transparent',
                  color: activeTarget === idx ? color : colors.textMuted,
                  fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent', flexShrink: 0,
                }}
              >
                {sec.name || `項目${idx + 1}`}
                <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}>{sec.articleIds.length}</span>
              </button>
              {activeTarget === idx && (
                <button onClick={() => removeSection(idx)} style={{
                  padding: '5px 6px', borderRadius: '0 6px 6px 0',
                  border: `1.5px solid ${color}`, borderLeft: 'none',
                  background: `${color}15`, color: '#ef4444', fontSize: 10,
                  fontFamily: 'inherit', cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}>×</button>
              )}
            </div>
          ))}

          {/* Add section */}
          {showAddSec ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input style={{ ...s.input, width: 100, fontSize: 11, padding: '5px 8px' }} placeholder="項目名" value={newSecName} onChange={e => setNewSecName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} autoFocus />
              <button onClick={addSection} style={{ ...s.btnSmall, fontSize: 10, padding: '4px 8px', color: colors.accent }}>追加</button>
              <button onClick={() => { setShowAddSec(false); setNewSecName(''); }} style={{ ...s.btnSmall, fontSize: 10, padding: '4px 6px' }}>×</button>
            </div>
          ) : (
            <button onClick={() => setShowAddSec(true)} style={{ ...s.btnSmall, fontSize: 10, padding: '5px 8px', color: colors.accent, borderColor: 'rgba(96,165,250,0.3)', flexShrink: 0 }}>+ 項目</button>
          )}
        </div>
      </div>

      {/* Section name edit (only for sections, not direct) */}
      {typeof activeTarget === 'number' && (
        <div style={{ marginBottom: 8 }}>
          <input style={{ ...s.input, fontSize: 12, padding: '6px 10px' }} placeholder="項目名" value={sections[activeTarget]?.name || ''} onChange={e => renameSec(activeTarget, e.target.value)} />
        </div>
      )}

      {/* Article checklist */}
      <div style={{ marginBottom: 8 }}>
        <label style={s.label}>{activeLabel} に条文を紐付け ({totalArticles}件選択中)</label>
        <div style={{ maxHeight: 260, overflow: 'auto', borderRadius: 8, border: `1px solid ${colors.border}` }}>
          {lawData.categories.map(cat => {
            const isInActive = (id) => {
              const o = articleOwner[id];
              return activeTarget === 'direct' ? o === 'direct' : o === activeTarget;
            };
            const catChecked = cat.articles.filter(a => isInActive(a.id));
            const catAll = cat.articles.every(a => isInActive(a.id));
            const catSome = catChecked.length > 0;

            return (
              <div key={cat.id}>
                <div
                  onClick={() => {
                    if (catAll) {
                      // Deselect all in category
                      cat.articles.forEach(a => { if (isInActive(a.id)) toggleArticle(a.id); });
                    } else {
                      // Select remaining to active target
                      cat.articles.forEach(a => { if (!isInActive(a.id)) toggleArticle(a.id); });
                    }
                  }}
                  style={{
                    padding: '7px 10px', background: `${cat.color}08`,
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 3,
                    border: `2px solid ${catAll ? cat.color : catSome ? cat.color : colors.borderInput}`,
                    background: catAll ? cat.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0,
                  }}>{catAll ? '✓' : catSome ? '−' : ''}</span>
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, flex: 1 }}>{cat.name}</span>
                  <span style={{ fontSize: 10, color: colors.textDim }}>{catChecked.length}/{cat.articles.length}</span>
                </div>

                {cat.articles.map(art => {
                  const owner = articleOwner[art.id];
                  const inActive = isInActive(art.id);
                  const inOther = owner !== undefined && !inActive;
                  const otherLabel = inOther
                    ? (owner === 'direct' ? 'テーマ直下' : (sections[owner]?.name || `項目${owner + 1}`))
                    : '';

                  return (
                    <div
                      key={art.id}
                      onClick={() => toggleArticle(art.id)}
                      style={{
                        padding: '6px 10px 6px 20px', borderBottom: `1px solid ${colors.border}`,
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        background: inActive ? `${color}08` : 'transparent',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: 3,
                        border: `2px solid ${inActive ? color : inOther ? colors.textDim : colors.borderInput}`,
                        background: inActive ? color : inOther ? colors.textDim : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0,
                      }}>{inActive ? '✓' : inOther ? '−' : ''}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, minWidth: 56, flexShrink: 0 }}>{art.article}</span>
                      <span style={{ fontSize: 11, color: colors.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.title}</span>
                      {inOther && <span style={{ fontSize: 9, color: colors.textDim, padding: '1px 4px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>{otherLabel}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={!name.trim()} style={{ ...s.btnPrimary, flex: 1, padding: '10px 16px', opacity: name.trim() ? 1 : 0.4, background: color }}>{theme ? 'テーマを更新' : 'テーマを作成'}</button>
        <button style={{ ...s.btnSecondary, padding: '10px 16px' }} onClick={onClose}>キャンセル</button>
      </div>
    </div>
  );
}
