import { Link } from 'react-router-dom';
import { ShoppingCart, Package, ArrowRight, RotateCcw, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { WorkflowGuide } from '@/components/WorkflowGuide';

export default function Dashboard() {
  const { soStage, poStage, resetAll } = useAppStore();

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber === 1) return poStage === 'enter-epp' ? 'active' : 'completed';
    if (stepNumber === 2) {
      if (poStage === 'enter-epp') return 'locked';
      if (poStage === 'awaiting-so') return 'active';
      return 'completed';
    }
    if (stepNumber === 3) {
      if (['enter-epp', 'awaiting-so'].includes(poStage)) return 'locked';
      if (poStage === 'generate-app') return 'active';
      return 'completed';
    }
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
        case 'enter-epp': return { label: 'Pending E-PP Entry', class: 'bg-blue-100 text-blue-600' };
        case 'awaiting-so': return { label: 'Awaiting SO', class: 'bg-amber-100 text-amber-700' };
        case 'generate-app': return { label: 'Ready for A-PP', class: 'bg-blue-100 text-blue-600' };
        case 'enter-actual-patty': return { label: 'Finalizing', class: 'bg-purple-100 text-purple-700' };
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
    <div className="min-h-screen bg-[#F9FAFB] p-4 lg:p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-4">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mb-1">
              Commission Trade Pricing
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Manage Purchase Orders and Sale Orders with unified pricing workflow
            </p>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Demo
          </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Area */}
          <div className="lg:col-span-2 space-y-4">

            {/* Interactive Modules */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Purchase Order Card */}
              <Link to="/purchase-order" className="group">
                <div className="bg-[#f3f8ff] border border-blue-100/50 rounded-xl p-6 h-full shadow-[0_2px_10px_-4px_rgba(59,130,246,0.1)] hover:shadow-[0_4px_14px_-4px_rgba(59,130,246,0.2)] hover:border-blue-200 transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-2.5 bg-blue-100/60 rounded-lg text-blue-500">
                      <Package className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-blue-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Purchase Order Module</h2>
                  <p className="text-slate-500 font-medium text-xs leading-relaxed mb-6 block min-h-[3rem]">Manage Expected and Actual Purchase Prices with Patty calculations</p>

                  <div className="inline-flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Status:</span>
                    <span className={cn("px-2.5 py-1 rounded text-[10px] font-bold", poStatus.class)}>
                      {poStatus.label}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Sale Order Card */}
              <Link to="/sale-order" className="group">
                <div className="bg-[#f2fdf7] border border-emerald-100/50 rounded-xl p-6 h-full shadow-[0_2px_10px_-4px_rgba(16,185,129,0.1)] hover:shadow-[0_4px_14px_-4px_rgba(16,185,129,0.2)] hover:border-emerald-200 transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-2.5 bg-emerald-100/60 rounded-lg text-emerald-500">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-emerald-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Sale Order Module</h2>
                  <p className="text-slate-500 font-medium text-xs leading-relaxed mb-6 block min-h-[3rem]">Enter Expected and Actual Selling Prices for SKU items</p>

                  <div className="inline-flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Status:</span>
                    <span className={cn("px-2.5 py-1 rounded text-[10px] font-bold", soStatus.class)}>
                      {soStatus.label}
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Workflow Stepper */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Workflow Overview</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Unified pricing lifecycle tracking</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#111827]">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Purchase Order Flow
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#111827]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Sale Order Dependency
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <Step
                  number={1}
                  title="Enter Expected Purchase Prices (E-PP)"
                  desc="Initial data entry for PO items"
                  status={getStepStatus(1)}
                  group="po"
                />

                <div className={cn(
                  "relative pl-12 transition-all duration-500",
                  getStepStatus(2) === 'active' ? "opacity-100 Scale-100" : "opacity-90 grayscale-[0.2]"
                )}>
                  {/* Vertical Line Connector */}
                  <div className="absolute -top-8 left-4 w-[2px] h-8 bg-slate-100"></div>

                  <div className={cn(
                    "p-5 rounded-xl border transition-all shadow-sm bg-white",
                    getStepStatus(2) === 'active' || soStage === 'completed'
                      ? "border-emerald-200 border-2"
                      : "border-slate-100"
                  )}>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center bg-white flex-shrink-0 border-2",
                        getStepStatus(2) === 'active' || soStage === 'completed' ? "border-emerald-400" : "border-slate-200"
                      )}>
                        <ShoppingCart className={cn("h-5 w-5", getStepStatus(2) === 'active' || soStage === 'completed' ? "text-emerald-500" : "text-slate-300")} />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={cn("text-sm font-bold mb-1", getStepStatus(2) === 'active' || soStage === 'completed' ? "text-slate-900" : "text-slate-500")}>
                              Sale Order Completion Required
                            </h4>
                            <p className={cn("text-xs font-medium leading-relaxed", getStepStatus(2) === 'active' || soStage === 'completed' ? "text-slate-500" : "text-slate-400")}>
                              Workflow halts here. Complete E-SP and A-SP in the Sale Order Module to unlock final calculations.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                          <SubStep label="Enter E-SP" done={soStage !== 'enter-esp'} />
                          <SubStep label="Enter A-SP" done={soStage === 'completed'} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-8 left-4 w-[2px] h-8 bg-slate-100"></div>
                </div>

                <Step
                  number={3}
                  title="Generate Tentative Patty Prices (A-PP)"
                  desc="Calculated from completed Sale Order data"
                  status={getStepStatus(3)}
                  group="po"
                />

                <Step
                  number={4}
                  title="Confirm Final Patty Prices"
                  desc="Final review and submission"
                  status={getStepStatus(4)}
                  group="po"
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <WorkflowGuide />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, desc, status, group, isLast }: any) {
  const isPO = group === 'po';
  const isActive = status === 'active';
  const isDone = status === 'completed';

  return (
    <div className="relative flex items-start gap-5 group">
      {!isLast && (
        <div className={cn(
          "absolute top-10 left-4 w-[2px] h-full transition-colors duration-500",
          isDone ? (isPO ? "bg-blue-300" : "bg-emerald-300") : "bg-slate-100"
        )} />
      )}

      <div className={cn(
        "relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-white border-2 transition-all duration-300",
        isActive ? "border-blue-500 text-blue-600" :
          isDone ? "border-blue-500 bg-blue-50 text-blue-600" :
            "border-blue-200 text-blue-400"
      )}>
        {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : number}
      </div>

      <div className="flex-1 py-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className={cn(
            "text-[15px] font-bold transition-colors",
            isActive || isDone ? "text-slate-900" : "text-[#111827]"
          )}>
            {title}
          </h4>
          {isActive && <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-600">In Progress</span>}
          {!isActive && !isDone && <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-500">Upcoming</span>}
          {isDone && <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-600">Completed</span>}
        </div>
        <p className={cn(
          "text-xs transition-colors",
          isActive || isDone ? "text-blue-500/80 font-medium" : "text-blue-500/60 font-medium"
        )}>
          {desc}
        </p>
      </div>
    </div>
  );
}

function SubStep({ label, done }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-100/60 bg-white text-[10px] font-bold text-emerald-600 shadow-sm">
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        done ? "bg-emerald-500" : "bg-emerald-200"
      )} />
      {label}
    </div>
  );
}
