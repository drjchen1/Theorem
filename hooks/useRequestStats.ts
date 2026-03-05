import { useState, useEffect } from 'react';

export const useRequestStats = () => {
  const [sessionCount, setSessionCount] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('qed_daily_requests');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        setDailyCount(count);
      } else {
        localStorage.setItem('qed_daily_requests', JSON.stringify({ date: today, count: 0 }));
      }
    } else {
      localStorage.setItem('qed_daily_requests', JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  const increment = () => {
    const newDaily = dailyCount + 1;
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('qed_daily_requests', JSON.stringify({ date: today, count: newDaily }));
    setDailyCount(newDaily);
    setSessionCount(prev => prev + 1);
  };

  return { sessionCount, dailyCount, increment };
};
