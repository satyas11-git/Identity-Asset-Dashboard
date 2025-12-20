import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Eye, Edit, Search, ChevronDown } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Button } from '../components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import certificatesData from '../../data/certificates.json';

interface Certificate {
  id: string;
  name: string;
  domain: string;
  issuer: string;
  status: 'active' | 'expired' | 'expiring_soon';
  expiryDate: string;
  commonName: string;
  serialNumber: string;
  algorithm: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export function CertificatesPage() {
  const { cachedData, setCachedData } = useDashboard();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterDomain, setFilterDomain] = useState('all');
  const [sortBy, setSortBy] = useState('expiryDate');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load from cache immediately
      const cached = localStorage.getItem('cache_certificates');
      if (cached) {
        const { data } = JSON.parse(cached);
        setCertificates(data);
        setLoading(false);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setCertificates(certificatesData);
      setCachedData('certificates', certificatesData);
      setLoading(false);
      setError(false);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  const domains = useMemo(() => {
    const uniqueDomains = [...new Set(certificates.map(c => c.domain))];
    return uniqueDomains;
  }, [certificates]);

  const filteredAndSorted = useMemo(() => {
    let result = [...certificates];

    // Filter by domain
    if (filterDomain !== 'all') {
      result = result.filter(c => c.domain === filterDomain);
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.issuer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'expiryDate') {
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [certificates, filterDomain, sortBy, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAndSorted.slice(start, end);
  }, [filteredAndSorted, currentPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);

  const getStatusBadge = (status: string, expiryDate: string) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (status === 'expired') {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (status === 'expiring_soon' || daysUntilExpiry < 30) {
      return <Badge className="bg-orange-500">Expiring Soon</Badge>;
    }
    return <Badge className="bg-green-600">Active</Badge>;
  };

  if (loading && certificates.length === 0) return <TableSkeleton rows={10} />;
  if (error) return <ErrorDisplay onRetry={loadData} />;

  const stats = {
    total: certificates.length,
    expiringSoon: certificates.filter(c => c.status === 'expiring_soon').length,
    expired: certificates.filter(c => c.status === 'expired').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl mb-2">Certificates</h1>
        <p className="text-slate-500">Manage TLS certificates across your fleet.</p>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Total Certificates</p>
          <p className="text-2xl">{stats.total} certificates</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Expiring Soon</p>
          <p className="text-2xl text-orange-500">{stats.expiringSoon} certificates</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Expired</p>
          <p className="text-2xl text-red-500">{stats.expired} certificates</p>
        </div>
      </motion.div>

      {/* Filters */}
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
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {domains.map(domain => (
                <SelectItem key={domain} value={domain}>{domain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expiryDate">Expiry Date (soonest)</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          Showing {filteredAndSorted.length} of {stats.total} certificates
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Certificate Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((cert) => (
              <TableRow key={cert.id}>
                <TableCell>{cert.name}</TableCell>
                <TableCell className="font-mono text-sm">{cert.domain}</TableCell>
                <TableCell>{cert.issuer}</TableCell>
                <TableCell>{getStatusBadge(cert.status, cert.expiryDate)}</TableCell>
                <TableCell>{new Date(cert.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCert(cert)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCert(cert)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSorted.length)} of {filteredAndSorted.length}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                const page = currentPage <= 2 ? i + 1 : currentPage + i - 1;
                if (page > totalPages) return null;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* View Modal */}
      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
            <DialogDescription>
              View detailed information about this certificate
            </DialogDescription>
          </DialogHeader>
          {selectedCert && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Certificate Name</p>
                <p className="font-mono">{selectedCert.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Common Name</p>
                <p className="font-mono">{selectedCert.commonName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Serial Number</p>
                <p className="font-mono text-sm">{selectedCert.serialNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Algorithm</p>
                <p>{selectedCert.algorithm}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Issuer</p>
                <p>{selectedCert.issuer}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p>{new Date(selectedCert.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Expires</p>
                <p>{new Date(selectedCert.expiryDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Drawer */}
      <Sheet open={!!editingCert} onOpenChange={() => setEditingCert(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Certificate</SheetTitle>
            <SheetDescription>
              Update editable fields (changes are local only)
            </SheetDescription>
          </SheetHeader>
          {editingCert && (
            <div className="space-y-4 mt-6">
              <div>
                <label className="text-sm text-slate-500">Certificate Name</label>
                <Input
                  value={editingCert.name}
                  onChange={(e) => setEditingCert({ ...editingCert, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-500">Domain</label>
                <Input
                  value={editingCert.domain}
                  className="font-mono"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm text-slate-500">Issuer</label>
                <Input value={editingCert.issuer} readOnly />
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => {
                  // Update local state only
                  setCertificates(certs =>
                    certs.map(c => c.id === editingCert.id ? editingCert : c)
                  );
                  setEditingCert(null);
                }}
              >
                Save Changes (Local Only)
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
