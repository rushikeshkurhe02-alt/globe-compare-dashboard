import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { ToastContainer } from './components/ui/Toast';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ScrollProgressBar } from './components/common/ScrollProgressBar';
import Home from './pages/Home';

// Code-split Compare, Match, and Saved pages for optimal bundle performance
const Compare = lazy(() => import('./pages/Compare'));
const Match = lazy(() => import('./pages/Match'));
const Saved = lazy(() => import('./pages/Saved'));

// QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-10 h-10 border-3 border-brand-indigo border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-text-muted font-medium">Loading view...</span>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-[100dvh] flex flex-col bg-bg-main text-text-primary selection:bg-brand-indigo/30 transition-colors">
            <ScrollProgressBar />
            <OfflineBanner />
            <Navbar />

            <div className="flex-1 flex flex-col">
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/match" element={<Match />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/saved" element={<Saved />} />
                    {/* Catch-all to redirect home */}
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </div>

            <Footer />
            <MobileTabBar />
            <ToastContainer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
