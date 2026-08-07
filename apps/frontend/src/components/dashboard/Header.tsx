'use client';

import { usePathname } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/components/layout/user-menu';

interface HeaderProps {
  user: any;
  title?: string;
  subtitle?: string;
}

const getPageInfo = (pathname: string) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathname === '/' || pathname === '') {
    return { title: 'Dashboard', breadcrumb: null };
  }
  
  const pageMap: Record<string, { title: string; subtitle: string }> = {
    'bookings': { title: 'Bookings', subtitle: 'View and manage conference room bookings' },
    'my-bookings': { title: 'My Bookings', subtitle: 'Manage your conference room bookings' },
    'rooms': { title: 'Rooms', subtitle: 'Manage and view conference rooms' },
    'analytics': { title: 'Analytics', subtitle: 'View booking analytics and insights' },
  };

  const mainSegment = pathSegments[0];
  const pageInfo = pageMap[mainSegment];

  if (pageInfo) {
    return {
      title: pageInfo.title,
      breadcrumb: pathname === '/' ? null : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Dashboard</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{pageInfo.title}</span>
        </div>
      ),
    };
  }

  return { title: mainSegment.charAt(0).toUpperCase() + mainSegment.slice(1), breadcrumb: null };
};

export function Header({ user, title, subtitle }: HeaderProps) {
  const pathname = usePathname();
  const pageInfo = getPageInfo(pathname);
  const displayTitle = title || pageInfo.title;
  const displaySubtitle = subtitle;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Page Title & Breadcrumb */}
        <div className="flex flex-col gap-1">
          {pageInfo.breadcrumb && (
            <div className="flex items-center">
              {pageInfo.breadcrumb}
            </div>
          )}
          <h1 className="text-xl font-semibold tracking-tight">{displayTitle}</h1>
          {displaySubtitle && (
            <p className="text-sm text-muted-foreground">{displaySubtitle}</p>
          )}
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-4">
          {/* Notification Button */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* User Menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
