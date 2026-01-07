
import React from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Check, Lightbulb } from 'lucide-react';

interface WorkflowStep {
    id: number;
    title: string;
    description: string;
    module: 'po' | 'so' | 'nav';
}

export function WorkflowGuide() {
    const { poStage, soStage } = useAppStore();

    const steps: WorkflowStep[] = [
        {
            id: 1,
            title: "Entering details into a Purchase Order (PO)",
            description: "Introducing 'EXPECTED PURCHASE PRICE': Since it’s a commission model trade and the purchase price from seller is decided only after all the goods are sold to the Trader, however we need to have an E-PP to be able to close the PO in the system.",
            module: 'po'
        },
        {
            id: 2,
            title: "Punching Sale Order (SO) with Expected Selling Price",
            description: "Though the actual Sale Order with 'Actual Selling Price' (A-SP) is punched when the goods are sold in entirety in commission mode. However, for the sake of closing SO in finance books, we ask the user to enter 'Expected Selling Price' (E-SP).",
            module: 'so'
        },
        {
            id: 3,
            title: "Punching Sale Order (SO) with Actual Selling Price",
            description: "After all the goods are sold, 'Actual Selling Price' (A-SP) is entered in the SO. This is the Selling Price realised by Trader. This marks the closure of the Sale Order punching.",
            module: 'so'
        },
        {
            id: 4,
            title: "System generates 'Actual Purchase Price' (A-PP) on click",
            description: "The 'Actual Purchase Price' (A-PP) now becomes the Purchase Price for Ninjacart. Calculated as: Actual Purchase Price = [Actual Selling Price - (labour + transport)] - [6% commission]. Since all variables are present, this is calculated by the system via 'Generate Tentative Seller Patty Price'.",
            module: 'po'
        },
        {
            id: 5,
            title: "Manually Editing the 'Seller Patty Price'",
            description: "Now that 'Tentative Seller Patty Price' is calculated, the user can edit a separate field called 'Seller Patty Price' against each SKU. This is the price shown to the seller. The difference between 'Seller Patty Price' and 'Tentative Seller Patty Price' is the profit margin.",
            module: 'po'
        }
    ];



    // Refined logic for linear progress visualization
    // We need to simplify "active" logic because strict state mapping might duplicate "active" states visually.
    // Actually, standard logic:
    // - If stage is X, then steps leading up to X are done.
    // - Current step is active.
    // - Future steps are pending.

    const getCurrentActiveStep = () => {
        // Step 1: Entering PO Details
        if (poStage === 'enter-epp') return 1;

        // Step 2 & 3: Sale Order Stages
        if (poStage === 'awaiting-so') {
            if (soStage === 'enter-esp') return 2;
            if (soStage === 'enter-asp') return 3;
            if (soStage === 'completed') return 4; // Moved past SO, onto generation
        }

        // Step 4: Generate Patty
        if (poStage === 'generate-app') return 4;

        // Step 5: Final Editing
        if (poStage === 'enter-actual-patty') return 5;

        // Completed
        if (poStage === 'completed') return 6;

        return 1;
    };

    const activeStepId = getCurrentActiveStep();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-slate-900">Workflow Guide</h3>
            </div>

            <div className="p-0">
                {steps.map((step, index) => {
                    const isActive = activeStepId === step.id;
                    const isCompleted = activeStepId > step.id;

                    // Determine colors based on module
                    let activeColorClass = "bg-slate-600 border-slate-600 ring-slate-100";
                    let activeTitleClass = "text-slate-900";

                    if (step.module === 'po') {
                        activeColorClass = "bg-blue-500 border-blue-500 ring-blue-100";
                        activeTitleClass = "text-blue-700";
                    } else if (step.module === 'so') {
                        activeColorClass = "bg-emerald-500 border-emerald-500 ring-emerald-100";
                        activeTitleClass = "text-emerald-700";
                    } else if (step.module === 'nav') {
                        activeColorClass = "bg-slate-500 border-slate-500 ring-slate-100";
                        activeTitleClass = "text-slate-700";
                    }

                    return (
                        <div key={step.id} className={cn(
                            "relative pl-4 pr-5 py-5 border-b border-slate-50 last:border-0 flex gap-4 transition-all",
                            isActive ? "bg-slate-50/80 shadow-[inset_0_0_10px_rgba(0,0,0,0.01)]" : "bg-white"
                        )}>
                            {/* Vertical line connector */}
                            {index !== steps.length - 1 && (
                                <div className="absolute left-[27px] top-12 w-0.5 h-full bg-slate-100 -z-10" />
                            )}

                            {/* Number Bubble */}
                            <div className={cn(
                                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border mt-0.5 transition-colors z-10",
                                isCompleted
                                    ? "bg-slate-100 border-slate-200 text-slate-400" // Completed
                                    : isActive
                                        ? cn("text-white shadow-sm ring-4", activeColorClass) // Active
                                        : "bg-white border-slate-200 text-slate-300" // Pending
                            )}>
                                {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                            </div>

                            {/* Content */}
                            <div className={cn("flex-1 transition-opacity space-y-2",
                                !isActive && !isCompleted && "opacity-40"
                            )}>
                                <h4 className={cn(
                                    "text-sm font-bold leading-tight",
                                    isActive ? activeTitleClass : "text-slate-600"
                                )}>
                                    {step.title}
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-blue-50 border-t border-blue-100">
                <div className="flex gap-2 items-start">
                    <div className="min-w-[4px] h-4 bg-blue-400 rounded-full mt-1"></div>
                    <p className="text-xs text-blue-700">
                        <span className="font-semibold">Tip:</span> You cannot proceed to step 3 without completing the Sales Order dependency.
                    </p>
                </div>
            </div>
        </div>
    );
}
