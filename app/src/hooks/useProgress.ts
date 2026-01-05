import { useState, useEffect, useCallback } from 'react';

interface Progress {
  completedEpisodes: number[];
  currentEpisode: number | null;
  startedAt: string | null;
  lastVisitedAt: string;
}

const STORAGE_KEY = 'postgres-odyssey-progress';

const PART_1_EPISODES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const PART_2_EPISODES = [13, 14, 15];
const TOTAL_EPISODES = 15;

function getInitialProgress(): Progress {
  return {
    completedEpisodes: [],
    currentEpisode: null,
    startedAt: null,
    lastVisitedAt: new Date().toISOString(),
  };
}

function loadProgress(): Progress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return getInitialProgress();
}

function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(getInitialProgress);

  // Load progress on mount
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // Mark episode as completed
  const completeEpisode = useCallback((episodeNumber: number) => {
    setProgress(prev => {
      if (prev.completedEpisodes.includes(episodeNumber)) {
        return prev;
      }

      const updated: Progress = {
        ...prev,
        completedEpisodes: [...prev.completedEpisodes, episodeNumber].sort((a, b) => a - b),
        lastVisitedAt: new Date().toISOString(),
      };

      saveProgress(updated);
      return updated;
    });
  }, []);

  // Set current episode (for "continue where you left off")
  const setCurrentEpisode = useCallback((episodeNumber: number) => {
    setProgress(prev => {
      const updated: Progress = {
        ...prev,
        currentEpisode: episodeNumber,
        startedAt: prev.startedAt || new Date().toISOString(),
        lastVisitedAt: new Date().toISOString(),
      };

      saveProgress(updated);
      return updated;
    });
  }, []);

  // Reset progress
  const resetProgress = useCallback(() => {
    const initial = getInitialProgress();
    setProgress(initial);
    saveProgress(initial);
  }, []);

  // Check if episode is completed
  const isEpisodeCompleted = useCallback((episodeNumber: number) => {
    return progress.completedEpisodes.includes(episodeNumber);
  }, [progress.completedEpisodes]);

  // Calculate progress percentages
  const part1Completed = progress.completedEpisodes.filter(e => PART_1_EPISODES.includes(e)).length;
  const part2Completed = progress.completedEpisodes.filter(e => PART_2_EPISODES.includes(e)).length;
  const totalCompleted = progress.completedEpisodes.length;

  const part1Progress = Math.round((part1Completed / PART_1_EPISODES.length) * 100);
  const part2Progress = Math.round((part2Completed / PART_2_EPISODES.length) * 100);
  const totalProgress = Math.round((totalCompleted / TOTAL_EPISODES) * 100);

  const isPart1Complete = part1Completed === PART_1_EPISODES.length;
  const isPart2Complete = part2Completed === PART_2_EPISODES.length;
  const isAllComplete = totalCompleted === TOTAL_EPISODES;

  // Get next episode to continue
  const getNextEpisode = useCallback(() => {
    for (let i = 1; i <= TOTAL_EPISODES; i++) {
      if (!progress.completedEpisodes.includes(i)) {
        return i;
      }
    }
    return null;
  }, [progress.completedEpisodes]);

  return {
    progress,
    completeEpisode,
    setCurrentEpisode,
    resetProgress,
    isEpisodeCompleted,
    part1Progress,
    part2Progress,
    totalProgress,
    part1Completed,
    part2Completed,
    totalCompleted,
    isPart1Complete,
    isPart2Complete,
    isAllComplete,
    getNextEpisode,
    PART_1_EPISODES,
    PART_2_EPISODES,
    TOTAL_EPISODES,
  };
}
