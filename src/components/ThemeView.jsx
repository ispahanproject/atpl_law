import { useState, useMemo } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { lawData, allArticles } from '../data/lawData.js';
import { s, colors } from '../styles/theme.js';
import BottomSheet from './BottomSheet.jsx';

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
  '#10b981', '#06b6d4', '#ec4899', '#84cc16',
];

export default function ThemeView({ onOpenDetail }) {
  const { userData, addTheme, updateTheme, deleteTheme } = useUserDataContext();
  const themes = Object.values(userData.themes || {});

  const [editingTheme, setEditingTheme] = useState(null);   // null | 'new' | theme object
  const [collapsedThemes, setCollapsedThemes] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Articles not assigned to any theme
  const unassigned = useMemo(() => {
    const assigned = new Set();
    for (const theme of themes) {
      for (const id of theme.articleIds) assigned.add(id);
    }
    return allArticles.filter(a => !assigned.has(a.id));
  }, [themes]);

  const toggleCollapse = (id) => {
    setCollapsedThemes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      deleteTheme(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div>
      {/* Create button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: colors.textMuted }}>
          {themes.length}テーマ ・ {unassigned.length}件 未分類
        </span>
        <button
          onClick={() => setEditingTheme('new')}
          style={{ ...s.btnSmall, color: colors.accent, borderColor: 'rgba(96,165,250,0.3)' }}
        >+ 新規テーマ</button>
      </div>

      {/* Empty state */}
      {themes.length === 0 && (
        <div style={s.emptyState}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📂</p>
          <p style={{ marginBottom: 4 }}>テーマを作成して条文を整理しましょう</p>
          <p style={{ fontSize: 11, color: colors.textDim }}>
            例：「ATPL試験重点」「日常運航」「乗員管理」
          </p>
          <button
            onClick={() => setEditingTheme('new')}
            style={{ ...s.btnPrimary, marginTop: 16, fontSize: 13, padding: '8px 20px' }}
          >テーマを作成</button>
        </div>
      )}

      {/* Theme boxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {themes.map(theme => {
          const collapsed = collapsedThemes.has(theme.id);
          const articles = theme.articleIds
            .map(id => allArticles.find(a => a.id === id))
            .filter(Boolean);

          return (
            <div key={theme.id} style={{
              borderRadius: 10, overflow: 'hidden',
              border: `1px solid ${theme.color}30`,
              background: colors.bgCard,
            }}>
              {/* Theme header */}
              <div
                onClick={() => toggleCollapse(theme.id)}
                style={{
                  padding: '10px 12px',
                  background: `${theme.color}0a`,
                  borderBottom: !collapsed && articles.length > 0 ? `1px solid ${colors.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{
                  fontSize: 10, color: colors.textDim,
                  transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)',
                  transition: 'transform 0.15s', display: 'inline-block',
                }}>▼</span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: theme.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: theme.color, flex: 1 }}>
                  {theme.name}
                </span>
                <span style={{ fontSize: 10, color: colors.textDim, marginRight: 4 }}>
                  {articles.length}件
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingTheme(theme); }}
                  style={{
                    ...s.btnSmall, fontSize: 10, padding: '2px 6px',
                    color: colors.textDim, border: `1px solid ${colors.borderLight}`,
                  }}
                >編集</button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(theme.id); }}
                  style={{
                    ...s.btnSmall, fontSize: 10, padding: '2px 6px',
                    color: confirmDelete === theme.id ? '#ef4444' : colors.textDim,
                    border: confirmDelete === theme.id ? '1px solid #ef444444' : `1px solid ${colors.borderLight}`,
                  }}
                >{confirmDelete === theme.id ? '削除?' : '×'}</button>
              </div>

              {/* Article list */}
              {!collapsed && articles.length > 0 && articles.map(art => (
                <div
                  key={art.id}
                  onClick={() => onOpenDetail(art.id)}
                  style={{
                    ...s.listRow,
                    borderBottom: `1px solid ${colors.border}`,
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
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1,
                  }}>{art.title}</span>
                  <span style={s.badge(art.categoryColor)}>{art.law}</span>
                </div>
              ))}

              {!collapsed && articles.length === 0 && (
                <div style={{ padding: '12px', fontSize: 11, color: colors.textDim, textAlign: 'center' }}>
                  条文を追加してください
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned box */}
        {themes.length > 0 && unassigned.length > 0 && (
          <div style={{
            borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${colors.border}`,
            background: colors.bgCard,
          }}>
            <div
              onClick={() => toggleCollapse('__unassigned')}
              style={{
                padding: '10px 12px',
                background: colors.bgPanel,
                borderBottom: !collapsedThemes.has('__unassigned') ? `1px solid ${colors.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{
                fontSize: 10, color: colors.textDim,
                transform: collapsedThemes.has('__unassigned') ? 'rotate(-90deg)' : 'rotate(0)',
                transition: 'transform 0.15s', display: 'inline-block',
              }}>▼</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.textMuted, flex: 1 }}>
                未分類
              </span>
              <span style={{ fontSize: 10, color: colors.textDim }}>
                {unassigned.length}件
              </span>
            </div>

            {!collapsedThemes.has('__unassigned') && unassigned.map(art => (
              <div
                key={art.id}
                onClick={() => onOpenDetail(art.id)}
                style={{
                  ...s.listRow,
                  borderBottom: `1px solid ${colors.border}`,
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
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1,
                }}>{art.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme Editor BottomSheet */}
      {editingTheme && (
        <BottomSheet
          title={editingTheme === 'new' ? 'テーマを作成' : 'テーマを編集'}
          onClose={() => setEditingTheme(null)}
          height="80dvh"
        >
          <ThemeEditor
            theme={editingTheme === 'new' ? null : editingTheme}
            onSave={(data) => {
              if (editingTheme === 'new') {
                addTheme(data);
              } else {
                updateTheme(editingTheme.id, data);
              }
              setEditingTheme(null);
            }}
            onClose={() => setEditingTheme(null)}
          />
        </BottomSheet>
      )}
    </div>
  );
}

// ===== Theme Editor (inside BottomSheet) =====
function ThemeEditor({ theme, onSave, onClose }) {
  const [name, setName] = useState(theme?.name || '');
  const [color, setColor] = useState(theme?.color || PRESET_COLORS[0]);
  const [selectedIds, setSelectedIds] = useState(new Set(theme?.articleIds || []));

  const toggleArticle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (catArticles) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      catArticles.forEach(a => next.add(a.id));
      return next;
    });
  };

  const deselectAll = (catArticles) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      catArticles.forEach(a => next.delete(a.id));
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      color,
      articleIds: [...selectedIds],
    });
  };

  return (
    <div>
      {/* Name input */}
      <div style={s.formGroup}>
        <label style={s.label}>テーマ名</label>
        <input
          style={{ ...s.input, fontSize: 15, padding: '10px 14px' }}
          placeholder="例：ATPL試験重点"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      </div>

      {/* Color picker */}
      <div style={s.formGroup}>
        <label style={s.label}>カラー</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: c, border: color === c ? '3px solid white' : '3px solid transparent',
                cursor: 'pointer', flexShrink: 0,
                boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Article checklist */}
      <div style={s.formGroup}>
        <label style={s.label}>条文を選択 ({selectedIds.size}件選択中)</label>
        <div style={{
          maxHeight: 320, overflow: 'auto', borderRadius: 8,
          border: `1px solid ${colors.border}`,
        }}>
          {lawData.categories.map(cat => {
            const allSelected = cat.articles.every(a => selectedIds.has(a.id));
            const someSelected = cat.articles.some(a => selectedIds.has(a.id));
            return (
              <div key={cat.id}>
                {/* Category header with select all */}
                <div
                  onClick={() => {
                    if (allSelected) deselectAll(cat.articles);
                    else selectAll(cat.articles);
                  }}
                  style={{
                    padding: '7px 10px',
                    background: `${cat.color}08`,
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 3,
                    border: `2px solid ${allSelected ? cat.color : someSelected ? cat.color : colors.borderInput}`,
                    background: allSelected ? cat.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0,
                  }}>
                    {allSelected ? '✓' : someSelected ? '−' : ''}
                  </span>
                  <span style={{
                    width: 6, height: 6, borderRadius: 2,
                    background: cat.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, flex: 1 }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: 10, color: colors.textDim }}>
                    {cat.articles.filter(a => selectedIds.has(a.id)).length}/{cat.articles.length}
                  </span>
                </div>

                {/* Articles */}
                {cat.articles.map(art => {
                  const checked = selectedIds.has(art.id);
                  return (
                    <div
                      key={art.id}
                      onClick={() => toggleArticle(art.id)}
                      style={{
                        padding: '6px 10px 6px 20px',
                        borderBottom: `1px solid ${colors.border}`,
                        display: 'flex', alignItems: 'center', gap: 8,
                        cursor: 'pointer', background: checked ? `${color}08` : 'transparent',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: 3,
                        border: `2px solid ${checked ? color : colors.borderInput}`,
                        background: checked ? color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0,
                      }}>
                        {checked ? '✓' : ''}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: cat.color,
                        minWidth: 56, flexShrink: 0,
                      }}>{art.article}</span>
                      <span style={{
                        fontSize: 11, color: colors.text, flex: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{art.title}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          style={{
            ...s.btnPrimary, flex: 1, padding: '10px 16px',
            opacity: name.trim() ? 1 : 0.4,
            background: color,
          }}
        >
          {theme ? 'テーマを更新' : 'テーマを作成'}
        </button>
        <button style={{ ...s.btnSecondary, padding: '10px 16px' }} onClick={onClose}>
          キャンセル
        </button>
      </div>
    </div>
  );
}
