import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface QuantityInputProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    className?: string;
}

export function QuantityInput({ value, onChange, disabled, className }: QuantityInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <Input
            type="number"
            value={value === 0 ? '' : value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={cn(
                "text-center font-mono w-1/2 mx-auto",
                disabled && "bg-muted/30 text-muted cursor-not-allowed border-muted",
                className
            )}
            placeholder={isFocused ? "" : "0"}
            min="0"
            step="1"
        />
    );
}
