import { useState, useEffect } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { s, colors } from '../styles/theme.js';
import Modal from './Modal.jsx';

const CATEGORIES = [
  'OM Vol.1', 'OM Vol.2', 'OM Vol.3', 'OM Vol.4',
  'OM Supplement', 'AOM', 'Company Order', 'Route Manual', 'その他',
];

export default function RegulationForm({ regulation, onClose, onSaved }) {
  const { addRegulation, updateRegulation } = useUserDataContext();
  const isEdit = !!regulation;

  const [category, setCategory] = useState(regulation?.category || CATEGORIES[0]);
  const [referenceNumber, setReferenceNumber] = useState(regulation?.referenceNumber || '');
  const [title, setTitle] = useState(regulation?.title || '');
  const [description, setDescription] = useState(regulation?.description || '');

  const save = () => {
    if (!title.trim()) return;
    const data = {
      category,
      referenceNumber: referenceNumber.trim(),
      title: title.trim(),
      description: description.trim(),
    };
    if (isEdit) {
      updateRegulation(regulation.id, data);
    } else {
      addRegulation(data);
    }
    onSaved?.();
    onClose();
  };

  return (
    <Modal title={isEdit ? '社内規定を編集' : '社内規定を追加'} onClose={onClose}>
      <div style={s.formGroup}>
        <label style={s.label}>カテゴリ</label>
        <select style={s.select} value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={s.formGroup}>
        <label style={s.label}>参照番号</label>
        <input
          style={s.input}
          value={referenceNumber}
          onChange={e => setReferenceNumber(e.target.value)}
          placeholder="例: 5.7.10, 2-II"
        />
      </div>

      <div style={s.formGroup}>
        <label style={s.label}>タイトル</label>
        <input
          style={s.input}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="規定の名称"
        />
      </div>

      <div style={s.formGroup}>
        <label style={s.label}>説明・内容</label>
        <textarea
          style={s.textarea}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="規定の要約や重要ポイント..."
          rows={6}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button style={s.btnPrimary} onClick={save}>保存</button>
        <button style={s.btnSecondary} onClick={onClose}>キャンセル</button>
      </div>
    </Modal>
  );
}

export { CATEGORIES };
