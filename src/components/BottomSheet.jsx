import { useEffect } from 'react';
import { colors } from '../styles/theme.js';

export default function BottomSheet({ title, onClose, children, height = '70dvh' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 39,
          WebkitTapHighlightColor: 'transparent',
        }}
      />
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        maxHeight: height,
        background: 'rgba(15,20,35,0.98)',
        borderRadius: '16px 16px 0 0',
        border: `1px solid ${colors.borderLight}`,
        borderBottom: 'none',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Drag handle */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '10px 0 4px',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: colors.textDim,
          }} />
        </div>

        {/* Title */}
        {title && (
          <div style={{
            padding: '4px 16px 10px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: colors.white }}>{title}</span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none',
                color: colors.textMuted, fontSize: 20,
                cursor: 'pointer', padding: '0 4px',
                fontFamily: 'inherit',
              }}
            >×</button>
          </div>
        )}

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
        }}>
          {children}
        </div>
      </div>
    </>
  );
}
