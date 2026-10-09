'use client';

import { useRouter } from 'next/navigation';
import { User, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/features/auth/hooks';

interface UserMenuProps {
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 pl-4 border-l cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <Badge variant="secondary" className="text-xs">
              {user.role}
            </Badge>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
