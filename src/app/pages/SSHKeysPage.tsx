import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, ChevronUp, Server, Eye, Edit, Bookmark, Download } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import sshKeysData from '../../data/sshKeys.json';

interface SSHKey {
  id: string;
  keyOwner: string;
  fingerprint: string;
  lastUsed: string;
  trustLevel: 'high' | 'medium' | 'low';
  algorithm: string;
  createdAt: string;
  associatedServers: string[];
}

export function SSHKeysPage() {
  const { setCachedData } = useDashboard();
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trustLevel');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cached = localStorage.getItem('cache_sshKeys');
      if (cached) {
        const { data } = JSON.parse(cached);
        setKeys(data);
        setLoading(false);
      }

      await new Promise(resolve => setTimeout(resolve, 600));
      
      setKeys(sshKeysData);
      setCachedData('sshKeys', sshKeysData);
      setLoading(false);
      setError(false);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

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

  const getTrustLevelBadge = (level: string) => {
    const colors = {
      high: 'bg-green-600',
      medium: 'bg-yellow-600',
      low: 'bg-red-600',
    };
    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const getTrustLevelValue = (level: string) => {
    const values = { high: 3, medium: 2, low: 1 };
    return values[level as keyof typeof values];
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...keys];

    if (debouncedSearch) {
      result = result.filter(k => 
        k.keyOwner.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        k.fingerprint.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'trustLevel') {
        return getTrustLevelValue(b.trustLevel) - getTrustLevelValue(a.trustLevel);
      }
      return a.keyOwner.localeCompare(b.keyOwner);
    });

    return result;
  }, [keys, debouncedSearch, sortBy]);

  const exportToCSV = () => {
    const headers = ['Key Owner', 'Fingerprint', 'Last Used', 'Trust Level', 'Algorithm', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSorted.map(key => [
        key.keyOwner,
        key.fingerprint,
        key.lastUsed,
        key.trustLevel,
        key.algorithm,
        key.createdAt
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssh-keys-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading && keys.length === 0) return <TableSkeleton rows={8} />;
  if (error) return <ErrorDisplay onRetry={loadData} />;

  const stats = {
    total: keys.length,
    high: keys.filter(k => k.trustLevel === 'high').length,
    medium: keys.filter(k => k.trustLevel === 'medium').length,
    low: keys.filter(k => k.trustLevel === 'low').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl mb-2">SSH Keys</h1>
        <p className="text-slate-500">Manage SSH keys and server access.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Total Keys</p>
          <p className="text-2xl">{stats.total} keys</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">High Trust</p>
          <p className="text-2xl text-green-600">{stats.high}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Medium Trust</p>
          <p className="text-2xl text-yellow-600">{stats.medium}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Low Trust</p>
          <p className="text-2xl text-red-600">{stats.low}</p>
        </div>
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
              placeholder="Search by owner or fingerprint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trustLevel">Trust Level</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          Showing {filteredAndSorted.length} keys
          {searchTerm && ` matching "${debouncedSearch}"`}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg">SSH Keys</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Key Owner</TableHead>
              <TableHead>Fingerprint</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Trust Level</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((key) => (
              <>
                <TableRow key={key.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(key.id)}
                    >
                      {expandedRows.has(key.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{key.keyOwner}</TableCell>
                  <TableCell className="font-mono text-xs">{key.fingerprint.substring(0, 40)}...</TableCell>
                  <TableCell className="text-sm">{key.lastUsed}</TableCell>
                  <TableCell>{getTrustLevelBadge(key.trustLevel)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <AnimatePresence>
                  {expandedRows.has(key.id) && (
                    <TableRow key={`${key.id}-expanded`}>
                      <TableCell colSpan={6} className="bg-slate-50 dark:bg-slate-900/50">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="py-4 px-4"
                        >
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                Associated Servers ({key.associatedServers.length})
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {key.associatedServers.map((server, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm font-mono border border-slate-200 dark:border-slate-700"
                                  >
                                    {server}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div>
                                <p className="text-xs text-slate-500">Full Fingerprint</p>
                                <p className="font-mono text-xs mt-1">{key.fingerprint}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Created</p>
                                <p className="text-sm mt-1">{new Date(key.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Algorithm</p>
                                <p className="text-sm mt-1">{key.algorithm}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}