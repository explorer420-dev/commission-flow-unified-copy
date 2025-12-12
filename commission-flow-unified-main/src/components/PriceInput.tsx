import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PriceInputProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function PriceInput({ value, onChange, disabled, className }: PriceInputProps) {
  return (
    <div className={cn("relative", className)}>
      <span className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 text-sm",
        disabled ? "text-muted" : "text-muted-foreground"
      )}>₹</span>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
        className={cn(
          "pl-7 text-right font-mono",
          disabled && "bg-muted/30 text-muted cursor-not-allowed border-muted"
        )}
        placeholder="0.00"
      />
    </div>
  );
}
