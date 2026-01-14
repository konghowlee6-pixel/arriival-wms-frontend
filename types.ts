// A set of permissions that can be assigned to a role.
export interface PermissionSet {
  canViewDashboard: boolean;
  canEditItems: boolean;
  canManageStockIn: boolean;
  canViewStockIn: boolean;
  canManageStockOut: boolean;
  canViewStockOut: boolean;
  canManageDO: boolean;
  canViewDO: boolean;
  canManageConsignees: boolean;
  canManageWarehouses: boolean; // New permission
  canViewMovementReport: boolean;
  canViewBilling: boolean;
  canViewAuditTrail: boolean;
  canManageUsers: boolean;
  canManageProfile: boolean;
  canManagePricing: boolean;
}

export type Permission = keyof PermissionSet;

// Defines a role with a name and a set of permissions.
export interface Role {
  id: string;
  name: string;
  permissions: PermissionSet;
  warehouseIds: string[]; // <-- New: Assign warehouses to a role
}

// User now has a roleId instead of a fixed role name.
export interface User {
  id: string;
  email: string;
  password?: string; // Optional, as it's set by the user via invitation.
  organizationId: string | null;
  roleId: string;
  status: 'active' | 'pending';
  invitationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: number;
  // This is for the System Admin only, not used in orgs.
  role?: 'System Super Admin';
}


export interface Item {
  id: string;
  sku: string;
  brand: string;
  description: string;
  netWeightVolume: string;
  uom: 'Ctn' | 'Pack';
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  startingStock: number;
  balanceStock: number;
  warehouse: string; // Changed from 'Sabah' | 'Sarawak' to string
  creationDate: string;
}

export interface StockInRecord {
  id: string;
  arrivalDate: string;
  doNo: string;
  sku: string;
  brand: string;
  itemDescription: string;
  netWeightVolume: string;
  uom: 'Pack' | 'Ctn';
  arrivedQty: number;
  warehouse: string; // Changed from 'Sabah' | 'Sarawak' to string
}

export interface StockOutRecord {
  id: string;
  orderDate: string;
  doNo: string;
  consigneeName: string;
  sku: string;
  brand: string;
  itemDescription: string;
  netWeightVolume: string;
  uom: 'Ctn' | 'Pack';
  orderedQty: number;
  totalWeightKg: number;
  fulfillmentStatus: 'Delivered' | 'Pending' | 'Self collect';
  deliveredDate: string;
  deliveredBy: string;
  warehouse: string; // Changed from 'Sabah' | 'Sarawak' to string
  balanceStock: number; // Stock level *before* this transaction
}

export interface DeliveryOrder {
  id: string;
  doNo: string;
  fileInfo: {
    name: string;
    size: number;
    type: string;
    content: string; // Added to store file content for download
  };
  uploadDate: string;
  status: 'Completed' | 'Pending';
}

export interface Consignee {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

// New type for warehouses
export interface Warehouse {
  id: string;
  name: string;
  address: string;
}

export interface FulfillmentTier {
  id: string;
  volume: number;
  price: number;
}

export interface ConsumableItem {
  id: string;
  name: string;
  price: number;
  unit: string;
}

export interface Pricing {
  fulfillmentTiers: FulfillmentTier[];
  consumableItems: ConsumableItem[];
  storage: {
    ratePerPalletPerMonth: number;
    palletCBM: number;
  };
  transport: {
    courier: {
      first3kg: number;
      subsequentKg: number;
      withinState25to50kg: number;
    };
    oceanFreight: {
      klgSbw1m3: number;
      klgBki1m3: number;
    };
  };
  handling: {
    manpower: {
      palletize40ft: number;
      palletize20ft: number;
      palletize5to10ton: number;
      palletize1to3ton: number;
      loose40ft: number;
      loose20ft: number;
      loose5to10ton: number;
      loose1to3ton: number;
    };
    inboundOutbound: {
      perPallet: number;
      perCarton: number;
      perUnit: number;
    };
  };
}

export interface Organization {
  id: string;
  name: string;
  pricing: Pricing;
  dateJoined: string;
  billingAddress: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  companyRegNo: string;
}

export interface AuditTrailRecord {
  id: string;
  timestamp: string; // ISO string
  user: string;
  action: string;
  details: string;
}

export interface AdHocCharge {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Handling' | 'Consumable';
  description: string;
  amount: number;
}