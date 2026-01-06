import { create } from 'zustand';

// Removing unused types




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
  { id: '1', skuName: 'Blueberry', quantity: 100, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
  { id: '2', skuName: 'Avocado (16C)', quantity: 200, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
  { id: '3', skuName: 'Avocado (20C)', quantity: 50, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
  { id: '4', skuName: 'Apple - Royal Gala', quantity: 150, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
  { id: '5', skuName: 'Apple - Red Delicious', quantity: 80, expectedSellingPrice: null, actualSellingPrice: null, expectedPurchasePrice: null, tentativePattyPrice: null, actualPattyPrice: null },
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

  submitASP: () => {
    const state = get();
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
