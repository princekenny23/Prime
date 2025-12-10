/**
 * Excel Import Field Definitions
 * Business-specific field configurations for product imports
 */

export type BusinessType = "wholesale and retail" | "restaurant" | "bar" | null | undefined

export interface ImportField {
  name: string
  label: string
  required: boolean
  description: string
  example: string
  dataType: "string" | "number" | "decimal" | "boolean" | "integer"
  businessTypes?: BusinessType[] // If undefined, applies to all business types
}

// Universal fields (all business types)
export const universalFields: ImportField[] = [
  {
    name: "product_name",
    label: "Product Name",
    required: true,
    description: "Base product/item name (shared across variations)",
    example: "Coca Cola",
    dataType: "string",
  },
  {
    name: "category",
    label: "Category",
    required: false,
    description: "Product category (auto-created if missing)",
    example: "Beverages",
    dataType: "string",
  },
  {
    name: "description",
    label: "Description",
    required: false,
    description: "Product description",
    example: "Carbonated soft drink",
    dataType: "string",
  },
  {
    name: "variation_name",
    label: "Variation Name",
    required: false,
    description: "Variation name (size, color, pack, volume). Empty = default variation",
    example: "500ml, Large, Bottle",
    dataType: "string",
  },
  {
    name: "price",
    label: "Price",
    required: true,
    description: "Selling price for this variation",
    example: "25.00",
    dataType: "decimal",
  },
  {
    name: "cost",
    label: "Cost",
    required: false,
    description: "Cost price for this variation",
    example: "15.00",
    dataType: "decimal",
  },
  {
    name: "variation_sku",
    label: "Variation SKU",
    required: false,
    description: "SKU for this variation (unique per product)",
    example: "COKE-500ML",
    dataType: "string",
  },
  {
    name: "variation_barcode",
    label: "Variation Barcode",
    required: false,
    description: "Barcode for this variation",
    example: "1234567890123",
    dataType: "string",
  },
  {
    name: "track_inventory",
    label: "Track Inventory",
    required: false,
    description: "Track inventory for this variation (Yes/No)",
    example: "Yes",
    dataType: "boolean",
  },
  {
    name: "unit",
    label: "Unit",
    required: false,
    description: "Unit of measurement",
    example: "pcs, ml, kg, box",
    dataType: "string",
  },
  {
    name: "low_stock_threshold",
    label: "Low Stock Threshold",
    required: false,
    description: "Low stock alert threshold",
    example: "10",
    dataType: "integer",
  },
  {
    name: "outlet",
    label: "Outlet",
    required: false,
    description: "Outlet name or code (for per-location stock)",
    example: "Main Store, OUTLET-001",
    dataType: "string",
  },
  {
    name: "quantity",
    label: "Quantity",
    required: false,
    description: "Stock quantity at this outlet (only if track_inventory=Yes)",
    example: "100",
    dataType: "integer",
  },
  {
    name: "is_active",
    label: "Is Active",
    required: false,
    description: "Product active status (Yes/No, True/False, 1/0)",
    example: "Yes",
    dataType: "boolean",
  },
  {
    name: "sort_order",
    label: "Sort Order",
    required: false,
    description: "Display order (lower = first)",
    example: "0",
    dataType: "integer",
  },
]

// Wholesale-specific fields
export const wholesaleFields: ImportField[] = [
  {
    name: "wholesale_price",
    label: "Wholesale Price",
    required: false,
    description: "Wholesale price (at product level)",
    example: "20.00",
    dataType: "decimal",
    businessTypes: ["wholesale and retail"],
  },
  {
    name: "minimum_wholesale_quantity",
    label: "Minimum Wholesale Quantity",
    required: false,
    description: "Minimum qty for wholesale pricing",
    example: "12",
    dataType: "integer",
    businessTypes: ["wholesale and retail"],
  },
]

// Bar-specific fields
export const barFields: ImportField[] = [
  {
    name: "volume_ml",
    label: "Volume (ml)",
    required: false,
    description: "Volume in milliliters (for bar variations)",
    example: "750",
    dataType: "integer",
    businessTypes: ["bar"],
  },
  {
    name: "alcohol_percentage",
    label: "Alcohol Percentage",
    required: false,
    description: "Alcohol percentage (for bar items)",
    example: "40",
    dataType: "decimal",
    businessTypes: ["bar"],
  },
]

// Restaurant-specific fields
export const restaurantFields: ImportField[] = [
  {
    name: "preparation_time",
    label: "Preparation Time (minutes)",
    required: false,
    description: "Prep time in minutes",
    example: "15",
    dataType: "integer",
    businessTypes: ["restaurant"],
  },
  {
    name: "is_menu_item",
    label: "Is Menu Item",
    required: false,
    description: "Is this a menu item (Yes/No) - affects track_inventory",
    example: "Yes",
    dataType: "boolean",
    businessTypes: ["restaurant"],
  },
]

/**
 * Get all fields for a specific business type
 */
export function getFieldsForBusinessType(businessType: BusinessType): ImportField[] {
  const fields: ImportField[] = [...universalFields]

  if (businessType === "wholesale and retail") {
    fields.push(...wholesaleFields)
  } else if (businessType === "bar") {
    fields.push(...barFields)
  } else if (businessType === "restaurant") {
    fields.push(...restaurantFields)
  }

  return fields
}

/**
 * Get required fields for a business type
 */
export function getRequiredFields(businessType: BusinessType): ImportField[] {
  return getFieldsForBusinessType(businessType).filter(field => field.required)
}

/**
 * Get optional fields for a business type
 */
export function getOptionalFields(businessType: BusinessType): ImportField[] {
  return getFieldsForBusinessType(businessType).filter(field => !field.required)
}

/**
 * Get business-specific fields only
 */
export function getBusinessSpecificFields(businessType: BusinessType): ImportField[] {
  if (businessType === "wholesale and retail") {
    return wholesaleFields
  } else if (businessType === "bar") {
    return barFields
  } else if (businessType === "restaurant") {
    return restaurantFields
  }
  return []
}

