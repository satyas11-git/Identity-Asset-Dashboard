import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import auditLogsData from '../../data/auditLogs.json';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  email: string;
  actionType: string;
  targetResource: string;
  resourcePath: string;
  metadata: any;
}

const ITEMS_PER_LOAD = 10;

export function AuditLogsPage() {
  const { setCachedData } = useDashboard();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_LOAD);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cached = localStorage.getItem('cache_auditLogs');
      if (cached) {
        const { data } = JSON.parse(cached);
        setLogs(data);
        setLoading(false);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLogs(auditLogsData);
      setCachedData('auditLogs', auditLogsData);
      setLoading(false);
      setError(false);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  const actionTypes = useMemo(() => {
    const types = [...new Set(logs.map(l => l.actionType))];
    return types.sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (filterAction !== 'all') {
      result = result.filter(l => l.actionType === filterAction);
    }

    if (searchTerm) {
      result = result.filter(l =>
        l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.targetResource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.actionType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateRange.from) {
      result = result.filter(l => {
        const logDate = new Date(l.timestamp);
        return logDate >= dateRange.from!;
      });
    }

    if (dateRange.to) {
      result = result.filter(l => {
        const logDate = new Date(l.timestamp);
        return logDate <= dateRange.to!;
      });
    }

    return result;
  }, [logs, filterAction, searchTerm, dateRange]);

  const displayedLogs = filteredLogs.slice(0, displayedCount);

  const loadMore = useCallback(() => {
    if (displayedCount < filteredLogs.length) {
      setDisplayedCount(prev => Math.min(prev + ITEMS_PER_LOAD, filteredLogs.length));
    }
  }, [displayedCount, filteredLogs.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, loading]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      KEY_ROTATED: 'bg-blue-600',
      CERT_UPDATED: 'bg-green-600',
      SSH_LOGIN: 'bg-purple-600',
      CERT_ISSUED: 'bg-teal-600',
      KEY_CREATED: 'bg-green-600',
      CERT_REVOKED: 'bg-red-600',
      KEY_ACCESSED: 'bg-yellow-600',
      CERT_DEPLOYED: 'bg-blue-600',
      CERT_SCANNED: 'bg-gray-600',
      SSH_KEY_DELETED: 'bg-red-600',
      CERT_REQUESTED: 'bg-orange-600',
      POLICY_UPDATED: 'bg-indigo-600',
      AUDIT_EXPORT: 'bg-slate-600',
      CERT_RENEWED: 'bg-green-600',
      KEY_IMPORTED: 'bg-teal-600',
      CERT_VALIDATED: 'bg-green-600',
      ACCESS_REVIEW: 'bg-purple-600',
    };
    
    return (
      <Badge className={colors[action] || 'bg-gray-600'}>
        {action.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (loading && logs.length === 0) return <TableSkeleton rows={10} />;
  if (error) return <ErrorDisplay onRetry={loadData} />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl mb-2">Audit Logs</h1>
        <p className="text-slate-500">Trace all identity-related actions across certificates and keys.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
      >
        <p className="text-sm text-slate-500 mb-2">Log stream</p>
        <p className="text-lg">{filteredLogs.length} actions</p>
        <p className="text-sm text-slate-500 mt-1">
          Real-time view of configuration and access changes across all identity assets.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search actor, resource, metadata..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actionTypes.map(type => (
                <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full md:w-72">
            <Filter className="mr-2 h-4 w-4" />
            Filter by date
          </Button>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          Showing {displayedLogs.length} of {filteredLogs.length} logs
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {displayedLogs.map((log, idx) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              onClick={() => toggleRow(log.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-slate-500">{log.timestamp}</span>
                    {getActionBadge(log.actionType)}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{log.actor}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{log.email}</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {log.targetResource}
                    <span className="font-mono text-xs ml-2 text-slate-400">{log.resourcePath}</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  {expandedRows.has(log.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {expandedRows.has(log.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                >
                  <div className="p-4">
                    <p className="text-xs text-slate-500 mb-2">Metadata - request ID req_{log.id.replace('log-', '')}</p>
                    <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                    <div className="mt-3 flex gap-2">
                      <Button variant="ghost" size="sm">View JSON</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      {displayedCount < filteredLogs.length && (
        <div ref={observerTarget} className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-sm">Loading more logs...</span>
          </div>
        </div>
      )}

      {displayedCount >= filteredLogs.length && filteredLogs.length > 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          All logs loaded
        </div>
      )}
    </div>
  );
}