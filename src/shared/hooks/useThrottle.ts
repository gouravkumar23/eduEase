import { useState, useEffect } from 'react';

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setThrottledValue(value), limit);
    return () => clearTimeout(timer);
  }, [value, limit]);

  return throttledValue;
}
