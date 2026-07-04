import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { BookExperience } from './components/BookExperience';
import { LandingHero } from './components/LandingHero';
import { useAuth } from './hooks/useAuth';
import { useMeridianStream } from './hooks/useMeridianStream';
import { useRuntimeData } from './hooks/useRuntimeData';
import { LoginPage } from './pages/LoginPage';

export function App() {
  const auth = useAuth();
  const runtimeData = useRuntimeData();
  useMeridianStream();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('tcm-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tcm-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  if (location.pathname === '/login') {
    return (
      <main className="auth-shell">
        <Routes>
          <Route path="/login" element={<LoginPage auth={auth} />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
      </main>
    );
  }

  if (location.pathname === '/book') {
    return (
      <>
        <BookExperience
          auth={auth}
          modelName={runtimeData.modelName}
          offlineVisionAvailable={runtimeData.offlineVisionAvailable}
          requireModelEvidence={runtimeData.requireModelEvidence}
          symptomOptions={runtimeData.symptomOptions}
          visionConfigured={runtimeData.visionConfigured}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
        <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingHero theme={theme} onThemeToggle={toggleTheme} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
    </>
  );
}
