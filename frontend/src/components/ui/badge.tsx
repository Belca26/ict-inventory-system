import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'success' | 'warning' | 'destructive' | 'muted';

const toneClasses: Record<Tone, string> = {
  default: 'bg-accent text-accent-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

export function Badge({ tone = 'default', className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', toneClasses[tone], className)}
      {...props}
    />
  );
}

// Maps backend enum values to a sensible visual tone without hardcoding this
// logic into every page that renders a status.
export function statusTone(status: string): Tone {
  const map: Record<string, Tone> = {
    ACTIVE: 'success',
    COMPLETED: 'success',
    UNDER_MAINTENANCE: 'warning',
    PENDING: 'warning',
    FAULTY: 'destructive',
    CANCELLED: 'destructive',
    RETIRED: 'muted',
    LOST: 'destructive',
    DISPOSED: 'muted',
  };
  return map[status] ?? 'default';
}
