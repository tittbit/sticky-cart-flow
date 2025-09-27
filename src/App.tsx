import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ShopifyProvider } from '@/contexts/ShopifyContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthPage } from '@/components/AuthPage';
import { IntegrationPage } from '@/pages/IntegrationPage';
import Index from './pages/Index';
import { Dashboard } from './pages/Dashboard';
import './index.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ShopifyProvider>
          <SettingsProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/integration" element={<IntegrationPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </SettingsProvider>
        </ShopifyProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;