import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage.js';
import { generateId } from '../utils/idgen.js';

export const UserDataContext = createContext(null);
export const useUserDataContext = () => useContext(UserDataContext);

export function useUserData() {
  const [userData, setUserData] = useState(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(userData);
  }, [userData]);

  // Regulations CRUD
  const addRegulation = useCallback((reg) => {
    const id = generateId('reg');
    const now = new Date().toISOString();
    setUserData(prev => ({
      ...prev,
      regulations: {
        ...prev.regulations,
        [id]: { ...reg, id, createdAt: now, updatedAt: now },
      },
    }));
    return id;
  }, []);

  const updateRegulation = useCallback((id, updates) => {
    setUserData(prev => ({
      ...prev,
      regulations: {
        ...prev.regulations,
        [id]: { ...prev.regulations[id], ...updates, updatedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const deleteRegulation = useCallback((id) => {
    setUserData(prev => {
      const { [id]: _, ...rest } = prev.regulations;
      // Also delete links pointing to this regulation
      const links = { ...prev.links };
      for (const [linkId, link] of Object.entries(links)) {
        if (link.targetRegulationId === id) delete links[linkId];
      }
      return { ...prev, regulations: rest, links };
    });
  }, []);

  // Links CRUD
  const addLink = useCallback((link) => {
    const id = generateId('link');
    const now = new Date().toISOString();
    setUserData(prev => ({
      ...prev,
      links: {
        ...prev.links,
        [id]: { ...link, id, createdAt: now, updatedAt: now },
      },
    }));
    return id;
  }, []);

  const updateLink = useCallback((id, updates) => {
    setUserData(prev => ({
      ...prev,
      links: {
        ...prev.links,
        [id]: { ...prev.links[id], ...updates, updatedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const deleteLink = useCallback((id) => {
    setUserData(prev => {
      const { [id]: _, ...rest } = prev.links;
      return { ...prev, links: rest };
    });
  }, []);

  // Notes CRUD
  const addNote = useCallback((note) => {
    const id = generateId('note');
    const now = new Date().toISOString();
    setUserData(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [id]: { ...note, id, createdAt: now, updatedAt: now },
      },
    }));
    return id;
  }, []);

  const updateNote = useCallback((id, updates) => {
    setUserData(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [id]: { ...prev.notes[id], ...updates, updatedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const deleteNote = useCallback((id) => {
    setUserData(prev => {
      const { [id]: _, ...rest } = prev.notes;
      return { ...prev, notes: rest };
    });
  }, []);

  // Derived data
  const getLinksForArticle = useCallback((articleId) => {
    return Object.values(userData.links).filter(l => l.sourceArticleId === articleId);
  }, [userData.links]);

  const getLinksForRegulation = useCallback((regId) => {
    return Object.values(userData.links).filter(l => l.targetRegulationId === regId);
  }, [userData.links]);

  const getNotesForArticle = useCallback((articleId) => {
    return Object.values(userData.notes).filter(n => n.articleId === articleId);
  }, [userData.notes]);

  const linkCountByArticle = useMemo(() => {
    const counts = {};
    for (const link of Object.values(userData.links)) {
      counts[link.sourceArticleId] = (counts[link.sourceArticleId] || 0) + 1;
    }
    return counts;
  }, [userData.links]);

  const noteCountByArticle = useMemo(() => {
    const counts = {};
    for (const note of Object.values(userData.notes)) {
      counts[note.articleId] = (counts[note.articleId] || 0) + 1;
    }
    return counts;
  }, [userData.notes]);

  // Derived: linked regulations per article (for list view badges)
  const linkedRegsByArticle = useMemo(() => {
    const result = {};
    for (const link of Object.values(userData.links)) {
      if (!result[link.sourceArticleId]) result[link.sourceArticleId] = [];
      const reg = userData.regulations[link.targetRegulationId];
      if (reg && !result[link.sourceArticleId].some(r => r.id === reg.id)) {
        result[link.sourceArticleId].push(reg);
      }
    }
    return result;
  }, [userData.links, userData.regulations]);

  // Themes CRUD
  const addTheme = useCallback((theme) => {
    const id = generateId('theme');
    const now = new Date().toISOString();
    setUserData(prev => ({
      ...prev,
      themes: {
        ...prev.themes,
        [id]: { ...theme, id, articleIds: theme.articleIds || [], createdAt: now, updatedAt: now },
      },
    }));
    return id;
  }, []);

  const updateTheme = useCallback((id, updates) => {
    setUserData(prev => ({
      ...prev,
      themes: {
        ...prev.themes,
        [id]: { ...prev.themes[id], ...updates, updatedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const deleteTheme = useCallback((id) => {
    setUserData(prev => {
      const { [id]: _, ...rest } = prev.themes;
      return { ...prev, themes: rest };
    });
  }, []);

  // Derived: themes by article (which themes does each article belong to)
  const themesByArticle = useMemo(() => {
    const result = {};
    for (const theme of Object.values(userData.themes || {})) {
      for (const sec of theme.sections || []) {
        for (const articleId of sec.articleIds) {
          if (!result[articleId]) result[articleId] = [];
          if (!result[articleId].some(t => t.id === theme.id)) {
            result[articleId].push(theme);
          }
        }
      }
    }
    return result;
  }, [userData.themes]);

  // Derived: links grouped by regulation (for relationship view)
  const linksByRegulation = useMemo(() => {
    const result = {};
    for (const link of Object.values(userData.links)) {
      if (!result[link.targetRegulationId]) result[link.targetRegulationId] = [];
      result[link.targetRegulationId].push(link);
    }
    return result;
  }, [userData.links]);

  // Import
  const setFullUserData = useCallback((data) => {
    setUserData(data);
  }, []);

  return {
    userData,
    addRegulation, updateRegulation, deleteRegulation,
    addLink, updateLink, deleteLink,
    addNote, updateNote, deleteNote,
    addTheme, updateTheme, deleteTheme,
    getLinksForArticle, getLinksForRegulation, getNotesForArticle,
    linkCountByArticle, noteCountByArticle,
    linkedRegsByArticle, linksByRegulation,
    themesByArticle,
    setFullUserData,
  };
}
