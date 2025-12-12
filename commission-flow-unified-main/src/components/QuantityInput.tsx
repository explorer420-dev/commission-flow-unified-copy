import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface QuantityInputProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    className?: string;
}

export function QuantityInput({ value, onChange, disabled, className }: QuantityInputProps) {
    return (
        <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            disabled={disabled}
            className={cn(
                "text-right font-mono",
                disabled && "bg-muted/30 text-muted cursor-not-allowed border-muted",
                className
            )}
            placeholder="0"
            min="0"
            step="1"
        />
    );
}
