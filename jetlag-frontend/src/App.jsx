import { useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { Sidebar } from './components/Sidebar';
import { useAuth } from './hooks/useAuth';
import { useMeridianStream } from './hooks/useMeridianStream';
import { useRuntimeData } from './hooks/useRuntimeData';
import { useSectionObserver } from './hooks/useSectionObserver';
import { AboutPage } from './pages/AboutPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { CoverPage } from './pages/CoverPage';
import { HelpPage } from './pages/HelpPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';

const observedSections = ['collection', 'constitution', 'plan', 'meridian'];

export function App() {
  const auth = useAuth();
  const runtimeData = useRuntimeData();
  useMeridianStream();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSection, setActiveSection } = useSectionObserver(observedSections, 'collection');
  const [theme, setTheme] = useState(() => localStorage.getItem('tcm-theme') || 'light');
  const sectionIds = useMemo(() => new Set(observedSections), []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tcm-theme', theme);
  }, [theme]);

  function goToSection(id) {
    if (!sectionIds.has(id)) return;
    if (location.pathname !== '/collection' && location.pathname !== '/') {
      navigate('/collection');
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveSection(id);
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

  return (
    <main className="shell">
      <Sidebar
        activeSection={activeSection}
        auth={auth}
        onSectionClick={goToSection}
        onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        theme={theme}
      />
      <section className="workspace">
        <Routes>
          <Route path="/" element={<CoverPage theme={theme} />} />
          <Route path="/collection" element={<AssessmentPage auth={auth} {...runtimeData} />} />
          <Route path="/history" element={<HistoryPage auth={auth} />} />
          <Route path="/login" element={<LoginPage auth={auth} />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </section>
      <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
    </main>
  );
}
