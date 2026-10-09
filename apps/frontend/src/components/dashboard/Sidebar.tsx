'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Users,
  LayoutDashboard,
  LogOut,
  DoorOpen,
  Clock,
  TrendingUp,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLogout } from '@/features/auth/hooks';

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    group: 'main',
  },
  {
    title: 'My Bookings',
    href: '/my-bookings',
    icon: Clock,
    group: 'main',
  },
  {
    title: 'Bookings',
    href: '/bookings',
    icon: Calendar,
    group: 'main',
  },
  {
    title: 'Rooms',
    href: '/rooms',
    icon: DoorOpen,
    group: 'main',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
    group: 'admin',
    adminOnly: true,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    group: 'admin',
    adminOnly: true,
  },
  {
    title: 'Audit logs',
    href: '/audit',
    icon: Clock,
    group: 'admin',
    adminOnly: true,
  },
  {
    title: 'AI recommend',
    href: '/ai',
    icon: Building2,
    group: 'main',
  },
];

export function Sidebar({
  className,
  userRole,
  isCollapsed,
  onToggle,
}: {
  className?: string;
  userRole: 'ADMIN' | 'EMPLOYEE';
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || userRole === 'ADMIN'
  );

  const mainNavItems = filteredNavItems.filter((item) => item.group === 'main');
  const adminNavItems = filteredNavItems.filter((item) => item.group === 'admin');

  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => {
    const Icon = item.icon;

    // Collapsed layout - dedicated square buttons
    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={item.href} className="flex justify-center">
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'h-10 w-10 p-0 rounded-lg',
                    isActive && 'bg-secondary'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Expanded layout - full width buttons with text
    return (
      <Link href={item.href}>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start gap-3 h-10',
            isActive && 'bg-secondary font-medium'
          )}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span>{item.title}</span>
        </Button>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        'group flex h-screen flex-col border-r bg-background transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-[256px]',
        className
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        'relative flex h-16 items-center border-b transition-all duration-300',
        isCollapsed ? 'justify-center px-0' : 'justify-between px-4'
      )}>
        {isCollapsed ? (
          <>
            {/* Logo - visible by default, fades out on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-200">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary shadow-sm">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            {/* Expand button - hidden by default, fades in on hover */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="absolute inset-0 h-10 w-10 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold whitespace-nowrap">
                Conference Room
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-9 w-9 flex-shrink-0"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        'flex-1 overflow-y-auto transition-all duration-300',
        isCollapsed ? 'px-3 py-4' : 'px-3 py-4'
      )}>
        {/* Main Navigation */}
        {mainNavItems.length > 0 && (
          <div className={cn(
            'space-y-2',
            isCollapsed ? 'space-y-2' : 'space-y-1'
          )}>
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return <NavItem key={item.href} item={item} isActive={isActive} />;
            })}
          </div>
        )}

        {/* Admin Navigation */}
        {adminNavItems.length > 0 && (
          <div className="mt-6 space-y-2">
            {!isCollapsed && (
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Admin
                </p>
              </div>
            )}
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href;
              return <NavItem key={item.href} item={item} isActive={isActive} />;
            })}
          </div>
        )}
      </nav>

      {/* Footer / Logout */}
      <div className={cn(
        'border-t transition-all duration-300',
        isCollapsed ? 'p-3' : 'p-2'
      )}>
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 w-10 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 mx-auto"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </Button>
        )}
      </div>
    </div>
  );
}
