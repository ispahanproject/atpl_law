import { useState } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { s, colors } from '../styles/theme.js';

export default function LinkList({ articleId, onAddLink }) {
  const { getLinksForArticle, userData, deleteLink } = useUserDataContext();
  const links = getLinksForArticle(articleId);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      deleteLink(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const getReg = (regId) => userData.regulations[regId];

  return (
    <div>
      <div style={s.sectionTitle}>
        <span>紐付け ({links.length}件)</span>
        <button style={s.btnSmall} onClick={onAddLink}>+ 追加</button>
      </div>
      {links.length === 0 ? (
        <p style={{ fontSize: 12, color: colors.textDim, marginBottom: 12 }}>紐付けはまだありません</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {links.map(link => {
            const reg = getReg(link.targetRegulationId);
            return (
              <div key={link.id} style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(96,165,250,0.05)',
                border: '1px solid rgba(96,165,250,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                    background: 'rgba(6,182,212,0.15)', color: '#06b6d4',
                  }}>{reg ? reg.category : '不明'}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors.accent }}>
                    {reg ? `${reg.referenceNumber} ${reg.title}` : '(削除された規定)'}
                  </span>
                </div>
                {link.highlightedText && (
                  <p style={{
                    fontSize: 11, color: colors.textSub, marginBottom: 4,
                    padding: '4px 8px', borderRadius: 4,
                    background: 'rgba(96,165,250,0.08)',
                    borderLeft: '3px solid rgba(96,165,250,0.4)',
                  }}>
                    "{link.highlightedText.length > 60
                      ? link.highlightedText.slice(0, 60) + '...'
                      : link.highlightedText}"
                  </p>
                )}
                {link.note && (
                  <p style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.6 }}>
                    {link.note}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button
                    style={{ ...s.btnSmall, color: confirmDelete === link.id ? '#ef4444' : colors.textDim }}
                    onClick={() => handleDelete(link.id)}
                  >
                    {confirmDelete === link.id ? '本当に削除？' : '削除'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
