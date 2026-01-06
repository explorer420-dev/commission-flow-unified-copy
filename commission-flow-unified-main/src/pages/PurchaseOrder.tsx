import { useState } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StepBanner } from '@/components/StepBanner';
import { PriceInput } from '@/components/PriceInput';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore, initialItems } from '@/lib/store';
import { Calculator, CheckCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UnsolvedSKU, FallbackEntry } from '@/lib/types';
import { UnsolvedSKUsPanel } from '@/components/UnsolvedSKUsPanel';
import { FallbackPricingModal } from '@/components/FallbackPricingModal';

export default function PurchaseOrder() {
  const navigate = useNavigate();
  const {
    skuItems,
    poStage,
    labourCost,
    transportCost,
    commissionRate,
    updateEPP,
    updateActualPatty,
    submitEPP,
    generateTentativePatty,
    confirmFinalPatty,
    updateASP, // Need this to update store with weighted avg
    updateQuantity // Need this to reset quantity to full PO amount
  } = useAppStore();

  const [unsolvedSKUs, setUnsolvedSKUs] = useState<UnsolvedSKU[]>([]);
  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);

  const handleSubmitEPP = () => {
    const allFilled = skuItems.every(item => item.expectedPurchasePrice !== null && item.expectedPurchasePrice > 0);
    if (!allFilled) {
      toast.error('Please fill all Expected Purchase Prices before submitting');
      return;
    }
    submitEPP();
    toast.success('Expected Purchase Prices submitted. Awaiting SO completion for A-PP generation.');
    // Navigate back to dashboard
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleGeneratePatty = () => {
    // 1. Check for unsold quantities locally
    const newUnsolvedSKUs: UnsolvedSKU[] = [];

    skuItems.forEach(item => {
      // Get the original PO quantity from initialItems (source of truth for PO qty)
      const originalItem = initialItems.find(i => i.id === item.id);
      const poQty = originalItem?.quantity || item.quantity;

      // SO qty is the current quantity if A-SP is entered
      const soQty = item.actualSellingPrice !== null ? item.quantity : 0;

      if (soQty < poQty) {
        newUnsolvedSKUs.push({
          sku_id: item.id,
          sku_name: item.skuName,
          po_qty: poQty,
          closed_qty: soQty,
          unsold_qty: poQty - soQty
        });
      }
    });

    if (newUnsolvedSKUs.length > 0) {
      setUnsolvedSKUs(newUnsolvedSKUs);
      toast.error(`Cannot generate Patty Price: ${newUnsolvedSKUs.length} SKUs have unsold quantities. Please resolve below.`);
      return;
    }

    // 2. If no issues, proceed with generation
    setUnsolvedSKUs([]);
    try {
      generateTentativePatty();
      toast.success('Tentative Seller Patty Prices generated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate Patty Prices';
      toast.error(errorMessage, {
        duration: 8000,
      });
    }
  };

  const handleConfirmFinalPatty = () => {
    confirmFinalPatty();
    toast.success('Final Patty Prices confirmed. Purchase Order workflow complete!');
  };

  const handleSaveFallbackPrices = async (entries: FallbackEntry[]) => {
    // Calculate new weighted A-SP for each affected SKU
    entries.forEach(entry => {
      const item = skuItems.find(i => i.id === entry.sku_id);
      if (!item) return;

      const originalItem = initialItems.find(i => i.id === item.id);
      const poQty = originalItem?.quantity || item.quantity;
      const closedQty = item.quantity; // Current SO quantity
      const closedASP = item.actualSellingPrice || 0;

      const fallbackQty = entry.fallback_qty;
      const fallbackPrice = entry.fallback_a_sp_per_box;

      // Calculate Weighted Average
      const totalValue = (closedQty * closedASP) + (fallbackQty * fallbackPrice);
      const totalQty = closedQty + fallbackQty;
      const weightedASP = totalValue / totalQty;

      // Update Store:
      // 1. Restore the full PO quantity
      updateQuantity(item.id, totalQty);
      // 2. Set the new weighted A-SP
      updateASP(item.id, Math.round(weightedASP * 100) / 100);
    });

    // Clear unsolved state and retry generation
    setUnsolvedSKUs([]);
    setIsFallbackModalOpen(false);
    toast.success('Fallback prices applied. Generating Patty Prices...');

    // Small delay to allow store updates to propagate
    setTimeout(() => {
      handleGeneratePatty();
    }, 100);
  };

  const handleCreateSO = (skuId: string) => {
    // Navigate to SO page to punch remaining quantity
    navigate('/sale-order');
    toast.info('Please enter Sale Order for remaining quantity');
  };

  const getBanner = () => {
    switch (poStage) {
      case 'enter-epp':
        return <StepBanner step={1} totalSteps={4} title="Enter Expected Purchase Prices" variant="info" />;
      case 'awaiting-so':
        return <StepBanner title="Awaiting Sale Order Completion" variant="warning" />;
      case 'generate-app':
        return <StepBanner step={2} totalSteps={4} title="Actual Selling Price received. You may now generate Tentative Seller Patty Price (A-PP)." variant="info" />;
      case 'enter-actual-patty':
        return <StepBanner step={3} totalSteps={4} title="Review and adjust Actual Seller Patty Price" variant="info" />;
      case 'completed':
        return <StepBanner title="Purchase Order Completed Successfully" variant="success" />;
    }
  };

  const getMargin = (item: typeof skuItems[0]) => {
    if (item.actualPattyPrice !== null && item.tentativePattyPrice !== null) {
      return item.tentativePattyPrice - item.actualPattyPrice;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'PO Module' }]} />

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-blue-900">Purchase Order Module</h1>
          <p className="text-blue-700/80">Manage Expected and Actual Purchase Prices with Patty calculations</p>
        </header>

        {getBanner()}

        {/* Unsolved SKUs Warning Panel */}
        {unsolvedSKUs.length > 0 && (
          <UnsolvedSKUsPanel
            unsolvedSKUs={unsolvedSKUs}
            onOpenFallbackModal={() => setIsFallbackModalOpen(true)}
            onCreateSO={handleCreateSO}
          />
        )}

        {poStage === 'generate-app' && !unsolvedSKUs.length && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Calculation Formula</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  A-PP = [A-SP – (Labour ₹{labourCost} + Transport ₹{transportCost})] – NC {(commissionRate * 100).toFixed(0)}% commission
                </p>
              </div>
              <Button onClick={handleGeneratePatty} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Calculator className="h-4 w-4" />
                Generate Tentative Seller Patty Price
              </Button>
            </div>
          </div>
        )}

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <CardTitle>Purchase Pricing Table</CardTitle>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">E-PP:</span>
                <StatusBadge status={poStage === 'enter-epp' ? 'editable' : poStage === 'completed' ? 'completed' : 'locked'} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">A-PP:</span>
                <StatusBadge status={poStage === 'enter-actual-patty' || poStage === 'completed' ? 'completed' : 'locked'} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Actual Patty:</span>
                <StatusBadge status={poStage === 'enter-actual-patty' ? 'editable' : poStage === 'completed' ? 'completed' : 'locked'} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">SKU Name</TableHead>
                  <TableHead className="font-semibold text-right">Qty</TableHead>
                  <TableHead className="font-semibold text-center">Expected Purchase Price (E-PP)</TableHead>
                  <TableHead className="font-semibold text-center">Tentative Seller Patty (A-PP)</TableHead>
                  <TableHead className="font-semibold text-center">Actual Seller Patty Price</TableHead>
                  {(poStage === 'enter-actual-patty' || poStage === 'completed') && (
                    <TableHead className="font-semibold text-right">Margin</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {skuItems.map((item) => {
                  const margin = getMargin(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.skuName}</TableCell>
                      <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        <PriceInput
                          value={item.expectedPurchasePrice}
                          onChange={(value) => updateEPP(item.id, value)}
                          disabled={poStage !== 'enter-epp'}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cn(
                          "font-mono p-2 text-center w-1/2 mx-auto",
                          poStage === 'enter-epp' || poStage === 'awaiting-so' || poStage === 'generate-app'
                            ? "bg-muted/30 text-muted"
                            : "bg-primary/5"
                        )}>
                          {item.tentativePattyPrice !== null
                            ? `₹${item.tentativePattyPrice === 0 ? '0' : item.tentativePattyPrice.toFixed(2)}`
                            : '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <PriceInput
                          value={item.actualPattyPrice}
                          onChange={(value) => updateActualPatty(item.id, value)}
                          disabled={poStage !== 'enter-actual-patty'}
                        />
                      </TableCell>
                      {(poStage === 'enter-actual-patty' || poStage === 'completed') && (
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
              {poStage === 'enter-epp' && (
                <Button onClick={handleSubmitEPP} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Send className="h-4 w-4" />
                  Submit Expected Purchase Prices
                </Button>
              )}
              {poStage === 'awaiting-so' && (
                <Button onClick={() => navigate('/sale-order')} variant="outline" className="gap-2">
                  Complete Sale Order First
                </Button>
              )}
              {poStage === 'enter-actual-patty' && (
                <Button onClick={handleConfirmFinalPatty} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <CheckCircle className="h-4 w-4" />
                  Confirm Final Patty Prices
                </Button>
              )}
              {poStage === 'completed' && (
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
      {unsolvedSKUs.length > 0 && (
        <FallbackPricingModal
          open={isFallbackModalOpen}
          onClose={() => setIsFallbackModalOpen(false)}
          unsolvedSKUs={unsolvedSKUs}
          onSubmit={handleSaveFallbackPrices}
        />
      )}
    </div>
  );
}
