import { useEffect } from 'react';
import { s } from '../styles/theme.js';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={s.modal}>
      <div style={s.modalHeader}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#60a5fa',
            fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            padding: '4px 0',
          }}
        >← 戻る</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{title}</span>
        <span style={{ width: 40 }} />
      </div>
      <div style={s.modalBody}>
        {children}
      </div>
    </div>
  );
}
