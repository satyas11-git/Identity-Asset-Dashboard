import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardProvider } from '../contexts/DashboardContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { CertificatesPage } from './pages/CertificatesPage';
import { SSHKeysPage } from './pages/SSHKeysPage';
import { CodeSigningPage } from './pages/CodeSigningPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <BrowserRouter>
      <DashboardProvider>
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <TopNav />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/certificates" replace />} />
                <Route path="/certificates" element={<CertificatesPage />} />
                <Route path="/ssh-keys" element={<SSHKeysPage />} />
                <Route path="/code-signing" element={<CodeSigningPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster />
      </DashboardProvider>
    </BrowserRouter>
  );
}
