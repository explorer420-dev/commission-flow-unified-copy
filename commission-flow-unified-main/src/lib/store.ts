import { create } from 'zustand';

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

const initialItems: SKUItem[] = [
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
  
  submitASP: () => set({ 
    soStage: 'completed',
    poStage: get().poStage === 'awaiting-so' ? 'generate-app' : get().poStage
  }),
  
  submitEPP: () => set({ poStage: 'awaiting-so' }),
  
  generateTentativePatty: () => set((state) => ({
    skuItems: state.skuItems.map(item => {
      if (item.actualSellingPrice !== null) {
        const tentative = (item.actualSellingPrice - (state.labourCost + state.transportCost)) * (1 - state.commissionRate);
        return { ...item, tentativePattyPrice: Math.round(tentative * 100) / 100, actualPattyPrice: tentative };
      }
      return item;
    }),
    poStage: 'enter-actual-patty'
  })),
  
  confirmFinalPatty: () => set({ poStage: 'completed' }),
  
  resetAll: () => set({
    skuItems: initialItems,
    soStage: 'enter-esp',
    poStage: 'enter-epp'
  })
}));
