'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ProfileForm } from '@/components/profile/profile-form';
import { useSidebar } from '@/hooks/use-sidebar';
import { useCurrentUser } from '@/features/auth/hooks';

export default function ProfilePage() {
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { data: currentUser, isLoading } = useCurrentUser();
  const [storedUser, setStoredUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setStoredUser(JSON.parse(stored));
      } catch (e) {
        router.push('/login');
      }
    } else if (!currentUser && !isLoading) {
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  const user = currentUser || storedUser;

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        userRole={user.role} 
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        className="hidden flex-col md:flex" 
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 max-w-3xl">
            <div>
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account information
              </p>
            </div>
            <ProfileForm key={`${user.firstName}-${user.lastName}`} user={user} />
          </div>
        </main>
      </div>
    </div>
  );
}
