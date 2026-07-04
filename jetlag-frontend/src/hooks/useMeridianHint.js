import { useEffect, useMemo, useState } from 'react';

import { getMeridian } from '../constants/app';

export function useMeridianHint() {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    function refreshHour() {
      const nextHour = new Date().getHours();
      setHour((current) => (current === nextHour ? current : nextHour));
    }

    refreshHour();
    const timer = window.setInterval(refreshHour, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => getMeridian(hour), [hour]);
}
