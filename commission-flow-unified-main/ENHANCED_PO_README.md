# Enhanced Purchase Order Module - Implementation Documentation

## Overview

This implementation provides a comprehensive Purchase Order (PO) management system with **SKU-level validation**, **fallback pricing**, and **bucket-based Actual Purchase Price (A-PP) calculation**.

## Key Features

### 1. **SKU-Level Unsold Quantity Detection**
- Validates that every SKU in a PO has corresponding closed Sale Orders (SOs)
- Detects unsold quantities at the SKU level
- Returns **409 Conflict** response when unsold quantities are detected
- Blocks A-PP generation until all SKUs are resolved

### 2. **Fallback Pricing System**
- **Batch fallback entry modal** for entering fallback prices for multiple SKUs at once
- **Apply-to-all functionality** to quickly set the same price for all unsold SKUs
- Fallback prices are treated as separate buckets in A-PP calculation
- Validation ensures fallback quantities don't exceed unsold quantities

### 3. **Bucket-Based A-PP Calculation**
- Supports multiple A-SP sources per SKU (multiple SOs + fallback)
- Each source is treated as a "bucket" with its own quantity and A-SP
- Calculates tentative A-PP per bucket using the formula:
  ```
  Tentative A-PP = [A-SP - (Labour + Transport)] - (6% commission on net)
  ```
- Computes **weighted average** across all buckets for final A-PP
- Transparent bucket details view showing source breakdown

### 4. **Sale Order Quick Creation**
- Create SOs directly from the unsolved SKUs warning panel
- Pre-fills SKU information and suggested quantity
- Automatically retries A-PP generation after SO creation

### 5. **Complete Workflow States**
- **DRAFT**: Enter Expected Purchase Prices (E-PP)
- **EXPECTED_SUBMITTED**: E-PP submitted, awaiting SO closure
- **A_PP_GENERATED**: Tentative A-PP generated, ready for final review
- **FINALIZED**: Final Patty Prices confirmed

## File Structure

```
src/
├── lib/
│   ├── types.ts              # TypeScript types for PO/SO system
│   ├── api.ts                # Mock API service layer
│   └── store.ts              # Zustand state management
├── components/
│   ├── FallbackPricingModal.tsx    # Batch fallback price entry
│   ├── UnsolvedSKUsPanel.tsx       # Warning panel for unsolved SKUs
│   ├── APPBucketDetails.tsx        # Bucket breakdown modal
│   └── CreateSOModal.tsx           # Quick SO creation
└── pages/
    └── PurchaseOrderNew.tsx        # Main PO module page
```

## Data Models

### Purchase Order (PO)
```typescript
interface PurchaseOrder {
  id: string;
  vendor_id: string;
  items: POItem[];
  status: 'DRAFT' | 'EXPECTED_SUBMITTED' | 'A_PP_GENERATED' | 'FINALIZED';
  created_at: string;
  updated_at: string;
}

interface POItem {
  sku_id: string;
  sku_name: string;
  po_qty: number;
  e_pp: number | null;
  tentative_a_pp: number | null;
  actual_seller_patty_price: number | null;
  labour_cost_per_box: number;
  transport_cost_per_box: number;
}
```

### Sale Order (SO)
```typescript
interface SaleOrder {
  id: string;
  po_id: string | null;
  items: SOItem[];
  status: 'DRAFT' | 'EXPECTED_SUBMITTED' | 'ACTUAL_SUBMITTED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}

interface SOItem {
  sku_id: string;
  sku_name: string;
  so_qty: number;
  e_sp: number | null;
  a_sp: number | null;
  status: 'EXPECTED_SUBMITTED' | 'ACTUAL_SUBMITTED';
}
```

## API Endpoints (Mock Implementation)

### POST /api/po/{poId}/generate-a-pp
Generates Tentative Seller Patty Price for all SKUs in a PO.

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Tentative A-PP generated",
  "a_pp_results": [
    {
      "sku_id": "SKU-001",
      "sku_name": "Pomo Bhuj SSSS",
      "total_qty": 500,
      "weighted_avg": 1450.00,
      "buckets": [
        {
          "qty": 400,
          "a_sp_per_box": 1500,
          "tentative": 1450.00,
          "source": "so",
          "source_id": "SO-123"
        },
        {
          "qty": 100,
          "a_sp_per_box": 1500,
          "tentative": 1450.00,
          "source": "fallback"
        }
      ]
    }
  ]
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "message": "Unresolved SKU quantities detected",
  "unsold_skus": [
    {
      "sku_id": "SKU-001",
      "sku_name": "Pomo Bhuj SSSS",
      "po_qty": 500,
      "closed_qty": 400,
      "unsold_qty": 100
    }
  ],
  "actions": ["create_or_link_so", "enter_fallback_prices"]
}
```

### POST /api/po/{poId}/fallback-prices
Saves fallback prices for unsold SKU quantities.

**Request:**
```json
{
  "fallback_entries": [
    {
      "sku_id": "SKU-001",
      "fallback_qty": 100,
      "fallback_a_sp_per_box": 1500
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Fallback prices saved",
  "fallback_entries": [...]
}
```

## User Workflow

### Complete Flow Example

1. **Enter E-PP**
   - Navigate to Purchase Order (Enhanced) from dashboard
   - Enter Expected Purchase Prices for all SKUs
   - Click "Submit Expected Purchase Prices"

2. **Create Sale Orders**
   - Create SOs for SKUs (can be partial quantities)
   - Enter Actual Selling Prices (A-SP) for sold quantities

3. **Generate A-PP**
   - Click "Generate Tentative Seller Patty Price"
   - If unsold quantities exist → 409 warning panel appears

4. **Resolve Unsold Quantities** (choose one):
   - **Option A**: Create additional SOs
     - Click "Create/Link SO" on specific SKU
     - Enter quantity and A-SP
     - System auto-retries A-PP generation
   
   - **Option B**: Enter fallback prices
     - Click "Enter fallback prices for all SKUs"
     - Enter fallback A-SP for each unsold SKU
     - Optionally use "Apply same price to all"
     - Save → System auto-retries A-PP generation

5. **Review & Finalize**
   - View tentative A-PP with bucket breakdown
   - Adjust Actual Seller Patty Price if needed
   - Click "Confirm Final Patty Prices"

## Calculation Details

### Formula
For each bucket (SO or fallback):
```
reductions = labour_cost_per_box + transport_cost_per_box
net = a_sp_per_box - reductions
commission = net × 0.06
tentative_a_pp_per_box = net - commission
```

### Weighted Average
When multiple buckets exist for a SKU:
```
weighted_avg = Σ(bucket.qty × bucket.tentative_a_pp) / total_qty
```

### Example
**PO Item:** 500 boxes of Pomo Bhuj SSSS
- Labour: ₹50/box
- Transport: ₹30/box

**Buckets:**
1. SO-001: 300 boxes @ ₹1500/box A-SP
   - Net: 1500 - 80 = 1420
   - Commission: 1420 × 0.06 = 85.20
   - Tentative A-PP: 1420 - 85.20 = **₹1334.80**

2. SO-002: 100 boxes @ ₹1400/box A-SP
   - Net: 1400 - 80 = 1320
   - Commission: 1320 × 0.06 = 79.20
   - Tentative A-PP: 1320 - 79.20 = **₹1240.80**

3. Fallback: 100 boxes @ ₹1450/box
   - Net: 1450 - 80 = 1370
   - Commission: 1370 × 0.06 = 82.20
   - Tentative A-PP: 1370 - 82.20 = **₹1287.80**

**Weighted Average:**
```
(300 × 1334.80 + 100 × 1240.80 + 100 × 1287.80) / 500 = ₹1309.16
```

## Testing

### Demo Data
The system initializes with demo PO (PO-001) containing 3 SKUs:
- Pomo Bhuj SSSS: 500 boxes
- Pomo Bhuj SSS: 300 boxes
- Basmati Rice 25kg: 200 boxes

### Test Scenarios

1. **Full SO Coverage**
   - Create SOs covering all quantities
   - A-PP generation succeeds immediately

2. **Partial SO + Fallback**
   - Create SOs for partial quantities
   - Use fallback pricing for remainder
   - Verify bucket-based calculation

3. **Multiple SOs per SKU**
   - Create 2-3 SOs for same SKU with different A-SPs
   - Verify weighted average calculation

4. **Edge Cases**
   - Zero prices (should show "0" not "0.00")
   - Negative margins
   - Concurrent SO creation while entering fallback

## UI Components

### FallbackPricingModal
- Batch entry for multiple SKUs
- Apply-to-all checkbox
- Individual price inputs per SKU
- Validation and error handling

### UnsolvedSKUsPanel
- Prominent warning with amber theme
- SKU-level breakdown cards
- Action buttons per SKU
- Global "Enter fallback prices" button

### APPBucketDetails
- Modal showing calculation transparency
- Bucket-by-bucket breakdown
- Source tracking (SO vs fallback)
- Formula explanation

### CreateSOModal
- Quick SO creation
- Pre-filled SKU info
- Suggested quantity
- Auto-retry A-PP generation

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Color contrast compliance
- Screen reader friendly

## Future Enhancements

1. **Audit Trail**
   - Track fallback price entry with user/timestamp
   - Show "Used fallback price entered on {date} by {user}"

2. **Concurrency Handling**
   - Detect parallel SO creation
   - Adjust fallback quantities automatically

3. **Validation Improvements**
   - Price range warnings (too low/high)
   - Confirmation for unusual values

4. **Reporting**
   - Export A-PP calculation details
   - Bucket breakdown reports

## Access

Navigate to: **http://localhost:8080/purchase-order-new**

Or from Dashboard → Click "Purchase Order (Enhanced)" card

---

**Implementation Date:** 2025-12-12  
**Version:** 1.0.0  
**Status:** ✅ Complete
