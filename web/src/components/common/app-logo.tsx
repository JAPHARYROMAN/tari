import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  collapsed?: boolean;
  className?: string;
}

export function AppLogo({ collapsed = false, className }: AppLogoProps) {
  return (
    <Link
      href="/chat"
      className={cn(
        'flex items-center gap-2 font-bold tracking-tight text-foreground',
        className,
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
        T
      </span>
      {!collapsed && <span className="text-lg">Tari</span>}
    </Link>
  );
}
