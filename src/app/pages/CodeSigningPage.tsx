import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, LayoutGrid, LayoutList, Shield, HardDrive, Eye, RotateCw } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { TableSkeleton, CardSkeleton } from '../components/LoadingSkeleton';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import codeSigningData from '../../data/codeSigningKeys.json';

interface CodeSigningKey {
  id: string;
  keyAlias: string;
  description: string;
  algorithm: string;
  protectionLevel: 'HSM' | 'Soft';
  createdAt: string;
  lastUsed: string;
  rotationPolicy: string;
  environment: string;
  owner: string;
}

export function CodeSigningPage() {
  const { setCachedData } = useDashboard();
  const [keys, setKeys] = useState<CodeSigningKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [filterProtection, setFilterProtection] = useState('all');
  const [sortBy, setSortBy] = useState('lastUsed');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cached = localStorage.getItem('cache_codeSigningKeys');
      if (cached) {
        const { data } = JSON.parse(cached);
        setKeys(data);
        setLoading(false);
      }

      await new Promise(resolve => setTimeout(resolve, 700));
      
      setKeys(codeSigningData);
      setCachedData('codeSigningKeys', codeSigningData);
      setLoading(false);
      setError(false);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...keys];

    if (filterProtection !== 'all') {
      result = result.filter(k => k.protectionLevel === filterProtection);
    }

    if (searchTerm) {
      result = result.filter(k => 
        k.keyAlias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.algorithm.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'lastUsed') {
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      }
      return a.keyAlias.localeCompare(b.keyAlias);
    });

    return result;
  }, [keys, searchTerm, filterProtection, sortBy]);

  if (loading && keys.length === 0) {
    return viewMode === 'grid' ? <CardSkeleton count={9} /> : <TableSkeleton rows={9} />;
  }
  if (error) return <ErrorDisplay onRetry={loadData} />;

  const stats = {
    total: keys.length,
    hsm: keys.filter(k => k.protectionLevel === 'HSM').length,
    soft: keys.filter(k => k.protectionLevel === 'Soft').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl mb-2">Code Signing Keys</h1>
        <p className="text-slate-500">Manage signing identities for binaries, containers, and artifacts.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Total Keys</p>
          <p className="text-2xl">{stats.total} keys</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">HSM-backed</p>
          <p className="text-2xl text-blue-600">{stats.hsm}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Software-backed</p>
          <p className="text-2xl text-orange-600">{stats.soft}</p>
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
              placeholder="Filter by alias or algorithm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastUsed">Last used (recent first)</SelectItem>
              <SelectItem value="alias">Alias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProtection} onValueChange={setFilterProtection}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Protection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="HSM">HSM only</SelectItem>
              <SelectItem value="Soft">Software only</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          {filteredAndSorted.length} keys - HSM and software-backed - table and grid views
        </div>
      </motion.div>

      {viewMode === 'table' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key Alias</TableHead>
                <TableHead>Algorithm</TableHead>
                <TableHead>Protection Level</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div>
                      <p className="font-mono">{key.keyAlias}</p>
                      <p className="text-xs text-slate-500">{key.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{key.algorithm}</TableCell>
                  <TableCell>
                    {key.protectionLevel === 'HSM' ? (
                      <Badge className="bg-blue-600 flex items-center gap-1 w-fit">
                        <Shield className="h-3 w-3" />
                        HSM-backed
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-600 flex items-center gap-1 w-fit">
                        <HardDrive className="h-3 w-3" />
                        Soft token
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{key.lastUsed}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredAndSorted.map((key, idx) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
                  {key.protectionLevel === 'HSM' ? (
                    <Shield className="h-6 w-6 text-blue-600" />
                  ) : (
                    <HardDrive className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                {key.protectionLevel === 'HSM' ? (
                  <Badge className="bg-blue-600">HSM</Badge>
                ) : (
                  <Badge className="bg-orange-600">Soft</Badge>
                )}
              </div>
              <h3 className="font-mono mb-1">{key.keyAlias}</h3>
              <p className="text-sm text-slate-500 mb-3">{key.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Algorithm</span>
                  <span className="font-mono">{key.algorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Environment</span>
                  <span>{key.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Owner</span>
                  <span>{key.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span>{new Date(key.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                  <span className="text-slate-500">Last used</span>
                  <span>{key.lastUsed}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Rotation: {key.rotationPolicy}</span>
                  <Button variant="ghost" size="sm" className="h-7">
                    View
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}