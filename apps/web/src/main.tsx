import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Fase 5: envolver com QueryClientProvider, BrowserRouter e AuthProvider.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
