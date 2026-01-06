import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PriceInputProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function PriceInput({ value, onChange, disabled, className }: PriceInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("relative w-1/2 mx-auto", className)}>
      <span className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 text-sm",
        disabled ? "text-muted" : "text-muted-foreground"
      )}>₹</span>
      <Input
        type="number"
        value={value === 0 ? '' : (value ?? '')}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        className={cn(
          "pl-7 text-center font-mono",
          disabled && "bg-muted/30 text-muted cursor-not-allowed border-muted"
        )}
        placeholder={isFocused ? "" : "0"}
      />
    </div>
  );
}
