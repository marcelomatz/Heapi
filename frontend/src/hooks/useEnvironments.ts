import { useState, useEffect, useCallback } from 'react';
import { getEnvironments } from '../api';
import type { Environment } from '../types';

export const useEnvironments = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);

  const loadEnvironments = useCallback(async () => {
    const data = await getEnvironments();
    setEnvironments(data || []);
  }, []);

  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  return {
    environments,
    selectedEnvId,
    setSelectedEnvId,
    loadEnvironments,
    activeEnv: environments.find(e => e.ID === selectedEnvId) || null
  };
};
