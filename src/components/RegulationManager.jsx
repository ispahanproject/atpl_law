import { useState, useMemo } from 'react';
import { useUserDataContext } from '../hooks/useUserData.js';
import { s, colors } from '../styles/theme.js';
import RegulationForm from './RegulationForm.jsx';

export default function RegulationManager() {
  const { userData, getLinksForRegulation, deleteRegulation } = useUserDataContext();
  const regulations = Object.values(userData.regulations);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);  // false | 'new' | regObj
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    let items = regulations;
    if (catFilter) items = items.filter(r => r.category === catFilter);
    if (search) {
      const t = search.toLowerCase();
      items = items.filter(r =>
        r.title.toLowerCase().includes(t) ||
        r.referenceNumber.toLowerCase().includes(t) ||
        r.description.toLowerCase().includes(t)
      );
    }
    return items.sort((a, b) => (a.category + a.referenceNumber).localeCompare(b.category + b.referenceNumber));
  }, [regulations, search, catFilter]);

  const categories = useMemo(() => {
    const cats = new Set(regulations.map(r => r.category));
    return [...cats].sort();
  }, [regulations]);

  const handleDelete = (reg) => {
    const links = getLinksForRegulation(reg.id);
    if (confirmDelete === reg.id) {
      deleteRegulation(reg.id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(reg.id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div style={{ ...s.container, paddingTop: 12, paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: colors.white }}>社内規定</h2>
        <button style={s.btnPrimary} onClick={() => setShowForm('new')}>+ 新規追加</button>
      </div>

      {/* Search & Filter */}
      <input
        style={s.search}
        placeholder="検索..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          onClick={() => setCatFilter('')}
          style={s.catBtn(!catFilter, '#94a3b8')}
        >全て ({regulations.length})</button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(catFilter === cat ? '' : cat)}
            style={s.catBtn(catFilter === cat, '#06b6d4')}
          >{cat}</button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={s.emptyState}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
          <p>社内規定はまだ登録されていません</p>
          <p style={{ marginTop: 4 }}>「+ 新規追加」から登録を始めましょう</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(reg => {
            const links = getLinksForRegulation(reg.id);
            return (
              <div
                key={reg.id}
                style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: colors.bgCard, border: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(6,182,212,0.15)', color: '#06b6d4',
                      }}>{reg.category}</span>
                      {reg.referenceNumber && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: colors.textSub }}>
                          {reg.referenceNumber}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.white, marginBottom: 4 }}>
                      {reg.title}
                    </h3>
                    {reg.description && (
                      <p style={{
                        fontSize: 12, lineHeight: 1.6, color: colors.textMuted,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{reg.description}</p>
                    )}
                    {links.length > 0 && (
                      <span style={{
                        fontSize: 10, color: colors.accent, fontWeight: 600, marginTop: 6, display: 'inline-block',
                      }}>🔗 {links.length}件の紐付け</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={s.btnSmall} onClick={() => setShowForm(reg)}>編集</button>
                  <button
                    style={{
                      ...s.btnSmall,
                      color: confirmDelete === reg.id ? '#ef4444' : colors.textDim,
                      borderColor: confirmDelete === reg.id ? 'rgba(239,68,68,0.3)' : colors.borderLight,
                    }}
                    onClick={() => handleDelete(reg)}
                  >
                    {confirmDelete === reg.id ? `削除する${getLinksForRegulation(reg.id).length > 0 ? `（紐付け${getLinksForRegulation(reg.id).length}件も削除）` : ''}` : '削除'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <RegulationForm
          regulation={showForm === 'new' ? null : showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
