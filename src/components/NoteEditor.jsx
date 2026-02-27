import { useState } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { s, colors } from '../styles/theme.js';
import Modal from './Modal.jsx';

export default function NoteEditor({ articleId, onClose }) {
  const { getNotesForArticle, addNote, updateNote, deleteNote } = useUserDataContext();
  const notes = getNotesForArticle(articleId);
  const [editing, setEditing] = useState(null); // null | 'new' | noteId
  const [content, setContent] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const startNew = () => {
    setEditing('new');
    setContent('');
  };

  const startEdit = (note) => {
    setEditing(note.id);
    setContent(note.content);
  };

  const save = () => {
    if (!content.trim()) return;
    if (editing === 'new') {
      addNote({ articleId, content: content.trim() });
    } else {
      updateNote(editing, { content: content.trim() });
    }
    setEditing(null);
    setContent('');
  };

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      deleteNote(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  if (editing) {
    return (
      <Modal title={editing === 'new' ? 'メモを追加' : 'メモを編集'} onClose={() => setEditing(null)}>
        <div style={s.formGroup}>
          <label style={s.label}>内容</label>
          <textarea
            style={s.textarea}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="メモを入力..."
            autoFocus
            rows={6}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.btnPrimary} onClick={save}>保存</button>
          <button style={s.btnSecondary} onClick={() => setEditing(null)}>キャンセル</button>
        </div>
      </Modal>
    );
  }

  return (
    <div>
      <div style={s.sectionTitle}>
        <span>メモ ({notes.length}件)</span>
        <button style={s.btnSmall} onClick={startNew}>+ 追加</button>
      </div>
      {notes.length === 0 ? (
        <p style={{ fontSize: 12, color: colors.textDim, marginBottom: 12 }}>メモはまだありません</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {notes.map(note => (
            <div key={note.id} style={{
              padding: '10px 14px', borderRadius: 8,
              background: colors.bgCard, border: `1px solid ${colors.border}`,
            }}>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: colors.textSub, whiteSpace: 'pre-wrap' }}>
                {note.content}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button style={s.btnSmall} onClick={() => startEdit(note)}>編集</button>
                <button
                  style={{ ...s.btnSmall, color: confirmDelete === note.id ? '#ef4444' : colors.textDim }}
                  onClick={() => handleDelete(note.id)}
                >
                  {confirmDelete === note.id ? '本当に削除？' : '削除'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
