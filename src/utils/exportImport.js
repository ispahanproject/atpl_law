import { getDefaultUserData } from './storage.js';

export function exportUserData(userData) {
  const exportData = {
    ...userData,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atpl_law_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importUserData(currentData, importedJson, strategy = 'merge') {
  const imported = JSON.parse(importedJson);
  if (!imported.version) {
    throw new Error('Invalid import file format');
  }

  switch (strategy) {
    case 'replace':
      return { ...imported, exportedAt: null };

    case 'merge': {
      return {
        ...getDefaultUserData(),
        regulations: mergeObjects(currentData.regulations, imported.regulations || {}),
        links: mergeObjects(currentData.links, imported.links || {}),
        notes: mergeObjects(currentData.notes, imported.notes || {}),
      };
    }

    case 'append': {
      const ts = Date.now();
      return {
        ...getDefaultUserData(),
        regulations: { ...currentData.regulations, ...rekey(imported.regulations || {}, 'reg', ts) },
        links: { ...currentData.links, ...rekey(imported.links || {}, 'link', ts) },
        notes: { ...currentData.notes, ...rekey(imported.notes || {}, 'note', ts) },
      };
    }

    default:
      return currentData;
  }
}

function mergeObjects(current, incoming) {
  const result = { ...current };
  for (const [id, item] of Object.entries(incoming)) {
    if (!result[id] || new Date(item.updatedAt) > new Date(result[id].updatedAt)) {
      result[id] = item;
    }
  }
  return result;
}

function rekey(obj, prefix, ts) {
  const result = {};
  let i = 0;
  for (const item of Object.values(obj)) {
    const newId = `${prefix}_${ts}_${i++}`;
    result[newId] = { ...item, id: newId };
  }
  return result;
}
