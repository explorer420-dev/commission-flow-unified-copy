// Core data types for PO/SO system

export type POStatus = 'DRAFT' | 'EXPECTED_SUBMITTED' | 'A_PP_GENERATED' | 'FINALIZED';
export type SOStatus = 'DRAFT' | 'EXPECTED_SUBMITTED' | 'ACTUAL_SUBMITTED' | 'COMPLETED';
export type SOItemStatus = 'EXPECTED_SUBMITTED' | 'ACTUAL_SUBMITTED';

export interface POItem {
  sku_id: string;
  sku_name: string;
  po_qty: number;
  e_pp: number | null; // Expected Purchase Price
  tentative_a_pp: number | null; // Tentative Actual Purchase Price (Seller Patty Price)
  actual_seller_patty_price: number | null;
  labour_cost_per_box: number;
  transport_cost_per_box: number;
}

export interface PurchaseOrder {
  id: string;
  vendor_id: string;
  items: POItem[];
  status: POStatus;
  created_at: string;
  updated_at: string;
}

export interface SOItem {
  sku_id: string;
  sku_name: string;
  so_qty: number;
  e_sp: number | null; // Expected Selling Price
  a_sp: number | null; // Actual Selling Price
  status: SOItemStatus;
}

export interface SaleOrder {
  id: string;
  po_id: string | null; // nullable if not linked
  items: SOItem[];
  status: SOStatus;
  created_at: string;
  updated_at: string;
}

export interface UnsolvedSKU {
  sku_id: string;
  sku_name: string;
  po_qty: number;
  closed_qty: number;
  unsold_qty: number;
}

export interface APPBucket {
  qty: number;
  a_sp_per_box: number;
  tentative: number;
  source: 'so' | 'fallback';
  source_id?: string; // SO id or 'fallback'
}

export interface APPResult {
  sku_id: string;
  sku_name: string;
  total_qty: number;
  weighted_avg: number;
  buckets: APPBucket[];
}

export interface FallbackEntry {
  sku_id: string;
  fallback_qty: number;
  fallback_a_sp_per_box: number;
}

export interface GenerateAPPResponse {
  success: boolean;
  message: string;
  unsold_skus?: UnsolvedSKU[];
  actions?: string[];
  a_pp_results?: APPResult[];
}

export interface FallbackPricesResponse {
  success: boolean;
  message: string;
  fallback_entries: FallbackEntry[];
}

// Constants
export const NC_COMMISSION_PERCENT = 6;
