import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// BUILD VERSION: v4.4 - WORKSPACE OPTIMIZATION
// Limpeza agressiva de Service Workers e Cache antes de renderizar
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('SW Unregistered');
        // Se desregistrou agora, limpa o cache e recarrega
        caches.keys().then((names) => {
          for (const name of names) caches.delete(name);
        });
      });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
