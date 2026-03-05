import { useAppStore } from '@/lib/store';
import { ShoppingCart, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SaleOrder() {
  const navigate = useNavigate();
  const {
    skuItems,
    poStage,
    soStage,
    updateESP,
    updateASP,
    submitESP,
    submitASP,
    updateQuantity
  } = useAppStore();

  const getProgressState = () => {
    switch (soStage) {
      case 'enter-esp': return { step: 1, percent: 50, label: 'ENTER EXPECTED SELLING PRICES' };
      case 'enter-asp': return { step: 2, percent: 80, label: 'ENTER ACTUAL SELLING PRICES' };
      case 'completed': return { step: 2, percent: 100, label: 'COMPLETED' };
      default: return { step: 1, percent: 0, label: '' };
    }
  };

  const { step, percent, label } = getProgressState();

  const handleSubmitESP = () => {
    const allFilled = skuItems.every(item => item.expectedSellingPrice !== null && item.expectedSellingPrice > 0);
    if (!allFilled) {
      toast.error('Please fill all Expected Selling Prices');
      return;
    }
    submitESP();
    toast.success('Expected Selling Prices submitted. Moving to Actuals.');
  };

  const handleSubmitASP = () => {
    const allFilled = skuItems.every(item => item.actualSellingPrice !== null && item.actualSellingPrice > 0);
    if (!allFilled) {
      toast.error('Please fill all Actual Selling Prices');
      return;
    }
    submitASP();
    toast.success('Sale Order operations completed!');
    setTimeout(() => {
      navigate('/purchase-order');
    }, 1500);
  };

  if (poStage === 'enter-epp') {
    return (
      <div className="min-h-screen bg-[#f2fdf7] flex flex-col items-center justify-center p-4">
        <ShoppingCart className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Sale Order Locked</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm text-center">
          You must finalize Expected Purchase Prices (E-PP) in the PO module before creating Sale Orders.
        </p>
        <button
          onClick={() => navigate('/purchase-order')}
          className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition"
        >
          Go to Purchase Order
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2fdf7] p-4 lg:p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-4">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
          <span>›</span>
          <span className="font-medium text-slate-900">SO Module</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-xl">
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mb-1">
              Sale Order Module
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Enter target estimates and final realization values to unblock patty calculations.
            </p>
          </div>

          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex justify-between items-end text-xs font-bold">
              <span className="text-emerald-600">Step {step} of 2</span>
              <span className="text-slate-400">{percent}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-500 ease-out"
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
          <div className="p-4 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-[#111827]">Sale Pricing Table</h2>
            <span className="text-xs font-medium text-slate-400">Total Lines: {skuItems.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Ordered Qty</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Selling (E-SP)</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actual Selling (A-SP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {skuItems.map((item) => {
                  const isCompleted = soStage === 'completed';
                  const isESPEditable = soStage === 'enter-esp';
                  const isASPEditable = soStage === 'enter-asp';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-bold rounded tracking-wide",
                          isESPEditable || isASPEditable
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : "bg-[#F3F4F6] text-[#374151]"
                        )}>
                          {(isESPEditable || isASPEditable) ? 'EDITABLE' : 'READ-ONLY'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-[#111827]">{item.skuName}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="relative inline-block w-20 mx-auto">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                            disabled={isCompleted}
                            className={cn(
                              "w-full px-2 py-1 bg-[#F9FAFB] border border-slate-200 rounded text-sm font-bold text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all",
                              isCompleted && "opacity-60 cursor-not-allowed bg-slate-50"
                            )}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="relative max-w-[140px]">
                          <span className={cn(
                            "absolute left-2.5 top-1/2 -translate-y-1/2 text-xs",
                            isESPEditable ? "text-slate-500 font-bold" : "text-slate-300 font-medium"
                          )}>₹</span>
                          <input
                            type="number"
                            value={item.expectedSellingPrice || ''}
                            onChange={(e) => updateESP(item.id, parseFloat(e.target.value) || 0)}
                            disabled={!isESPEditable}
                            className={cn(
                              "w-full pl-6 pr-2 py-1.5 rounded-md text-sm font-bold outline-none transition-all",
                              isESPEditable
                                ? "bg-white border-2 border-slate-200 text-slate-900 hover:border-emerald-400 focus:ring-0 focus:border-emerald-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                                : "bg-[#f9fafb]/50 border border-slate-100 text-slate-400 opacity-60 cursor-not-allowed pointer-events-none"
                            )}
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="relative max-w-[140px]">
                          <span className={cn(
                            "absolute left-2.5 top-1/2 -translate-y-1/2 text-xs",
                            isASPEditable ? "text-slate-500 font-bold" : "text-slate-300 font-medium"
                          )}>₹</span>
                          <input
                            type="number"
                            value={item.actualSellingPrice || ''}
                            onChange={(e) => updateASP(item.id, parseFloat(e.target.value) || 0)}
                            disabled={!isASPEditable}
                            className={cn(
                              "w-full pl-6 pr-2 py-1.5 rounded-md text-sm font-bold outline-none transition-all",
                              isASPEditable
                                ? "bg-white border-2 border-slate-200 text-slate-900 hover:border-emerald-400 focus:ring-0 focus:border-emerald-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
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
          <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors mr-auto"
            >
              Cancel & Save Draft
            </button>

            {soStage === 'enter-esp' && (
              <button
                onClick={handleSubmitESP}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-200 group active:scale-[0.98]"
              >
                Submit Expected Selling Prices
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {soStage === 'enter-asp' && (
              <button
                onClick={handleSubmitASP}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-200 group active:scale-[0.98]"
              >
                Submit Actual Selling Prices
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {soStage === 'completed' && (
              <button
                onClick={() => navigate('/purchase-order')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200 group active:scale-[0.98]"
              >
                Return to PO Module
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Info Box */}
        {soStage !== 'completed' && (
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100/50 flex items-start gap-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 mt-1">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 capitalize">Sale Order Workflow</h3>
              <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                Step 1 requires entering Expected Selling Prices. Once orders are fulfilled, enter the Actual Selling Prices (A-SP) in Step 2. These values are used to automatically calculate the Patty Price in the Purchase Order module.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

