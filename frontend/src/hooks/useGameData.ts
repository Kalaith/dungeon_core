import { useState, useEffect, useCallback } from 'react';
import { 
  getMonsterTypes, 
  fetchGameConstantsData, 
  fetchMonsterList, 
  fetchMonsterSpeciesList 
} from '../api/gameApi';
import type { MonsterType, GameConstants, MonsterList, MonsterSpeciesList } from '../types/game';

interface GameData {
  monsterTypes: { [key: string]: MonsterType };
  gameConstants: GameConstants;
  monsterList: MonsterList;
  monsterSpecies: MonsterSpeciesList;
}

interface UseGameDataReturn {
  data: Partial<GameData>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useGameData = (): UseGameDataReturn => {
  const [data, setData] = useState<Partial<GameData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [monsterTypes, gameConstants, monsterList, monsterSpecies] = await Promise.all([
        getMonsterTypes(),
        fetchGameConstantsData(),
        fetchMonsterList(),
        fetchMonsterSpeciesList()
      ]);

      setData({
        monsterTypes,
        gameConstants: gameConstants || undefined,
        monsterList: (monsterList as unknown) as MonsterList | undefined,
        monsterSpecies: (monsterSpecies as unknown) as MonsterSpeciesList | undefined
      });
    } catch (err) {
      console.error('Error loading game data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

// Hook for specific data types with caching
export const useMonsterTypes = () => {
  const [monsterTypes, setMonsterTypes] = useState<{ [key: string]: MonsterType }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadMonsterTypes = async () => {
      try {
        const types = await getMonsterTypes();
        if (mounted) {
          setMonsterTypes(types);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    loadMonsterTypes();
    
    return () => {
      mounted = false;
    };
  }, []);

  return { monsterTypes, loading, error };
};