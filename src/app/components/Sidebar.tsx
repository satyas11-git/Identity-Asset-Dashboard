import { NavLink } from 'react-router-dom';
import { Shield, Key, FileKey, ScrollText } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { path: '/certificates', icon: Shield, label: 'Certificates' },
    { path: '/ssh-keys', icon: Key, label: 'SSH Keys' },
    { path: '/code-signing', icon: FileKey, label: 'Code Signing' },
    { path: '/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-950 text-slate-900 dark:text-white min-h-screen flex flex-col border-r border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl text-white">IA</span>
          </div>
          <div>
            <h1 className="text-lg">Identity Asset</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Security Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="mb-4">
          <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2 px-3">Modules</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}