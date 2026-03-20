import { useState, useCallback } from 'react';
import { getCollections } from '../api';
import type { Collection } from '../types';

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadCollections = useCallback(async () => {
    const data = await getCollections();
    setCollections(data || []);
  }, []);

  const refreshSidebar = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    collections,
    refreshTrigger,
    loadCollections,
    refreshSidebar
  };
};
