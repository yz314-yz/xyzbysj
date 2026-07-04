import { useEffect, useState } from 'react';

import { DEFAULT_MODEL_NAME, fallbackSymptomOptions } from '../constants/app';
import { loadHealth, loadSymptoms } from '../services/api';

export function useRuntimeData() {
  const [symptomOptions, setSymptomOptions] = useState(fallbackSymptomOptions);
  const [modelName, setModelName] = useState(DEFAULT_MODEL_NAME);
  const [visionConfigured, setVisionConfigured] = useState(false);
  const [offlineVisionAvailable, setOfflineVisionAvailable] = useState(false);
  const [requireModelEvidence, setRequireModelEvidence] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRuntimeData() {
      const [symptomsResponse, healthResponse] = await Promise.allSettled([
        loadSymptoms(),
        loadHealth(),
      ]);

      if (cancelled) return;

      if (symptomsResponse.status === 'fulfilled' && Array.isArray(symptomsResponse.value?.data)) {
        const nextOptions = symptomsResponse.value.data
          .filter((item) => item?.id && item?.label)
          .map((item) => ({ id: item.id, label: item.label }));
        if (nextOptions.length) setSymptomOptions(nextOptions);
      }

      if (healthResponse.status === 'fulfilled') {
        setModelName(healthResponse.value.visionModelName || DEFAULT_MODEL_NAME);
        setVisionConfigured(Boolean(healthResponse.value.visionModelReady));
        setOfflineVisionAvailable(Boolean(
          healthResponse.value.offlineEnhancedReady
          ?? healthResponse.value.visionModelReady
        ));
        setRequireModelEvidence(Boolean(healthResponse.value.requireModelEvidence));
      }
    }

    loadRuntimeData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { modelName, offlineVisionAvailable, requireModelEvidence, symptomOptions, visionConfigured };
}

