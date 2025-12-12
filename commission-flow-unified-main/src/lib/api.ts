// Mock API service layer for PO/SO operations
// In production, these would be actual HTTP calls to backend

import {
    PurchaseOrder,
    SaleOrder,
    GenerateAPPResponse,
    FallbackPricesResponse,
    FallbackEntry,
    APPResult,
    APPBucket,
    UnsolvedSKU,
    NC_COMMISSION_PERCENT,
} from './types';

// In-memory storage for demo purposes
let purchaseOrders: PurchaseOrder[] = [];
let saleOrders: SaleOrder[] = [];
let fallbackPrices: Map<string, Map<string, FallbackEntry>> = new Map(); // poId -> skuId -> FallbackEntry

// Helper: Get closed SO quantity for a PO item
export function closed_so_qty_for_po_item(po_id: string, sku_id: string): number {
    const relatedSOs = saleOrders.filter(so => so.po_id === po_id);

    let totalClosed = 0;
    for (const so of relatedSOs) {
        const soItem = so.items.find(item => item.sku_id === sku_id);
        if (soItem && soItem.a_sp !== null && soItem.status === 'ACTUAL_SUBMITTED') {
            totalClosed += soItem.so_qty;
        }
    }

    return totalClosed;
}

// Helper: Get closed SO A-SP buckets for sold units
export function closed_so_a_sp_for_sold_units(
    po_id: string,
    sku_id: string
): Array<{ qty: number; a_sp_per_box: number; so_id: string }> {
    const relatedSOs = saleOrders.filter(so => so.po_id === po_id);
    const buckets: Array<{ qty: number; a_sp_per_box: number; so_id: string }> = [];

    for (const so of relatedSOs) {
        const soItem = so.items.find(item => item.sku_id === sku_id);
        if (soItem && soItem.a_sp !== null && soItem.status === 'ACTUAL_SUBMITTED') {
            buckets.push({
                qty: soItem.so_qty,
                a_sp_per_box: soItem.a_sp,
                so_id: so.id,
            });
        }
    }

    return buckets;
}

// API: Generate Tentative A-PP
export async function generateAPP(poId: string): Promise<GenerateAPPResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) {
        throw new Error('PO not found');
    }

    if (po.status !== 'EXPECTED_SUBMITTED' && po.status !== 'DRAFT') {
        throw new Error('Invalid PO status for A-PP generation');
    }

    // Check for unsold quantities
    const unsold_skus: UnsolvedSKU[] = [];

    for (const item of po.items) {
        const closed_qty = closed_so_qty_for_po_item(poId, item.sku_id);

        // Check if we have fallback prices for this SKU
        const poFallbacks = fallbackPrices.get(poId);
        const fallback = poFallbacks?.get(item.sku_id);
        const fallback_qty = fallback?.fallback_qty || 0;

        const total_covered = closed_qty + fallback_qty;
        const unsold_qty = item.po_qty - total_covered;

        if (unsold_qty > 0) {
            unsold_skus.push({
                sku_id: item.sku_id,
                sku_name: item.sku_name,
                po_qty: item.po_qty,
                closed_qty: total_covered,
                unsold_qty,
            });
        }
    }

    // If there are unsold SKUs, return 409 Conflict
    if (unsold_skus.length > 0) {
        return {
            success: false,
            message: 'Unresolved SKU quantities detected',
            unsold_skus,
            actions: ['create_or_link_so', 'enter_fallback_prices'],
        };
    }

    // Calculate A-PP for all items
    const a_pp_results: APPResult[] = [];

    for (const item of po.items) {
        // Get sold buckets from SOs
        const sold_buckets = closed_so_a_sp_for_sold_units(poId, item.sku_id);

        // Get fallback bucket if exists
        const poFallbacks = fallbackPrices.get(poId);
        const fallback = poFallbacks?.get(item.sku_id);

        const buckets: APPBucket[] = [];

        // Process sold buckets
        for (const bucket of sold_buckets) {
            const reductions = item.labour_cost_per_box + item.transport_cost_per_box;
            const net = bucket.a_sp_per_box - reductions;
            const commission = net * (NC_COMMISSION_PERCENT / 100);
            const tentative = net - commission;

            buckets.push({
                qty: bucket.qty,
                a_sp_per_box: bucket.a_sp_per_box,
                tentative: Math.round(tentative * 100) / 100,
                source: 'so',
                source_id: bucket.so_id,
            });
        }

        // Process fallback bucket
        if (fallback) {
            const reductions = item.labour_cost_per_box + item.transport_cost_per_box;
            const net = fallback.fallback_a_sp_per_box - reductions;
            const commission = net * (NC_COMMISSION_PERCENT / 100);
            const tentative = net - commission;

            buckets.push({
                qty: fallback.fallback_qty,
                a_sp_per_box: fallback.fallback_a_sp_per_box,
                tentative: Math.round(tentative * 100) / 100,
                source: 'fallback',
                source_id: 'fallback',
            });
        }

        // Calculate weighted average
        const total_qty = buckets.reduce((sum, b) => sum + b.qty, 0);
        const weighted_sum = buckets.reduce((sum, b) => sum + (b.qty * b.tentative), 0);
        const weighted_avg = total_qty > 0 ? Math.round((weighted_sum / total_qty) * 100) / 100 : 0;

        a_pp_results.push({
            sku_id: item.sku_id,
            sku_name: item.sku_name,
            total_qty,
            weighted_avg,
            buckets,
        });

        // Update PO item with tentative A-PP
        item.tentative_a_pp = weighted_avg;
        item.actual_seller_patty_price = weighted_avg; // Initialize with tentative value
    }

    // Update PO status
    po.status = 'A_PP_GENERATED';
    po.updated_at = new Date().toISOString();

    return {
        success: true,
        message: 'Tentative A-PP generated',
        a_pp_results,
    };
}

// API: Save fallback prices
export async function saveFallbackPrices(
    poId: string,
    fallback_entries: FallbackEntry[]
): Promise<FallbackPricesResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) {
        throw new Error('PO not found');
    }

    // Validate entries
    for (const entry of fallback_entries) {
        const poItem = po.items.find(item => item.sku_id === entry.sku_id);
        if (!poItem) {
            throw new Error(`SKU ${entry.sku_id} not found in PO`);
        }

        const closed_qty = closed_so_qty_for_po_item(poId, entry.sku_id);
        const unsold_qty = poItem.po_qty - closed_qty;

        if (entry.fallback_qty > unsold_qty) {
            throw new Error(
                `Fallback quantity ${entry.fallback_qty} exceeds unsold quantity ${unsold_qty} for SKU ${entry.sku_id}`
            );
        }
    }

    // Save fallback prices
    if (!fallbackPrices.has(poId)) {
        fallbackPrices.set(poId, new Map());
    }

    const poFallbacks = fallbackPrices.get(poId)!;
    for (const entry of fallback_entries) {
        poFallbacks.set(entry.sku_id, entry);
    }

    return {
        success: true,
        message: 'Fallback prices saved',
        fallback_entries,
    };
}

// API: Get PO by ID
export async function getPO(poId: string): Promise<PurchaseOrder | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return purchaseOrders.find(po => po.id === poId) || null;
}

// API: Update PO
export async function updatePO(po: PurchaseOrder): Promise<PurchaseOrder> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = purchaseOrders.findIndex(p => p.id === po.id);
    if (index >= 0) {
        po.updated_at = new Date().toISOString();
        purchaseOrders[index] = po;
    } else {
        purchaseOrders.push(po);
    }
    return po;
}

// API: Create or update SO
export async function saveSO(so: SaleOrder): Promise<SaleOrder> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const index = saleOrders.findIndex(s => s.id === so.id);
    if (index >= 0) {
        so.updated_at = new Date().toISOString();
        saleOrders[index] = so;
    } else {
        saleOrders.push(so);
    }
    return so;
}

// API: Get SOs for a PO
export async function getSOsForPO(poId: string): Promise<SaleOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return saleOrders.filter(so => so.po_id === poId);
}

// Initialize with demo data
export function initializeDemoData() {
    const demoPoId = 'PO-001';

    const demoPO: PurchaseOrder = {
        id: demoPoId,
        vendor_id: 'VENDOR-001',
        status: 'DRAFT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [
            {
                sku_id: 'SKU-001',
                sku_name: 'Pomo Bhuj SSSS',
                po_qty: 500,
                e_pp: null,
                tentative_a_pp: null,
                actual_seller_patty_price: null,
                labour_cost_per_box: 50,
                transport_cost_per_box: 30,
            },
            {
                sku_id: 'SKU-002',
                sku_name: 'Pomo Bhuj SSS',
                po_qty: 300,
                e_pp: null,
                tentative_a_pp: null,
                actual_seller_patty_price: null,
                labour_cost_per_box: 50,
                transport_cost_per_box: 30,
            },
            {
                sku_id: 'SKU-003',
                sku_name: 'Basmati Rice 25kg',
                po_qty: 100,
                e_pp: null,
                tentative_a_pp: null,
                actual_seller_patty_price: null,
                labour_cost_per_box: 40,
                transport_cost_per_box: 25,
            },
        ],
    };

    purchaseOrders = [demoPO];
    saleOrders = [];
    fallbackPrices.clear();
}

// Export storage for debugging
export function getStorageState() {
    return {
        purchaseOrders,
        saleOrders,
        fallbackPrices: Array.from(fallbackPrices.entries()).map(([poId, skuMap]) => ({
            poId,
            fallbacks: Array.from(skuMap.entries()),
        })),
    };
}
