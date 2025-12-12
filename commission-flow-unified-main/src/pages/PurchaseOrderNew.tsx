import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StepBanner } from '@/components/StepBanner';
import { PriceInput } from '@/components/PriceInput';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePOStore } from '@/lib/store';
import { Calculator, CheckCircle, Send, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FallbackPricingModal } from '@/components/FallbackPricingModal';
import { UnsolvedSKUsPanel } from '@/components/UnsolvedSKUsPanel';
import { APPBucketDetails } from '@/components/APPBucketDetails';
import { CreateSOModal } from '@/components/CreateSOModal';
import { generateAPP, saveFallbackPrices, getPO, updatePO } from '@/lib/api';
import { FallbackEntry, NC_COMMISSION_PERCENT } from '@/lib/types';

export default function PurchaseOrderNew() {
    const navigate = useNavigate();
    const {
        currentPO,
        appResults,
        unsolvedSKUs,
        isLoading,
        error,
        setCurrentPO,
        setAPPResults,
        setUnsolvedSKUs,
        setLoading,
        setError,
        updatePOItem,
        updatePOStatus,
        clearAPPState,
    } = usePOStore();

    const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);
    const [isSOModalOpen, setIsSOModalOpen] = useState(false);
    const [selectedSKU, setSelectedSKU] = useState<{ id: string; name: string; qty: number } | null>(null);

    // Load PO on mount
    useEffect(() => {
        loadPO();
    }, []);

    const loadPO = async () => {
        setLoading(true);
        try {
            const po = await getPO('PO-001'); // Demo PO ID
            if (po) {
                setCurrentPO(po);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load PO');
            toast.error('Failed to load Purchase Order');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitEPP = async () => {
        if (!currentPO) return;

        const allFilled = currentPO.items.every(item => item.e_pp !== null && item.e_pp > 0);
        if (!allFilled) {
            toast.error('Please fill all Expected Purchase Prices before submitting');
            return;
        }

        try {
            updatePOStatus('EXPECTED_SUBMITTED');
            await updatePO({ ...currentPO, status: 'EXPECTED_SUBMITTED' });
            toast.success('Expected Purchase Prices submitted. You may now generate Tentative Seller Patty Price when SOs are closed.');
        } catch (err) {
            toast.error('Failed to submit EPP');
        }
    };

    const handleGenerateAPP = async () => {
        if (!currentPO) return;

        setLoading(true);
        clearAPPState();

        try {
            const response = await generateAPP(currentPO.id);

            if (!response.success && response.unsold_skus) {
                // 409 Conflict - unsolved SKUs
                setUnsolvedSKUs(response.unsold_skus);
                const totalUnsolvedQty = response.unsold_skus.reduce((sum, sku) => sum + sku.unsold_qty, 0);
                toast.error(`Cannot generate Patty Price: ${totalUnsolvedQty} units across ${response.unsold_skus.length} SKU(s) don't have matching Sale Orders. Please create SOs or add fallback prices.`);
            } else if (response.success && response.a_pp_results) {
                // Success - A-PP generated
                setAPPResults(response.a_pp_results);
                updatePOStatus('A_PP_GENERATED');
                await updatePO({ ...currentPO, status: 'A_PP_GENERATED' });
                toast.success('Tentative Seller Patty Prices generated successfully!');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate A-PP');
            toast.error('Failed to generate Tentative Seller Patty Price');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFallbackPrices = async (entries: FallbackEntry[]) => {
        if (!currentPO) return;

        try {
            await saveFallbackPrices(currentPO.id, entries);

            // Auto-retry A-PP generation
            setTimeout(() => {
                handleGenerateAPP();
            }, 500);
        } catch (err) {
            throw err; // Let modal handle the error
        }
    };

    const handleConfirmFinalPatty = async () => {
        if (!currentPO) return;

        try {
            updatePOStatus('FINALIZED');
            await updatePO({ ...currentPO, status: 'FINALIZED' });
            toast.success('Final Patty Prices confirmed. Purchase Order finalized!');
        } catch (err) {
            toast.error('Failed to finalize PO');
        }
    };

    const handleUpdateEPP = (skuId: string, value: number) => {
        updatePOItem(skuId, { e_pp: value });
    };

    const handleUpdateActualPatty = (skuId: string, value: number) => {
        updatePOItem(skuId, { actual_seller_patty_price: value });
    };

    const handleCreateSO = (skuId: string) => {
        if (!currentPO) return;

        const item = currentPO.items.find(i => i.sku_id === skuId);
        const unsoldSKU = unsolvedSKUs?.find(s => s.sku_id === skuId);

        if (item && unsoldSKU) {
            setSelectedSKU({
                id: skuId,
                name: item.sku_name,
                qty: unsoldSKU.unsold_qty,
            });
            setIsSOModalOpen(true);
        }
    };

    const handleSOCreated = () => {
        // Refresh and retry A-PP generation
        setTimeout(() => {
            handleGenerateAPP();
        }, 500);
    };

    const getBanner = () => {
        if (!currentPO) return null;

        switch (currentPO.status) {
            case 'DRAFT':
                return <StepBanner step={1} totalSteps={4} title="Enter Expected Purchase Prices (E-PP)" variant="info" />;
            case 'EXPECTED_SUBMITTED':
                return <StepBanner step={2} totalSteps={4} title="E-PP Submitted. Close Sale Orders and generate Tentative Seller Patty Price." variant="info" />;
            case 'A_PP_GENERATED':
                return <StepBanner step={3} totalSteps={4} title="Review and adjust Actual Seller Patty Price" variant="info" />;
            case 'FINALIZED':
                return <StepBanner title="Purchase Order Finalized Successfully" variant="success" />;
        }
    };

    const getMargin = (item: typeof currentPO.items[0]) => {
        if (item.tentative_a_pp !== null && item.actual_seller_patty_price !== null) {
            return item.actual_seller_patty_price - item.tentative_a_pp;
        }
        return null;
    };

    const getAPPResultForSKU = (skuId: string) => {
        return appResults?.find(r => r.sku_id === skuId);
    };

    if (isLoading && !currentPO) {
        return (
            <div className="min-h-screen bg-background p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading Purchase Order...</p>
                </div>
            </div>
        );
    }

    if (!currentPO) {
        return (
            <div className="min-h-screen bg-background p-8 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <p className="text-muted-foreground">Failed to load Purchase Order</p>
                    <Button onClick={loadPO} className="mt-4">Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                <Breadcrumbs items={[{ label: 'PO Module' }]} />

                <header className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Purchase Order Module</h1>
                            <p className="text-muted-foreground">PO ID: {currentPO.id} • Vendor: {currentPO.vendor_id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <StatusBadge
                                status={
                                    currentPO.status === 'DRAFT' ? 'editable' :
                                        currentPO.status === 'FINALIZED' ? 'completed' :
                                            'locked'
                                }
                            />
                        </div>
                    </div>
                </header>

                {getBanner()}

                {/* Unsolved SKUs Warning Panel */}
                {unsolvedSKUs && unsolvedSKUs.length > 0 && (
                    <UnsolvedSKUsPanel
                        unsolvedSKUs={unsolvedSKUs}
                        onOpenFallbackModal={() => setIsFallbackModalOpen(true)}
                        onCreateSO={handleCreateSO}
                    />
                )}

                {/* Generate A-PP Section */}
                {currentPO.status === 'EXPECTED_SUBMITTED' && !unsolvedSKUs && (
                    <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-foreground">Ready to Generate Tentative Seller Patty Price</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Formula: A-PP = [A-SP – (Labour + Transport)] – NC {NC_COMMISSION_PERCENT}% commission
                                </p>
                            </div>
                            <Button onClick={handleGenerateAPP} className="gap-2" disabled={isLoading}>
                                <Calculator className="h-4 w-4" />
                                {isLoading ? 'Generating...' : 'Generate Tentative Seller Patty Price'}
                            </Button>
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                        <CardTitle>Purchase Pricing Table</CardTitle>
                        <div className="flex gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">E-PP:</span>
                                <StatusBadge status={currentPO.status === 'DRAFT' ? 'editable' : currentPO.status === 'FINALIZED' ? 'completed' : 'locked'} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Tentative A-PP:</span>
                                <StatusBadge status={currentPO.status === 'A_PP_GENERATED' || currentPO.status === 'FINALIZED' ? 'completed' : 'locked'} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Actual Patty:</span>
                                <StatusBadge status={currentPO.status === 'A_PP_GENERATED' ? 'editable' : currentPO.status === 'FINALIZED' ? 'completed' : 'locked'} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="font-semibold">SKU Name</TableHead>
                                    <TableHead className="font-semibold text-right">PO Qty</TableHead>
                                    <TableHead className="font-semibold text-right">Labour/Box</TableHead>
                                    <TableHead className="font-semibold text-right">Transport/Box</TableHead>
                                    <TableHead className="font-semibold text-right">E-PP</TableHead>
                                    <TableHead className="font-semibold text-right">Tentative A-PP</TableHead>
                                    <TableHead className="font-semibold text-right">Actual Seller Patty Price</TableHead>
                                    {(currentPO.status === 'A_PP_GENERATED' || currentPO.status === 'FINALIZED') && (
                                        <TableHead className="font-semibold text-right">Margin</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentPO.items.map((item) => {
                                    const margin = getMargin(item);
                                    const appResult = getAPPResultForSKU(item.sku_id);

                                    return (
                                        <TableRow key={item.sku_id}>
                                            <TableCell className="font-medium">{item.sku_name}</TableCell>
                                            <TableCell className="text-right font-mono">{item.po_qty}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                                ₹{item.labour_cost_per_box}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                                ₹{item.transport_cost_per_box}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <PriceInput
                                                    value={item.e_pp}
                                                    onChange={(value) => handleUpdateEPP(item.sku_id, value)}
                                                    disabled={currentPO.status !== 'DRAFT'}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="space-y-1">
                                                    <div className={cn(
                                                        "font-mono p-2 text-right rounded",
                                                        currentPO.status === 'DRAFT' || currentPO.status === 'EXPECTED_SUBMITTED'
                                                            ? "bg-muted/30 text-muted"
                                                            : "bg-primary/5"
                                                    )}>
                                                        {item.tentative_a_pp !== null
                                                            ? `₹${item.tentative_a_pp === 0 ? '0' : item.tentative_a_pp.toFixed(2)}`
                                                            : '—'}
                                                    </div>
                                                    {appResult && appResult.buckets.length > 0 && (
                                                        <APPBucketDetails
                                                            skuName={item.sku_name}
                                                            buckets={appResult.buckets}
                                                            weightedAvg={appResult.weighted_avg}
                                                            totalQty={appResult.total_qty}
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <PriceInput
                                                    value={item.actual_seller_patty_price}
                                                    onChange={(value) => handleUpdateActualPatty(item.sku_id, value)}
                                                    disabled={currentPO.status !== 'A_PP_GENERATED'}
                                                />
                                            </TableCell>
                                            {(currentPO.status === 'A_PP_GENERATED' || currentPO.status === 'FINALIZED') && (
                                                <TableCell className="text-right">
                                                    <span className={cn(
                                                        "font-mono font-semibold",
                                                        margin !== null && margin >= 0 ? "text-chart-3" : "text-destructive"
                                                    )}>
                                                        {margin !== null ? `₹${margin === 0 ? '0' : margin.toFixed(2)}` : '—'}
                                                    </span>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        <div className="mt-6 flex justify-end gap-4">
                            {currentPO.status === 'DRAFT' && (
                                <Button onClick={handleSubmitEPP} className="gap-2">
                                    <Send className="h-4 w-4" />
                                    Submit Expected Purchase Prices
                                </Button>
                            )}
                            {currentPO.status === 'A_PP_GENERATED' && (
                                <Button onClick={handleConfirmFinalPatty} className="gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Confirm Final Patty Prices
                                </Button>
                            )}
                            {currentPO.status === 'FINALIZED' && (
                                <Button onClick={() => navigate('/')} variant="secondary" className="gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Return to Dashboard
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Fallback Pricing Modal */}
            {unsolvedSKUs && (
                <FallbackPricingModal
                    open={isFallbackModalOpen}
                    onClose={() => setIsFallbackModalOpen(false)}
                    unsolvedSKUs={unsolvedSKUs}
                    onSubmit={handleSaveFallbackPrices}
                />
            )}

            {/* Create SO Modal */}
            {selectedSKU && currentPO && (
                <CreateSOModal
                    open={isSOModalOpen}
                    onClose={() => {
                        setIsSOModalOpen(false);
                        setSelectedSKU(null);
                    }}
                    poId={currentPO.id}
                    skuId={selectedSKU.id}
                    skuName={selectedSKU.name}
                    suggestedQty={selectedSKU.qty}
                    onSuccess={handleSOCreated}
                />
            )}
        </div>
    );
}
