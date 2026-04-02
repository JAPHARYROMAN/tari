import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

const dotSizeClasses = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getColor(name: string): string {
  const colors = [
    'bg-rose-500/15 text-rose-700',
    'bg-blue-500/15 text-blue-700',
    'bg-emerald-500/15 text-emerald-700',
    'bg-amber-500/15 text-amber-700',
    'bg-violet-500/15 text-violet-700',
    'bg-cyan-500/15 text-cyan-700',
    'bg-pink-500/15 text-pink-700',
    'bg-teal-500/15 text-teal-700',
  ];
  let hash = 0;
  for (const char of name) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

export function UserAvatar({
  name,
  avatarUrl,
  isOnline,
  size = 'md',
  className,
}: UserAvatarProps) {
  return (
    <div className={cn('relative shrink-0', className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={cn(
            'rounded-full object-cover',
            sizeClasses[size],
          )}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-medium',
            sizeClasses[size],
            getColor(name),
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {isOnline != null && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-background',
            dotSizeClasses[size],
            isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40',
          )}
        />
      )}
    </div>
  );
}
