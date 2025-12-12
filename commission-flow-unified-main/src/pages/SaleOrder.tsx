import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StepBanner } from '@/components/StepBanner';
import { PriceInput } from '@/components/PriceInput';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/lib/store';
import { CheckCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SaleOrder() {
  const navigate = useNavigate();
  const { skuItems, soStage, updateESP, updateASP, submitESP, submitASP } = useAppStore();
  
  const handleSubmitESP = () => {
    const allFilled = skuItems.every(item => item.expectedSellingPrice !== null && item.expectedSellingPrice > 0);
    if (!allFilled) {
      toast.error('Please fill all Expected Selling Prices before submitting');
      return;
    }
    submitESP();
    toast.success('Expected Selling Prices submitted successfully');
  };
  
  const handleSubmitASP = () => {
    const allFilled = skuItems.every(item => item.actualSellingPrice !== null && item.actualSellingPrice > 0);
    if (!allFilled) {
      toast.error('Please fill all Actual Selling Prices before submitting');
      return;
    }
    submitASP();
    toast.success('Sale Order completed! PO module can now generate Tentative Patty Prices');
  };
  
  const getBanner = () => {
    switch (soStage) {
      case 'enter-esp':
        return <StepBanner step={1} totalSteps={2} title="Enter Expected Selling Price" variant="info" />;
      case 'enter-asp':
        return <StepBanner step={2} totalSteps={2} title="Enter Actual Selling Price" variant="info" />;
      case 'completed':
        return <StepBanner title="Sale Order Completed Successfully" variant="success" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[{ label: 'SO Module' }]} />
        
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Sale Order Module</h1>
          <p className="text-muted-foreground">Manage Expected and Actual Selling Prices</p>
        </header>
        
        {getBanner()}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>SKU Pricing Table</CardTitle>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">E-SP Status:</span>
                <StatusBadge status={soStage === 'enter-esp' ? 'editable' : soStage === 'completed' ? 'completed' : 'locked'} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">A-SP Status:</span>
                <StatusBadge status={soStage === 'enter-asp' ? 'editable' : soStage === 'completed' ? 'completed' : 'locked'} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">SKU Name</TableHead>
                  <TableHead className="font-semibold text-right">Quantity</TableHead>
                  <TableHead className="font-semibold text-right">Expected Selling Price (E-SP)</TableHead>
                  <TableHead className="font-semibold text-right">Actual Selling Price (A-SP)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.skuName}</TableCell>
                    <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      <PriceInput
                        value={item.expectedSellingPrice}
                        onChange={(value) => updateESP(item.id, value)}
                        disabled={soStage !== 'enter-esp'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <PriceInput
                        value={item.actualSellingPrice}
                        onChange={(value) => updateASP(item.id, value)}
                        disabled={soStage !== 'enter-asp'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-6 flex justify-end gap-4">
              {soStage === 'enter-esp' && (
                <Button onClick={handleSubmitESP} className="gap-2">
                  <Send className="h-4 w-4" />
                  Submit Expected SO
                </Button>
              )}
              {soStage === 'enter-asp' && (
                <Button onClick={handleSubmitASP} className="gap-2">
                  <Send className="h-4 w-4" />
                  Submit Actual SO
                </Button>
              )}
              {soStage === 'completed' && (
                <Button onClick={() => navigate('/purchase-order')} variant="secondary" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Proceed to Purchase Order
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
