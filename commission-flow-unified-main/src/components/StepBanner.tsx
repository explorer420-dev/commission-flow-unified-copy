import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepBannerProps {
  step?: number;
  totalSteps?: number;
  title: string;
  variant?: 'info' | 'success' | 'warning';
}

export function StepBanner({ step, totalSteps, title, variant = 'info' }: StepBannerProps) {
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'warning' ? AlertCircle : Info;
  
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 border-l-4 mb-6",
      variant === 'info' && "bg-primary/5 border-primary text-primary",
      variant === 'success' && "bg-chart-3/10 border-chart-3 text-chart-3",
      variant === 'warning' && "bg-destructive/10 border-destructive text-destructive"
    )}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="font-medium">
        {step && totalSteps && (
          <span className="mr-2">Step {step} of {totalSteps}:</span>
        )}
        {title}
      </p>
    </div>
  );
}
