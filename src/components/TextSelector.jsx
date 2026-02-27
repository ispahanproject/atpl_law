import { useState, useRef, useMemo, useCallback } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { s, colors } from '../styles/theme.js';

export default function TextSelector({ articleId, text, onCreateLink }) {
  const { getLinksForArticle, userData } = useUserDataContext();
  const links = getLinksForArticle(articleId);
  const containerRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');
  const [showLinkBtn, setShowLinkBtn] = useState(false);

  // Build highlighted segments
  const segments = useMemo(() => {
    if (!text) return [{ text: '', isHighlight: false, linkId: null }];

    const highlights = links
      .filter(l => l.highlightedText && text.includes(l.highlightedText))
      .map(l => ({
        start: text.indexOf(l.highlightedText),
        end: text.indexOf(l.highlightedText) + l.highlightedText.length,
        linkId: l.id,
        regId: l.targetRegulationId,
      }))
      .sort((a, b) => a.start - b.start);

    if (highlights.length === 0) {
      return [{ text, isHighlight: false, linkId: null }];
    }

    const result = [];
    let pos = 0;

    for (const hl of highlights) {
      if (hl.start < pos) continue; // skip overlaps
      if (hl.start > pos) {
        result.push({ text: text.slice(pos, hl.start), isHighlight: false, linkId: null });
      }
      result.push({ text: text.slice(hl.start, hl.end), isHighlight: true, linkId: hl.linkId, regId: hl.regId });
      pos = hl.end;
    }
    if (pos < text.length) {
      result.push({ text: text.slice(pos), isHighlight: false, linkId: null });
    }
    return result;
  }, [text, links]);

  const handleSelectionEnd = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 2) {
      // Verify selection is within our container
      if (containerRef.current && containerRef.current.contains(sel.anchorNode)) {
        setSelectedText(sel.toString().trim());
        setShowLinkBtn(true);
      }
    } else {
      // Delay clearing to allow button click
      setTimeout(() => {
        setShowLinkBtn(false);
        setSelectedText('');
      }, 200);
    }
  }, []);

  const handleCreateLink = () => {
    onCreateLink(selectedText);
    setShowLinkBtn(false);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  const getRegName = (regId) => {
    const reg = userData.regulations[regId];
    return reg ? `${reg.category} ${reg.referenceNumber}` : '(削除済み)';
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        onMouseUp={handleSelectionEnd}
        onTouchEnd={handleSelectionEnd}
        style={{
          fontSize: 13, lineHeight: 2.1, color: '#cbd5e1',
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${colors.border}`,
          borderRadius: 10, padding: '14px 16px',
          whiteSpace: 'pre-wrap',
          fontFeatureSettings: '"palt"',
          userSelect: 'text',
          WebkitUserSelect: 'text',
        }}
      >
        {segments.map((seg, i) => (
          seg.isHighlight ? (
            <span key={i} style={s.highlight} title={getRegName(seg.regId)}>
              {seg.text}
            </span>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        ))}
      </div>

      {/* Floating link button */}
      {showLinkBtn && (
        <div style={{
          position: 'sticky', bottom: 80, display: 'flex', justifyContent: 'center',
          marginTop: 8,
        }}>
          <button
            onClick={handleCreateLink}
            style={{
              ...s.btnPrimary,
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 20px rgba(96,165,250,0.3)',
              padding: '10px 20px',
              fontSize: 13,
            }}
          >
            + 規定に紐付ける
          </button>
        </div>
      )}

      {!showLinkBtn && text && (
        <p style={{ fontSize: 11, color: colors.textDim, marginTop: 8, textAlign: 'center' }}>
          テキストを選択して社内規定と紐付け
        </p>
      )}
    </div>
  );
}
