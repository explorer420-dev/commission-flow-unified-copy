import { Link } from 'react-router-dom';
import { ShoppingCart, Package, ArrowRight, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

export default function Dashboard() {
  const { soStage, poStage, resetAll } = useAppStore();
  
  const getSOStatus = () => {
    switch (soStage) {
      case 'enter-esp': return { label: 'Pending E-SP Entry', color: 'text-muted-foreground' };
      case 'enter-asp': return { label: 'Awaiting A-SP Entry', color: 'text-primary' };
      case 'completed': return { label: 'Completed', color: 'text-chart-3' };
    }
  };
  
  const getPOStatus = () => {
    switch (poStage) {
      case 'enter-epp': return { label: 'Pending E-PP Entry', color: 'text-muted-foreground' };
      case 'awaiting-so': return { label: 'Awaiting SO Completion', color: 'text-primary' };
      case 'generate-app': return { label: 'Ready for A-PP Generation', color: 'text-primary' };
      case 'enter-actual-patty': return { label: 'Enter Final Patty Prices', color: 'text-primary' };
      case 'completed': return { label: 'Completed', color: 'text-chart-3' };
    }
  };
  
  const soStatus = getSOStatus();
  const poStatus = getPOStatus();
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Commission Trade Pricing
              </h1>
              <p className="text-muted-foreground">
                Manage Purchase Orders and Sale Orders with unified pricing workflow
              </p>
            </div>
            <Button variant="outline" onClick={resetAll} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset Demo
            </Button>
          </div>
        </header>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/sale-order" className="group">
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary/10">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl mt-4">Sale Order Module</CardTitle>
                <CardDescription>
                  Enter Expected and Actual Selling Prices for SKU items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`text-sm font-semibold ${soStatus.color}`}>
                    {soStatus.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/purchase-order" className="group">
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-secondary/20">
                    <Package className="h-6 w-6 text-secondary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl mt-4">Purchase Order Module</CardTitle>
                <CardDescription>
                  Manage Expected and Actual Purchase Prices with Patty calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`text-sm font-semibold ${poStatus.color}`}>
                    {poStatus.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        <div className="mt-10 p-6 bg-card border border-border">
          <h2 className="text-lg font-semibold mb-4">Workflow Overview</h2>
          <div className="flex flex-col md:flex-row gap-4 text-sm">
            <div className="flex-1 p-4 bg-background border border-border">
              <h3 className="font-medium text-primary mb-2">1. Sale Order</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Enter Expected Selling Prices (E-SP)</li>
                <li>• Submit and lock E-SP values</li>
                <li>• Enter Actual Selling Prices (A-SP)</li>
                <li>• Complete SO to unlock PO calculations</li>
              </ul>
            </div>
            <div className="flex-1 p-4 bg-background border border-border">
              <h3 className="font-medium text-secondary mb-2">2. Purchase Order</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Enter Expected Purchase Prices (E-PP)</li>
                <li>• Wait for SO completion</li>
                <li>• Generate Tentative Patty Prices (A-PP)</li>
                <li>• Confirm Final Patty Prices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
