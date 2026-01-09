
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { api } from './services/api';

// Limpa os dados imediatamente ao carregar para garantir o estado zerado solicitado
const performInitialCleanup = async () => {
  const initialized = localStorage.getItem('app_data_cleaned');
  if (!initialized) {
    await api.resetDatabase();
    localStorage.setItem('app_data_cleaned', 'true');
    localStorage.setItem('app_initialized', 'true');
    window.location.reload();
  }
};

performInitialCleanup();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
