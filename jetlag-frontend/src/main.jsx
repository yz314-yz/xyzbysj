import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ParticlesProvider } from '@tsparticles/react';

import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { particlesInit } from './particlesInit';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ParticlesProvider init={particlesInit}>
          <App />
        </ParticlesProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
