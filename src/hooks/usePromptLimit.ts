import { useState, useEffect } from 'react';

const PROMPT_USAGE_KEY = 'mayotti_prompt_usage';

interface PromptUsageData {
  count: number;
  month: number; // 0-11
  year: number;
}

export const MONTHLY_PROMPT_LIMIT = 30;

export const usePromptLimit = () => {
  const [usageData, setUsageData] = useState<PromptUsageData>({
    count: 0,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadUsageData();
    setIsLoading(false);
  }, []);

  const loadUsageData = () => {
    try {
      const stored = localStorage.getItem(PROMPT_USAGE_KEY);
      if (stored) {
        const parsed: PromptUsageData = JSON.parse(stored);
        
        // Check if we're in a new month - if so, reset the count
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        if (parsed.month !== currentMonth || parsed.year !== currentYear) {
          // New month! Reset the counter
          const freshData: PromptUsageData = {
            count: 0,
            month: currentMonth,
            year: currentYear,
          };
          localStorage.setItem(PROMPT_USAGE_KEY, JSON.stringify(freshData));
          setUsageData(freshData);
        } else {
          setUsageData(parsed);
        }
      } else {
        // First time - initialize
        const now = new Date();
        const freshData: PromptUsageData = {
          count: 0,
          month: now.getMonth(),
          year: now.getFullYear(),
        };
        localStorage.setItem(PROMPT_USAGE_KEY, JSON.stringify(freshData));
        setUsageData(freshData);
      }
    } catch (error) {
      console.error('Failed to load prompt usage data:', error);
      // Reset on error
      const now = new Date();
      const freshData: PromptUsageData = {
        count: 0,
        month: now.getMonth(),
        year: now.getFullYear(),
      };
      localStorage.setItem(PROMPT_USAGE_KEY, JSON.stringify(freshData));
      setUsageData(freshData);
    }
  };

  // Increment prompt count
  // Read from localStorage to avoid stale closure issues on rapid calls
  const incrementPromptCount = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let current: PromptUsageData | null = null;
    try {
      const stored = localStorage.getItem(PROMPT_USAGE_KEY);
      if (stored) current = JSON.parse(stored);
    } catch {
      current = null;
    }

    let newData: PromptUsageData;

    // Check if we need to reset for new month
    if (!current || current.month !== currentMonth || current.year !== currentYear) {
      newData = {
        count: 1,
        month: currentMonth,
        year: currentYear,
      };
    } else {
      newData = {
        ...current,
        count: current.count + 1,
      };
    }

    localStorage.setItem(PROMPT_USAGE_KEY, JSON.stringify(newData));
    setUsageData(newData);

    return newData.count;
  };

  // Check if user has reached the limit
  const hasReachedLimit = () => {
    // First check if we're in a new month
    const now = new Date();
    if (usageData.month !== now.getMonth() || usageData.year !== now.getFullYear()) {
      return false; // New month, limit resets
    }
    return usageData.count >= MONTHLY_PROMPT_LIMIT;
  };

  // Get remaining prompts
  const getRemainingPrompts = () => {
    // First check if we're in a new month
    const now = new Date();
    if (usageData.month !== now.getMonth() || usageData.year !== now.getFullYear()) {
      return MONTHLY_PROMPT_LIMIT; // New month, full limit available
    }
    return Math.max(0, MONTHLY_PROMPT_LIMIT - usageData.count);
  };

  // Get usage percentage
  const getUsagePercentage = () => {
    return Math.min(100, (usageData.count / MONTHLY_PROMPT_LIMIT) * 100);
  };

  // Reset usage (for testing)
  const resetUsage = () => {
    const now = new Date();
    const freshData: PromptUsageData = {
      count: 0,
      month: now.getMonth(),
      year: now.getFullYear(),
    };
    localStorage.setItem(PROMPT_USAGE_KEY, JSON.stringify(freshData));
    setUsageData(freshData);
  };

  // Get friendly message when limit is reached
  const getLimitReachedMessage = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return `Hey there! 🌟 You've used all ${MONTHLY_PROMPT_LIMIT} of your AI messages for this month. Don't worry though - your messages will refresh in ${daysUntilReset} day${daysUntilReset === 1 ? '' : 's'} when the new month starts! In the meantime, you can still view your expense history and stats. Thanks for being a Mayotti user! 💚`;
  };

  return {
    usageData,
    isLoading,
    incrementPromptCount,
    hasReachedLimit,
    getRemainingPrompts,
    getUsagePercentage,
    getLimitReachedMessage,
    resetUsage,
  };
};
