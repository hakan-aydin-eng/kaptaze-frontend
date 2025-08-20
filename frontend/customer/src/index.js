// KapTaze Customer App - Main Entry Point
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd';
import trTR from 'antd/locale/tr_TR';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import App from './App';
import './index.css';

// Dayjs Türkçe yapılandırması
dayjs.locale('tr');

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 dakika
    },
  },
});

// Ant Design tema yapılandırması
const theme = {
  token: {
    colorPrimary: '#16a34a',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
    },
    Modal: {
      borderRadius: 12,
    },
  },
};

// Root element
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider 
          locale={trTR}
          theme={theme}
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ConfigProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// Service Worker kaydı (PWA için)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW kayıt başarılı: ', registration.scope);
      })
      .catch((registrationError) => {
        console.log('SW kayıt başarısız: ', registrationError);
      });
  });
}

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Web Vitals raporlama
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}