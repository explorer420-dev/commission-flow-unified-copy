import { useState } from 'react';
import { useAppStore, initialItems } from '@/lib/store';
import { Calculator, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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
    updateASP,
    updateQuantity
  } = useAppStore();

  const [unsolvedSKUs, setUnsolvedSKUs] = useState<UnsolvedSKU[]>([]);
  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);

  // Map poStage to percentage and step number
  const getProgressState = () => {
    switch (poStage) {
      case 'enter-epp': return { step: 1, percent: 25, label: 'ENTER EXPECTED PURCHASE PRICES' };
      case 'awaiting-so': return { step: 2, percent: 50, label: 'AWAITING SALE ORDER' };
      case 'generate-app': return { step: 3, percent: 75, label: 'GENERATE A-PP' };
      case 'enter-actual-patty': return { step: 4, percent: 90, label: 'FINAL CONFIRM' };
      case 'completed': return { step: 4, percent: 100, label: 'COMPLETED' };
      default: return { step: 1, percent: 0, label: '' };
    }
  };

  const { step, percent, label } = getProgressState();

  const handleSubmitEPP = () => {
    const allFilled = skuItems.every(item => item.expectedPurchasePrice !== null && item.expectedPurchasePrice > 0);
    if (!allFilled) {
      toast.error('Please fill all Expected Purchase Prices before submitting');
      return;
    }
    submitEPP();
    toast.success('Expected Purchase Prices submitted. Awaiting SO completion for A-PP generation.');
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleGeneratePatty = () => {
    const newUnsolvedSKUs: UnsolvedSKU[] = [];
    skuItems.forEach(item => {
      const originalItem = initialItems.find(i => i.id === item.id);
      const poQty = originalItem?.quantity || item.quantity;
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

    setUnsolvedSKUs([]);
    try {
      generateTentativePatty();
      toast.success('Tentative Seller Patty Prices generated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate Patty Prices';
      toast.error(errorMessage, { duration: 8000 });
    }
  };

  const handleConfirmFinalPatty = () => {
    confirmFinalPatty();
    toast.success('Final Patty Prices confirmed. Purchase Order workflow complete!');
  };

  const handleSaveFallbackPrices = async (entries: FallbackEntry[]) => {
    entries.forEach(entry => {
      const item = skuItems.find(i => i.id === entry.sku_id);
      if (!item) return;
      const originalItem = initialItems.find(i => i.id === item.id);
      const poQty = originalItem?.quantity || item.quantity;
      const closedQty = item.quantity;
      const closedASP = item.actualSellingPrice || 0;
      const fallbackQty = entry.fallback_qty;
      const fallbackPrice = entry.fallback_a_sp_per_box;
      const totalValue = (closedQty * closedASP) + (fallbackQty * fallbackPrice);
      const totalQty = closedQty + fallbackQty;
      const weightedASP = totalValue / totalQty;
      updateQuantity(item.id, totalQty);
      updateASP(item.id, Math.round(weightedASP * 100) / 100);
    });
    setUnsolvedSKUs([]);
    setIsFallbackModalOpen(false);
    toast.success('Fallback prices applied. Generating Patty Prices...');
    setTimeout(() => {
      handleGeneratePatty();
    }, 100);
  };

  const handleCreateSO = (skuId: string) => {
    navigate('/sale-order');
    toast.info('Please enter Sale Order for remaining quantity');
  };

  const getMargin = (item: typeof skuItems[0]) => {
    if (item.actualPattyPrice !== null && item.tentativePattyPrice !== null) {
      return item.tentativePattyPrice - item.actualPattyPrice;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f3f8ff] p-4 lg:p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-4">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>›</span>
          <span className="font-medium text-slate-900">PO Module</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-xl">
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mb-1">
              Purchase Order Module
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Manage and finalize purchase prices for incoming inventory items with precision.
            </p>
          </div>

          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex justify-between items-end text-xs font-bold">
              <span className="text-blue-600">Step {step} of 4</span>
              <span className="text-slate-400">{percent}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase text-right">
              CURRENT: {label}
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50">
            <h2 className="text-sm font-bold text-[#111827]">Purchase Pricing Table</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Qty</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exp. Purchase Price (E-PP)</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Tentative Patty (A-PP)</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actual Patty Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {skuItems.map((item) => {
                  const isEPPEditable = poStage === 'enter-epp';
                  const isActualPattyEditable = poStage === 'enter-actual-patty';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-bold rounded tracking-wide",
                          isEPPEditable || isActualPattyEditable
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : "bg-[#F3F4F6] text-[#374151]"
                        )}>
                          {(isEPPEditable || isActualPattyEditable) ? 'EDITABLE' : 'READ-ONLY'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-[#111827]">{item.skuName}</span>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-600 font-medium text-sm">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3">
                        <div className="relative max-w-[140px]">
                          <span className={cn(
                            "absolute left-2.5 top-1/2 -translate-y-1/2 text-xs",
                            isEPPEditable ? "text-slate-500 font-bold" : "text-slate-300 font-medium"
                          )}>₹</span>
                          <input
                            type="number"
                            value={item.expectedPurchasePrice || ''}
                            onChange={(e) => updateEPP(item.id, parseFloat(e.target.value) || 0)}
                            disabled={!isEPPEditable}
                            className={cn(
                              "w-full pl-6 pr-2 py-1.5 rounded-md text-sm font-bold outline-none transition-all",
                              isEPPEditable
                                ? "bg-white border-2 border-slate-200 text-slate-900 hover:border-blue-400 focus:ring-0 focus:border-blue-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                                : "bg-[#f9fafb]/50 border border-slate-100 text-slate-400 opacity-60 cursor-not-allowed pointer-events-none"
                            )}
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-slate-500 font-medium tracking-tight text-sm">
                          {item.tentativePattyPrice !== null ? `₹${item.tentativePattyPrice.toFixed(2)}` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="relative max-w-[140px]">
                          <span className={cn(
                            "absolute left-2.5 top-1/2 -translate-y-1/2 text-xs",
                            isActualPattyEditable ? "text-slate-500 font-bold" : "text-slate-300 font-medium"
                          )}>₹</span>
                          <input
                            type="number"
                            value={item.actualPattyPrice || ''}
                            onChange={(e) => updateActualPatty(item.id, parseFloat(e.target.value) || 0)}
                            disabled={!isActualPattyEditable}
                            className={cn(
                              "w-full pl-6 pr-2 py-1.5 rounded-md text-sm font-bold outline-none transition-all",
                              isActualPattyEditable
                                ? "bg-white border-2 border-slate-200 text-slate-900 hover:border-blue-400 focus:ring-0 focus:border-blue-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                                : "bg-[#f9fafb]/50 border border-slate-100 text-slate-400 opacity-60 cursor-not-allowed pointer-events-none"
                            )}
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-400 italic">
              {skuItems.length} items displayed
            </span>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel & Save Draft
              </button>

              {poStage === 'enter-epp' && (
                <button
                  onClick={handleSubmitEPP}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200 group active:scale-[0.98]"
                >
                  Submit Expected Purchase Prices
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {poStage === 'enter-actual-patty' && (
                <button
                  onClick={handleConfirmFinalPatty}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200 group active:scale-[0.98]"
                >
                  Confirm Final Patty Prices
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {poStage === 'awaiting-so' && (
                <button
                  onClick={() => navigate('/sale-order')}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-amber-200 group active:scale-[0.98]"
                >
                  Complete Sale Order
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {poStage === 'completed' && (
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-200 group active:scale-[0.98]"
                >
                  Back to Dashboard
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Specialized Panels (Warnings, etc) */}
        {unsolvedSKUs.length > 0 && (
          <UnsolvedSKUsPanel
            unsolvedSKUs={unsolvedSKUs}
            onOpenFallbackModal={() => setIsFallbackModalOpen(true)}
            onCreateSO={handleCreateSO}
          />
        )}

        {poStage === 'generate-app' && !unsolvedSKUs.length && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Calculation Formula</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                A-PP = [A-SP – (Labour ₹{labourCost} + Transport ₹{transportCost})] – NC {(commissionRate * 100).toFixed(0)}% commission
              </p>
            </div>
            <button
              onClick={handleGeneratePatty}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200 active:scale-[0.98]"
            >
              <Calculator className="h-4 w-4" />
              Generate A-PP
            </button>
          </div>
        )}
      </div>

      {/* Keep existing Dialogs/Modals */}
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

