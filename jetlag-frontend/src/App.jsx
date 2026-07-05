import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAuth } from './hooks/useAuth';
import { safeStorage } from './utils/safeStorage';
import { useMeridianStream } from './hooks/useMeridianStream';
import { useRuntimeData } from './hooks/useRuntimeData';

const BookExperience = lazy(() => import('./components/BookExperience').then((module) => ({ default: module.BookExperience })));
const LandingHero = lazy(() => import('./components/LandingHero').then((module) => ({ default: module.LandingHero })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));

function RouteFallback() {
  return <div className="route-loading" aria-live="polite">加载中…</div>;
}

function BookRoute({ auth, theme, onThemeToggle }) {
  const runtimeData = useRuntimeData();
  useMeridianStream();

  return (
    <BookExperience
      auth={auth}
      modelName={runtimeData.modelName}
      offlineVisionAvailable={runtimeData.offlineVisionAvailable}
      requireModelEvidence={runtimeData.requireModelEvidence}
      symptomOptions={runtimeData.symptomOptions}
      visionConfigured={runtimeData.visionConfigured}
      theme={theme}
      onThemeToggle={onThemeToggle}
    />
  );
}

export function App() {
  const auth = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(() => safeStorage.getItem('tcm-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    safeStorage.setItem('tcm-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  if (location.pathname === '/login') {
    return (
      <main className="auth-shell">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage auth={auth} />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
      </main>
    );
  }

  if (location.pathname === '/book') {
    return (
      <>
        <Suspense fallback={<RouteFallback />}>
          <BookRoute auth={auth} theme={theme} onThemeToggle={toggleTheme} />
        </Suspense>
        <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingHero theme={theme} onThemeToggle={toggleTheme} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
    </>
  );
}
