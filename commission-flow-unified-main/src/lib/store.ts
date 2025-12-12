import { create } from 'zustand';
import { PurchaseOrder, SaleOrder, APPResult, UnsolvedSKU } from './types';
import { initializeDemoData } from './api';

// Initialize demo data on module load
initializeDemoData();

interface POStoreState {
  currentPO: PurchaseOrder | null;
  currentSOs: SaleOrder[];
  appResults: APPResult[] | null;
  unsolvedSKUs: UnsolvedSKU[] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentPO: (po: PurchaseOrder) => void;
  setCurrentSOs: (sos: SaleOrder[]) => void;
  setAPPResults: (results: APPResult[] | null) => void;
  setUnsolvedSKUs: (skus: UnsolvedSKU[] | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updatePOItem: (skuId: string, updates: Partial<PurchaseOrder['items'][0]>) => void;
  updatePOStatus: (status: PurchaseOrder['status']) => void;
  clearAPPState: () => void;
}

export const usePOStore = create<POStoreState>((set) => ({
  currentPO: null,
  currentSOs: [],
  appResults: null,
  unsolvedSKUs: null,
  isLoading: false,
  error: null,

  setCurrentPO: (po) => set({ currentPO: po }),
  setCurrentSOs: (sos) => set({ currentSOs: sos }),
  setAPPResults: (results) => set({ appResults: results }),
  setUnsolvedSKUs: (skus) => set({ unsolvedSKUs: skus }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  updatePOItem: (skuId, updates) => set((state) => {
    if (!state.currentPO) return state;

    return {
      currentPO: {
        ...state.currentPO,
        items: state.currentPO.items.map(item =>
          item.sku_id === skuId ? { ...item, ...updates } : item
        ),
      },
    };
  }),

  updatePOStatus: (status) => set((state) => {
    if (!state.currentPO) return state;

    return {
      currentPO: {
        ...state.currentPO,
        status,
      },
    };
  }),

  clearAPPState: () => set({
    appResults: null,
    unsolvedSKUs: null,
    error: null,
  }),
}));

// Legacy store for backward compatibility with SO module
export interface SKUItem {
  id: string;
  skuName: string;
  quantity: number;
  expectedSellingPrice: number | null;
  actualSellingPrice: number | null;
  expectedPurchasePrice: number | null;
  tentativePattyPrice: number | null;
  actualPattyPrice: number | null;
}

export type SOStage = 'enter-esp' | 'enter-asp' | 'completed';
export type POStage = 'enter-epp' | 'awaiting-so' | 'generate-app' | 'enter-actual-patty' | 'completed';

interface AppState {
  skuItems: SKUItem[];
  soStage: SOStage;
  poStage: POStage;
  labourCost: number;
  transportCost: number;
  commissionRate: number;

  // Actions
  updateQuantity: (id: string, value: number) => void;
  updateESP: (id: string, value: number) => void;
  updateASP: (id: string, value: number) => void;
  updateEPP: (id: string, value: number) => void;
  updateActualPatty: (id: string, value: number) => void;
  submitESP: () => void;
  submitASP: () => void;
  submitEPP: () => void;
  generateTentativePatty: () => void;
  confirmFinalPatty: () => void;
  resetAll: () => void;
}

export const initialItems: SKUItem[] = [
  { id: '1', skuName: 'Basmati Rice 25kg', quantity: 100, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
  { id: '2', skuName: 'Wheat Flour 50kg', quantity: 200, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
  { id: '3', skuName: 'Sunflower Oil 15L', quantity: 50, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
  { id: '4', skuName: 'Sugar Refined 25kg', quantity: 150, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
  { id: '5', skuName: 'Dal Moong 10kg', quantity: 80, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
];

export const useAppStore = create<AppState>((set, get) => ({
  skuItems: initialItems,
  soStage: 'enter-esp',
  poStage: 'enter-epp',
  labourCost: 50,
  transportCost: 30,
  commissionRate: 0.06,

  updateQuantity: (id, value) => set((state) => ({
    skuItems: state.skuItems.map(item =>
      item.id === id ? { ...item, quantity: value } : item
    )
  })),

  updateESP: (id, value) => set((state) => ({
    skuItems: state.skuItems.map(item =>
      item.id === id ? { ...item, expectedSellingPrice: value } : item
    )
  })),

  updateASP: (id, value) => set((state) => ({
    skuItems: state.skuItems.map(item =>
      item.id === id ? { ...item, actualSellingPrice: value } : item
    )
  })),

  updateEPP: (id, value) => set((state) => ({
    skuItems: state.skuItems.map(item =>
      item.id === id ? { ...item, expectedPurchasePrice: value } : item
    )
  })),

  updateActualPatty: (id, value) => set((state) => ({
    skuItems: state.skuItems.map(item =>
      item.id === id ? { ...item, actualPattyPrice: value } : item
    )
  })),

  submitESP: () => set({ soStage: 'enter-asp' }),

  submitASP: async () => {
    const state = get();

    // Import saveSO function dynamically to avoid circular dependency
    const { saveSO } = await import('./api');

    // Map legacy SKU IDs to new system SKU IDs
    const skuIdMap: Record<string, string> = {
      '1': 'SKU-003', // Basmati Rice 25kg
      '2': 'SKU-004', // Wheat Flour 50kg (not in PO, will be ignored by validation)
      '3': 'SKU-005', // Sunflower Oil 15L (not in PO, will be ignored by validation)
      '4': 'SKU-006', // Sugar Refined 25kg (not in PO, will be ignored by validation)
      '5': 'SKU-007', // Dal Moong 10kg (not in PO, will be ignored by validation)
    };

    // Create SO records for each SKU with A-SP
    const soPromises = state.skuItems
      .filter(item => item.actualSellingPrice !== null && item.quantity > 0)
      .map(async (item, index) => {
        const so = {
          id: `SO-LEGACY-${item.id}-${Date.now()}-${index}`,
          po_id: 'PO-001', // Link to demo PO
          customer_id: 'CUSTOMER-001',
          status: 'ACTUAL_SUBMITTED' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: [{
            sku_id: skuIdMap[item.id] || `SKU-${item.id}`,
            sku_name: item.skuName,
            so_qty: item.quantity,
            e_sp: item.expectedSellingPrice,
            a_sp: item.actualSellingPrice,
            status: 'ACTUAL_SUBMITTED' as const,
          }]
        };

        return saveSO(so);
      });

    await Promise.all(soPromises);

    set({
      soStage: 'completed',
      poStage: state.poStage === 'awaiting-so' ? 'generate-app' : state.poStage
    });
  },

  submitEPP: () => set({ poStage: 'awaiting-so' }),

  generateTentativePatty: () => {
    const state = get();

    // Validate that SO quantities match original PO quantities
    const mismatches: Array<{ skuName: string; poQty: number; soQty: number; diff: number }> = [];

    state.skuItems.forEach(item => {
      // Get the original PO quantity from initialItems
      const originalItem = initialItems.find(i => i.id === item.id);
      const poQty = originalItem?.quantity || item.quantity;

      // SO qty is the current quantity if A-SP is entered
      const soQty = item.actualSellingPrice !== null ? item.quantity : 0;

      // Check if there's a mismatch
      if (soQty < poQty) {
        mismatches.push({
          skuName: item.skuName,
          poQty: poQty,
          soQty: soQty,
          diff: poQty - soQty
        });
      }
    });

    // If there are mismatches, throw an error
    if (mismatches.length > 0) {
      const totalMissing = mismatches.reduce((sum, m) => sum + m.diff, 0);
      const errorMsg = `Cannot generate Patty Price: ${totalMissing} units across ${mismatches.length} SKU(s) don't have matching Sale Orders.\n\n` +
        mismatches.map(m => `• ${m.skuName}: PO Qty ${m.poQty}, SO Qty ${m.soQty} (${m.diff} units left without SO)`).join('\n');

      throw new Error(errorMsg);
    }

    return set((state) => ({
      skuItems: state.skuItems.map(item => {
        if (item.actualSellingPrice !== null) {
          const tentative = (item.actualSellingPrice - (state.labourCost + state.transportCost)) * (1 - state.commissionRate);
          return { ...item, tentativePattyPrice: Math.round(tentative * 100) / 100, actualPattyPrice: tentative };
        }
        return item;
      }),
      poStage: 'enter-actual-patty'
    }));
  },

  confirmFinalPatty: () => set({ poStage: 'completed' }),

  resetAll: () => set({
    skuItems: initialItems,
    soStage: 'enter-esp',
    poStage: 'enter-epp'
  })
}));
