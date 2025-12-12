import { Lock, Unlock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'locked' | 'editable' | 'completed';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium",
      status === 'locked' && "bg-muted/30 text-muted",
      status === 'editable' && "bg-primary/10 text-primary",
      status === 'completed' && "bg-chart-3/10 text-chart-3"
    )}>
      {status === 'locked' && <Lock className="h-3 w-3" />}
      {status === 'editable' && <Unlock className="h-3 w-3" />}
      {status === 'completed' && <CheckCircle className="h-3 w-3" />}
      <span className="uppercase">
        {status === 'locked' && 'Read-Only'}
        {status === 'editable' && 'Editable'}
        {status === 'completed' && 'Complete'}
      </span>
    </div>
  );
}
