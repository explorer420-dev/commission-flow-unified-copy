import { useState } from 'react';
import { APPBucket } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, Package, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface APPBucketDetailsProps {
    skuName: string;
    buckets: APPBucket[];
    weightedAvg: number;
    totalQty: number;
}

export function APPBucketDetails({
    skuName,
    buckets,
    weightedAvg,
    totalQty,
}: APPBucketDetailsProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (buckets.length === 0) return null;

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="gap-1 h-auto p-1 text-xs text-primary hover:text-primary"
            >
                View Details
                <ChevronDown className="h-3 w-3" />
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            A-PP Calculation Details: {skuName}
                        </DialogTitle>
                        <DialogDescription>
                            Breakdown of Tentative Seller Patty Price calculation by source buckets
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Summary */}
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Quantity</p>
                                    <p className="text-2xl font-bold font-mono">{totalQty}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Weighted Average A-PP</p>
                                    <p className="text-2xl font-bold font-mono text-primary">
                                        ₹{weightedAvg === 0 ? '0' : weightedAvg.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Buckets */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Source Buckets ({buckets.length})
                            </h3>

                            {buckets.map((bucket, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "p-4 rounded-lg border",
                                        bucket.source === 'so'
                                            ? "bg-chart-3/5 border-chart-3/30"
                                            : "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                {bucket.source === 'so' ? (
                                                    <TrendingUp className="h-4 w-4 text-chart-3" />
                                                ) : (
                                                    <Package className="h-4 w-4 text-amber-600" />
                                                )}
                                                <span className="font-semibold text-sm">
                                                    {bucket.source === 'so' ? `Sale Order` : 'Fallback Price'}
                                                </span>
                                                {bucket.source === 'so' && bucket.source_id && (
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        ({bucket.source_id})
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground text-xs">Quantity</p>
                                                    <p className="font-mono font-semibold">{bucket.qty}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground text-xs">A-SP per box</p>
                                                    <p className="font-mono font-semibold">
                                                        ₹{bucket.a_sp_per_box === 0 ? '0' : bucket.a_sp_per_box.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground text-xs">Tentative A-PP</p>
                                                    <p className="font-mono font-semibold text-primary">
                                                        ₹{bucket.tentative === 0 ? '0' : bucket.tentative.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Formula explanation */}
                        <div className="p-4 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                            <p className="font-semibold mb-1">Calculation Formula:</p>
                            <p>Tentative A-PP = [A-SP - (Labour + Transport)] - (6% commission on net)</p>
                            <p className="mt-1">Weighted Average = Σ(Bucket Qty × Bucket A-PP) / Total Qty</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
