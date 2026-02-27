import { useState } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { allArticles } from '../data/lawData.js';
import { s, colors } from '../styles/theme.js';

export default function QuickLinkForm({ articleId, highlightedText, onClose, onNewRegulation }) {
  const { userData, addLink } = useUserDataContext();
  const regulations = Object.values(userData.regulations);
  const article = allArticles.find(a => a.id === articleId);

  const [selectedRegId, setSelectedRegId] = useState('');
  const [note, setNote] = useState('');
  const [regSearch, setRegSearch] = useState('');

  const filteredRegs = regulations.filter(r => {
    if (!regSearch) return true;
    const t = regSearch.toLowerCase();
    return r.title.toLowerCase().includes(t) ||
      r.category.toLowerCase().includes(t) ||
      r.referenceNumber.toLowerCase().includes(t);
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

  return (
    <div>
      {/* Article info */}
      <div style={{
        padding: '8px 10px', borderRadius: 8, marginBottom: 12,
        background: colors.bgCard, border: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {article && (
          <span style={{
            ...s.badge(article.categoryColor),
            fontSize: 9, padding: '1px 6px',
          }}>{article.law}</span>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.white }}>
          {article ? `${article.article} ${article.title}` : articleId}
        </span>
      </div>

      {/* Highlighted text preview */}
      {highlightedText && (
        <div style={{
          padding: '6px 10px', borderRadius: 6, marginBottom: 12,
          background: 'rgba(96,165,250,0.08)',
          borderLeft: '3px solid rgba(96,165,250,0.4)',
          fontSize: 11, color: colors.textSub, lineHeight: 1.6,
        }}>
          "{highlightedText.length > 100 ? highlightedText.slice(0, 100) + '...' : highlightedText}"
        </div>
      )}

      {/* Regulation search */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input
          style={{ ...s.input, flex: 1, fontSize: 13, padding: '8px 10px' }}
          placeholder="規定を検索..."
          value={regSearch}
          onChange={e => setRegSearch(e.target.value)}
        />
        {onNewRegulation && (
          <button style={{ ...s.btnSmall, flexShrink: 0 }} onClick={onNewRegulation}>+ 新規</button>
        )}
      </div>

      {/* Regulation list */}
      <div style={{
        maxHeight: 200, overflow: 'auto', borderRadius: 8,
        border: `1px solid ${colors.border}`, marginBottom: 12,
      }}>
        {filteredRegs.length === 0 ? (
          <p style={{ padding: 12, fontSize: 12, color: colors.textDim, textAlign: 'center' }}>
            {regulations.length === 0 ? '規定タブから社内規定を追加してください' : '該当する規定がありません'}
          </p>
        ) : (
          filteredRegs.map(reg => (
            <button
              key={reg.id}
              onClick={() => setSelectedRegId(reg.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 10px', cursor: 'pointer',
                background: selectedRegId === reg.id ? 'rgba(96,165,250,0.1)' : 'transparent',
                border: 'none',
                borderBottom: `1px solid ${colors.border}`,
                fontFamily: 'inherit', color: colors.text,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {selectedRegId === reg.id && <span style={{ color: colors.accent, fontSize: 12 }}>✓</span>}
                <span style={s.regTag}>{reg.category}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.white }}>
                  {reg.referenceNumber}
                </span>
                <span style={{ fontSize: 11, color: colors.textSub, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {reg.title}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Note */}
      <input
        style={{ ...s.input, fontSize: 13, padding: '8px 10px', marginBottom: 12 }}
        placeholder="メモ（任意）"
        value={note}
        onChange={e => setNote(e.target.value)}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={{
            ...s.btnPrimary, flex: 1,
            padding: '10px 16px',
            opacity: selectedRegId ? 1 : 0.4,
          }}
          onClick={save}
          disabled={!selectedRegId}
        >紐付けを保存</button>
        <button style={{ ...s.btnSecondary, padding: '10px 16px' }} onClick={onClose}>
          キャンセル
        </button>
      </div>
    </div>
  );
}
