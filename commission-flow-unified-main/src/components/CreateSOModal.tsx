import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { saveSO } from '@/lib/api';
import { SaleOrder } from '@/lib/types';

interface CreateSOModalProps {
    open: boolean;
    onClose: () => void;
    poId: string;
    skuId?: string;
    skuName?: string;
    suggestedQty?: number;
    onSuccess?: () => void;
}

export function CreateSOModal({
    open,
    onClose,
    poId,
    skuId,
    skuName,
    suggestedQty,
    onSuccess,
}: CreateSOModalProps) {
    const [qty, setQty] = useState<string>(suggestedQty?.toString() || '');
    const [asp, setAsp] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        const qtyNum = parseInt(qty);
        const aspNum = parseFloat(asp);

        if (isNaN(qtyNum) || qtyNum <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        if (isNaN(aspNum) || aspNum <= 0) {
            toast.error('Please enter a valid Actual Selling Price');
            return;
        }

        if (!skuId || !skuName) {
            toast.error('SKU information is missing');
            return;
        }

        setIsSubmitting(true);
        try {
            const newSO: SaleOrder = {
                id: `SO-${Date.now()}`,
                po_id: poId,
                status: 'ACTUAL_SUBMITTED',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                items: [
                    {
                        sku_id: skuId,
                        sku_name: skuName,
                        so_qty: qtyNum,
                        e_sp: aspNum, // For simplicity, using same value
                        a_sp: aspNum,
                        status: 'ACTUAL_SUBMITTED',
                    },
                ],
            };

            await saveSO(newSO);
            toast.success(`Sale Order created for ${qtyNum} boxes of ${skuName}`);
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create SO');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Create Sale Order
                    </DialogTitle>
                    <DialogDescription>
                        Create a new Sale Order to cover unsold quantity for this SKU
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {skuName && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium text-foreground">{skuName}</p>
                            <p className="text-xs text-muted-foreground mt-1">SKU ID: {skuId}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="so-qty">Quantity (boxes)</Label>
                        <Input
                            id="so-qty"
                            type="number"
                            placeholder="Enter quantity"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            min="1"
                            step="1"
                        />
                        {suggestedQty && (
                            <p className="text-xs text-muted-foreground">
                                Suggested: {suggestedQty} boxes (unsold quantity)
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="so-asp">Actual Selling Price (A-SP) per box</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">₹</span>
                            <Input
                                id="so-asp"
                                type="number"
                                placeholder="0"
                                value={asp}
                                onChange={(e) => setAsp(e.target.value)}
                                min="0"
                                step="0.01"
                                className="font-mono"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Sale Order'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
