'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { useSidebar } from '@/hooks/use-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAuditLogs } from '@/features/audit/api';
import { useCurrentUser } from '@/features/auth/hooks';

export default function AuditPage() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.role !== 'ADMIN') router.push('/');
    } else if (!currentUser && !isLoading) {
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      getAuditLogs().then(setLogs).catch(() => setLogs([]));
    }
  }, [user]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={user.role} isCollapsed={isCollapsed} onToggle={toggleSidebar} className="hidden flex-col md:flex" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.logId}>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entityType} {log.entityId}</TableCell>
                      <TableCell>{log.user?.email || log.userId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
