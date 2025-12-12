import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UnsolvedSKU, FallbackEntry } from '@/lib/types';
import { AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface FallbackPricingModalProps {
    open: boolean;
    onClose: () => void;
    unsolvedSKUs: UnsolvedSKU[];
    onSubmit: (entries: FallbackEntry[]) => Promise<void>;
}

export function FallbackPricingModal({
    open,
    onClose,
    unsolvedSKUs,
    onSubmit,
}: FallbackPricingModalProps) {
    const [fallbackPrices, setFallbackPrices] = useState<Map<string, number>>(new Map());
    const [applyToAll, setApplyToAll] = useState(false);
    const [globalPrice, setGlobalPrice] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setFallbackPrices(new Map());
            setApplyToAll(false);
            setGlobalPrice('');
        }
    }, [open]);

    const handlePriceChange = (skuId: string, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setFallbackPrices(prev => {
                const newMap = new Map(prev);
                newMap.set(skuId, numValue);
                return newMap;
            });
        } else if (value === '') {
            setFallbackPrices(prev => {
                const newMap = new Map(prev);
                newMap.delete(skuId);
                return newMap;
            });
        }
    };

    const handleGlobalPriceChange = (value: string) => {
        setGlobalPrice(value);
        if (applyToAll) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue >= 0) {
                const newMap = new Map<string, number>();
                unsolvedSKUs.forEach(sku => {
                    newMap.set(sku.sku_id, numValue);
                });
                setFallbackPrices(newMap);
            }
        }
    };

    const handleApplyToAllChange = (checked: boolean) => {
        setApplyToAll(checked);
        if (checked && globalPrice) {
            const numValue = parseFloat(globalPrice);
            if (!isNaN(numValue) && numValue >= 0) {
                const newMap = new Map<string, number>();
                unsolvedSKUs.forEach(sku => {
                    newMap.set(sku.sku_id, numValue);
                });
                setFallbackPrices(newMap);
            }
        }
    };

    const handleSubmit = async () => {
        // Validate all SKUs have prices
        const missingPrices = unsolvedSKUs.filter(sku => !fallbackPrices.has(sku.sku_id));
        if (missingPrices.length > 0) {
            toast.error(`Please enter fallback prices for all SKUs`);
            return;
        }

        // Validate prices are positive
        for (const [skuId, price] of fallbackPrices.entries()) {
            if (price <= 0) {
                const sku = unsolvedSKUs.find(s => s.sku_id === skuId);
                toast.error(`Fallback price for ${sku?.sku_name} must be greater than 0`);
                return;
            }
        }

        // Create fallback entries
        const entries: FallbackEntry[] = unsolvedSKUs.map(sku => ({
            sku_id: sku.sku_id,
            fallback_qty: sku.unsold_qty,
            fallback_a_sp_per_box: fallbackPrices.get(sku.sku_id)!,
        }));

        setIsSubmitting(true);
        try {
            await onSubmit(entries);
            toast.success('Fallback prices saved successfully');
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save fallback prices');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Enter Fallback Prices for Unsold Quantities
                    </DialogTitle>
                    <DialogDescription>
                        Some SKUs have quantities not covered by Sale Orders. Enter fallback A-SP (Actual Selling Price) per box for these unsold quantities.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Apply to all option */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="apply-to-all"
                                checked={applyToAll}
                                onCheckedChange={handleApplyToAllChange}
                                className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="apply-to-all" className="text-sm font-medium cursor-pointer">
                                    Apply same price to all SKUs
                                </Label>
                                {applyToAll && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Enter price per box"
                                            value={globalPrice}
                                            onChange={(e) => handleGlobalPriceChange(e.target.value)}
                                            className="max-w-xs"
                                            min="0"
                                            step="0.01"
                                        />
                                        <span className="text-sm text-muted-foreground">₹ per box</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SKU list */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Unsold SKUs ({unsolvedSKUs.length})
                        </h3>

                        {unsolvedSKUs.map((sku) => (
                            <div
                                key={sku.sku_id}
                                className="p-4 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                            <h4 className="font-semibold text-foreground">{sku.sku_name}</h4>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">PO Qty:</span>
                                                <span className="ml-2 font-mono font-semibold">{sku.po_qty}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Sold:</span>
                                                <span className="ml-2 font-mono font-semibold text-chart-3">{sku.closed_qty}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Unsold:</span>
                                                <span className="ml-2 font-mono font-semibold text-amber-600">{sku.unsold_qty}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-48">
                                        <Label htmlFor={`price-${sku.sku_id}`} className="text-xs text-muted-foreground mb-1 block">
                                            Fallback A-SP per box
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">₹</span>
                                            <Input
                                                id={`price-${sku.sku_id}`}
                                                type="number"
                                                placeholder="0"
                                                value={fallbackPrices.get(sku.sku_id) ?? ''}
                                                onChange={(e) => handlePriceChange(sku.sku_id, e.target.value)}
                                                disabled={applyToAll}
                                                className="font-mono"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Fallback Prices'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
