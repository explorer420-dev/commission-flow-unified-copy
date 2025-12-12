import { UnsolvedSKU } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, DollarSign, Plus } from 'lucide-react';

interface UnsolvedSKUsPanelProps {
    unsolvedSKUs: UnsolvedSKU[];
    onOpenFallbackModal: () => void;
    onCreateSO?: (skuId: string) => void;
}

export function UnsolvedSKUsPanel({
    unsolvedSKUs,
    onOpenFallbackModal,
    onCreateSO,
}: UnsolvedSKUsPanelProps) {
    if (unsolvedSKUs.length === 0) return null;

    return (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 mb-6">
            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                            Unresolved quantities detected for this PO
                        </h3>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                            Some SKUs on this PO have quantities not covered by closed Sale Orders. Resolve them before generating Tentative Seller Patty Price.
                        </p>
                    </div>
                </div>

                {/* Global Action */}
                <div className="flex justify-end">
                    <Button
                        onClick={onOpenFallbackModal}
                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        <DollarSign className="h-4 w-4" />
                        Enter fallback prices for all SKUs
                    </Button>
                </div>

                {/* SKU Cards */}
                <div className="space-y-3">
                    {unsolvedSKUs.map((sku) => (
                        <Card
                            key={sku.sku_id}
                            className="p-4 bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-semibold text-foreground">{sku.sku_name}</h4>

                                    <div className="flex items-center gap-6 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">PO Qty:</span>
                                            <span className="ml-2 font-mono font-semibold text-foreground">
                                                {sku.po_qty}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Sold (A-SP entered):</span>
                                            <span className="ml-2 font-mono font-semibold text-chart-3">
                                                {sku.closed_qty}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Unsold:</span>
                                            <span className="ml-2 font-mono font-semibold text-amber-600 dark:text-amber-500">
                                                {sku.unsold_qty}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground italic">
                                        Action required: Either link/create SO for remaining {sku.unsold_qty} boxes or enter a fallback A-SP for those {sku.unsold_qty} boxes.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {onCreateSO && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onCreateSO(sku.sku_id)}
                                            className="gap-2 whitespace-nowrap"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Create/Link SO
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onOpenFallbackModal}
                                        className="gap-2 whitespace-nowrap border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-950/30"
                                    >
                                        <DollarSign className="h-3 w-3" />
                                        Enter fallback price
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </Card>
    );
}
