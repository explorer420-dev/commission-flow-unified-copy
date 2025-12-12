import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StepBanner } from '@/components/StepBanner';
import { PriceInput } from '@/components/PriceInput';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import { Calculator, CheckCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    confirmFinalPatty 
  } = useAppStore();
  
  const handleSubmitEPP = () => {
    const allFilled = skuItems.every(item => item.expectedPurchasePrice !== null && item.expectedPurchasePrice > 0);
    if (!allFilled) {
      toast.error('Please fill all Expected Purchase Prices before submitting');
      return;
    }
    submitEPP();
    toast.success('Expected Purchase Prices submitted. Awaiting SO completion for A-PP generation.');
  };
  
  const handleGeneratePatty = () => {
    generateTentativePatty();
    toast.success('Tentative Seller Patty Prices generated');
  };
  
  const handleConfirmFinalPatty = () => {
    confirmFinalPatty();
    toast.success('Final Patty Prices confirmed. Purchase Order workflow complete!');
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'PO Module' }]} />
        
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Purchase Order Module</h1>
          <p className="text-muted-foreground">Manage Expected and Actual Purchase Prices with Patty calculations</p>
        </header>
        
        {getBanner()}
        
        {poStage === 'generate-app' && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Calculation Formula</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  A-PP = [A-SP – (Labour ₹{labourCost} + Transport ₹{transportCost})] – NC {(commissionRate * 100).toFixed(0)}% commission
                </p>
              </div>
              <Button onClick={handleGeneratePatty} className="gap-2">
                <Calculator className="h-4 w-4" />
                Generate Tentative Seller Patty Price
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
                  <TableHead className="font-semibold text-right">Expected Purchase Price (E-PP)</TableHead>
                  <TableHead className="font-semibold text-right">Tentative Seller Patty (A-PP)</TableHead>
                  <TableHead className="font-semibold text-right">Actual Seller Patty Price</TableHead>
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
                          "font-mono p-2 text-right",
                          poStage === 'enter-epp' || poStage === 'awaiting-so' || poStage === 'generate-app' 
                            ? "bg-muted/30 text-muted" 
                            : "bg-primary/5"
                        )}>
                          {item.tentativePattyPrice !== null 
                            ? `₹${item.tentativePattyPrice.toFixed(2)}` 
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
                            {margin !== null ? `₹${margin.toFixed(2)}` : '—'}
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
                <Button onClick={handleSubmitEPP} className="gap-2">
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
                <Button onClick={handleConfirmFinalPatty} className="gap-2">
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
    </div>
  );
}
