import { Link } from 'react-router-dom';
import { ShoppingCart, Package, ArrowRight, RotateCcw, Check, Lock, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, POStage, SOStage } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { soStage, poStage, resetAll } = useAppStore();

  // Helper to determine step status
  const getStepStatus = (stepNumber: number) => {
    // Step 1: E-PP
    if (stepNumber === 1) {
      if (poStage === 'enter-epp') return 'active';
      return 'completed';
    }
    // Step 2: SO Dependency
    if (stepNumber === 2) {
      if (poStage === 'enter-epp') return 'locked';
      if (poStage === 'awaiting-so') return 'active';
      return 'completed';
    }
    // Step 3: Generate A-PP
    if (stepNumber === 3) {
      if (['enter-epp', 'awaiting-so'].includes(poStage)) return 'locked';
      if (poStage === 'generate-app') return 'active';
      return 'completed';
    }
    // Step 4: Final Confirm
    if (stepNumber === 4) {
      if (poStage === 'enter-actual-patty') return 'active';
      if (poStage === 'completed') return 'completed';
      return 'locked';
    }
    return 'locked';
  };

  const getModuleStatus = (type: 'po' | 'so') => {
    if (type === 'po') {
      switch (poStage) {
        case 'enter-epp': return { label: 'Pending E-PP Entry', class: 'bg-blue-100 text-blue-700' };
        case 'awaiting-so': return { label: 'Awaiting Sale Order', class: 'bg-amber-100 text-amber-700' };
        case 'generate-app': return { label: 'Ready for A-PP', class: 'bg-blue-100 text-blue-700' };
        case 'enter-actual-patty': return { label: 'Finalizing', class: 'bg-indigo-100 text-indigo-700' };
        case 'completed': return { label: 'Completed', class: 'bg-emerald-100 text-emerald-700' };
      }
    } else {
      switch (soStage) {
        case 'enter-esp': return { label: 'Pending E-SP Entry', class: 'bg-emerald-100 text-emerald-700' };
        case 'enter-asp': return { label: 'Pending A-SP Entry', class: 'bg-amber-100 text-amber-700' };
        case 'completed': return { label: 'Completed', class: 'bg-emerald-100 text-emerald-700' };
      }
    }
  };

  const poStatus = getModuleStatus('po')!;
  const soStatus = getModuleStatus('so')!;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Commission Trade Pricing
            </h1>
            <p className="text-slate-500">
              Manage Purchase Orders and Sale Orders with unified pricing workflow
            </p>
          </div>
          <Button variant="outline" onClick={resetAll} className="gap-2 bg-white hover:bg-slate-50">
            <RotateCcw className="h-4 w-4" />
            Reset Demo
          </Button>
        </header>

        {/* Modules Grid - Interactive */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* PO Module Card */}
          <Link to="/purchase-order" className="block group">
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 h-full transition-all duration-300 hover:shadow-lg hover:border-blue-200">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Package className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-blue-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Purchase Order Module</h2>
              <p className="text-slate-500 text-sm mb-4">Manage Expected and Actual Purchase Prices with Patty calculations</p>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Status:</span>
                <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold", poStatus.class)}>
                  {poStatus.label}
                </span>
              </div>
            </div>
          </Link>

          {/* SO Module Card */}
          <Link to="/sale-order" className="block group">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 h-full transition-all duration-300 hover:shadow-lg hover:border-emerald-200">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Sale Order Module</h2>
              <p className="text-slate-500 text-sm mb-4">Enter Expected and Actual Selling Prices for SKU items</p>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Status:</span>
                <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold", soStatus.class)}>
                  {soStatus.label}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Workflow Overview - Read Only */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Workflow Overview</h3>
              <p className="text-xs text-slate-500">Unified pricing lifecycle tracking</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Purchase Order Flow
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Sale Order Dependency
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* Step 1 */}
            <WorkflowStep
              number={1}
              title="Enter Expected Purchase Prices (E-PP)"
              description="Initial data entry for PO items"
              status={getStepStatus(1)}
              type="po"
            />

            {/* Step 2 - SO Dependency */}
            <div className={cn(
              "relative rounded-xl border-2 p-4 transition-all",
              // Always show emerald theme, just slightly different intensity or border for active vs locked
              getStepStatus(2) === 'active'
                ? "border-emerald-500 bg-emerald-50"
                : "border-emerald-200 bg-emerald-50/30"
            )}>
              {/* Connector Line */}
              <div className="absolute -top-6 left-8 w-0.5 h-6 bg-slate-200"></div>

              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 bg-white",
                  // Always emerald colors
                  "border-emerald-500 text-emerald-600"
                )}>
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-base text-emerald-900">
                        Sale Order Completion Required
                      </h4>
                      <p className="text-emerald-700/80 text-xs mt-1">
                        Workflow halts here. Complete E-SP and A-SP in the Sale Order Module to unlock final calculations.
                      </p>
                    </div>
                  </div>

                  {/* Sub-steps pills */}
                  <div className="flex gap-2 mt-4">
                    <span className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5",
                      soStage !== 'enter-esp' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white text-emerald-600 border-emerald-200"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", soStage !== 'enter-esp' ? "bg-emerald-500" : "bg-emerald-200")}></span>
                      Enter E-SP
                    </span>
                    <span className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5",
                      soStage === 'completed' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white text-emerald-600 border-emerald-200"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", soStage === 'completed' ? "bg-emerald-500" : "bg-emerald-200")}></span>
                      Enter A-SP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <WorkflowStep
              number={3}
              title="Generate Tentative Patty Prices (A-PP)"
              description="Calculated from completed Sale Order data"
              status={getStepStatus(3)}
              type="po"
            />

            {/* Step 4 */}
            <WorkflowStep
              number={4}
              title="Confirm Final Patty Prices"
              description="Final review and submission"
              status={getStepStatus(4)}
              type="po"
              isLast
            />

          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for Cleaner Code
function WorkflowStep({
  number,
  title,
  description,
  status,
  type,
  isLast = false
}: {
  number: number,
  title: string,
  description: string,
  status: 'locked' | 'active' | 'completed',
  type: 'po' | 'so',
  isLast?: boolean
}) {
  const isBlue = type === 'po';
  // Define dynamic colors based on type
  const activeColor = isBlue ? "border-blue-500 text-blue-600 bg-blue-50" : "border-emerald-500 text-emerald-600 bg-emerald-50";
  const completedColor = isBlue ? "border-blue-500 bg-blue-500 text-white" : "border-emerald-500 bg-emerald-500 text-white";
  const lockedColor = isBlue ? "border-blue-200 text-blue-400 bg-white" : "border-emerald-200 text-emerald-400 bg-white";

  const titleColor = isBlue ? "text-blue-900" : "text-emerald-900";
  const descColor = isBlue ? "text-blue-600/70" : "text-emerald-600/70";

  return (
    // Removed opacity-60 for locked state to keep full colors visibility
    <div className={cn("relative flex items-start gap-4")}>
      {!isLast && (
        <div className={cn(
          "absolute top-12 left-6 w-0.5 h-full -ml-px",
          status === 'completed' ? (isBlue ? "bg-blue-500" : "bg-emerald-500") : "bg-slate-200"
        )} />
      )}

      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base font-bold border-2 transition-colors z-10",
        status === 'active' ? activeColor :
          status === 'completed' ? completedColor :
            lockedColor
      )}>
        {status === 'completed' ? <Check className="h-5 w-5" /> : number}
      </div>

      <div className="flex-1 py-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className={cn("font-semibold text-base", titleColor)}>
              {title}
            </h4>
            <p className={cn("text-xs mt-1", descColor)}>{description}</p>
          </div>

          <div className="min-w-[80px] flex justify-end">
            {status === 'active' && <span className={cn("text-xs font-medium px-2 py-1 rounded animate-pulse", isBlue ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700")}>In Progress</span>}
            {status === 'locked' && <span className={cn("text-xs font-medium px-2 py-1 rounded flex items-center gap-1", isBlue ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600")}>Upcoming</span>}
            {status === 'completed' && <span className={cn("text-xs font-medium px-2 py-1 rounded flex items-center gap-1", isBlue ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700")}><Check className="h-3 w-3" /> Done</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
