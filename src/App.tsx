import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ShopifyProvider } from '@/contexts/ShopifyContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { AuthPage } from '@/components/AuthPage';
import Index from './pages/Index';
import { Dashboard } from './pages/Dashboard';
import './index.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ShopifyProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </SettingsProvider>
      </ShopifyProvider>
    </BrowserRouter>
  );
};

export default App;