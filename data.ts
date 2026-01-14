import type { Item, StockInRecord, StockOutRecord, DeliveryOrder, Pricing } from './types';

export const initialItems: Item[] = [
    { 
        id: 'item-1', 
        sku: 'SOA-CAT-PCH-6L', 
        brand: 'Soar', 
        description: 'Tofu Cat Litter Supplies Peach Flavour', 
        netWeightVolume: '2KG/6L', 
        uom: 'Ctn', 
        lengthCm: 41, 
        widthCm: 32, 
        heightCm: 32, 
        weightKg: 2.00, 
        startingStock: 0, 
        balanceStock: 0, // This is calculated dynamically in the app
        warehouse: 'Sabah',
        creationDate: '2024-05-20'
    },
    { 
        id: 'item-2', 
        sku: 'SOA-CAT-PEA-7L', 
        brand: 'Soar', 
        description: 'Tofu Cat Litter Supplies Pea Flavour', 
        netWeightVolume: '3KG/7L', 
        uom: 'Ctn', 
        lengthCm: 47.3, 
        widthCm: 29.3, 
        heightCm: 29.5, 
        weightKg: 3.00, 
        startingStock: 0, 
        balanceStock: 0, // This is calculated dynamically in the app
        warehouse: 'Sabah',
        creationDate: '2024-05-21'
    },
];

export const initialStockInRecords: StockInRecord[] = [
    { 
        id: 'in-1', 
        arrivalDate: '2024-05-20', 
        doNo: 'DO-PCH-001', 
        sku: 'SOA-CAT-PCH-6L', 
        brand: 'Soar', 
        itemDescription: 'Tofu Cat Litter Supplies Peach Flavour', 
        netWeightVolume: '2KG/6L', 
        uom: 'Ctn', 
        arrivedQty: 565, 
        warehouse: 'Sabah' 
    },
    { 
        id: 'in-2', 
        arrivalDate: '2024-05-21', 
        doNo: 'DO-PEA-001', 
        sku: 'SOA-CAT-PEA-7L', 
        brand: 'Soar', 
        itemDescription: 'Tofu Cat Litter Supplies Pea Flavour', 
        netWeightVolume: '3KG/7L', 
        uom: 'Ctn', 
        arrivedQty: 432, 
        warehouse: 'Sabah' 
    },
];

export const initialStockOutRecords: StockOutRecord[] = [];

export const initialDeliveryOrders: DeliveryOrder[] = [
    { id: 'do-1', doNo: 'DO-PCH-001', fileInfo: { name: 'do-pch-001.pdf', size: 10240, type: 'application/pdf', content: '' }, uploadDate: '2024-05-20', status: 'Completed' },
    { id: 'do-2', doNo: 'DO-PEA-001', fileInfo: { name: 'do-pea-001.pdf', size: 10240, type: 'application/pdf', content: '' }, uploadDate: '2024-05-21', status: 'Completed' },
];

// Fix: Add missing defaultPricing export.
export const defaultPricing: Pricing = {
  fulfillmentTiers: [
    { id: 'tier-1', volume: 0, price: 5.00 },
    { id: 'tier-2', volume: 500, price: 4.50 },
    { id: 'tier-3', volume: 1000, price: 4.00 },
  ],
  consumableItems: [
    { id: 'con-1', name: 'Bubble Wrap', price: 1.50, unit: 'Per Item' },
    { id: 'con-2', name: 'Flyer (S)', price: 0.30, unit: 'Per Item' },
  ],
  storage: {
    ratePerPalletPerMonth: 50.00,
    palletCBM: 1.2,
  },
  transport: {
    courier: {
      first3kg: 8.00,
      subsequentKg: 1.50,
      withinState25to50kg: 50.00,
    },
    oceanFreight: {
      klgSbw1m3: 350.00,
      klgBki1m3: 300.00,
    },
  },
  handling: {
    manpower: {
      palletize40ft: 600,
      palletize20ft: 350,
      palletize5to10ton: 300,
      palletize1to3ton: 150,
      loose40ft: 1000,
      loose20ft: 500,
      loose5to10ton: 400,
      loose1to3ton: 200,
    },
    inboundOutbound: {
      perPallet: 5.00,
      perCarton: 1.00,
      perUnit: 0.50,
    },
  },
};
