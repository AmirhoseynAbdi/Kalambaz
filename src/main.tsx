import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AdminApp } from './components/Admin/AdminApp.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Non-fatal in environments where service workers are restricted
    });
  });
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function RootRouter() {
  const [adminView, setAdminView] = useState<boolean>(() =>
    typeof window !== 'undefined' ? isAdminPath(window.location.pathname) : false
  );

  useEffect(() => {
    const onPopState = () => {
      const nextIsAdmin = isAdminPath(window.location.pathname);
      setAdminView(nextIsAdmin);
      if (!nextIsAdmin) {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'fa';
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (adminView) {
    return (
      <AdminApp
        onNavigateToGame={() => {
          window.history.pushState({}, '', '/');
          document.documentElement.dir = 'rtl';
          document.documentElement.lang = 'fa';
          setAdminView(false);
        }}
      />
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(<RootRouter />);
