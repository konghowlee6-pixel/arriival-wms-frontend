import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { StockOutRecord, Organization, Item, StockInRecord, AdHocCharge } from '../types';

declare const XLSX: any;

interface BillingReportProps {
  items: Item[];
  stockInRecords: StockInRecord[];
  stockOutRecords: StockOutRecord[];
  adHocCharges: AdHocCharge[];
  organization: Organization;
}

// Custom Year Selector Component
const YearSelector: React.FC<{
    selectedYear: number;
    availableYears: number[];
    onChange: (year: number) => void;
}> = ({ selectedYear, availableYears, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    const currentIndex = availableYears.indexOf(selectedYear);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleYearChange = (delta: number) => {
        const newIndex = currentIndex + delta;
        if (newIndex >= 0 && newIndex < availableYears.length) {
            onChange(availableYears[newIndex]);
        }
    };

    const buttonClass = "p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">Year:</label>
            <div ref={wrapperRef} className="relative flex items-center bg-white border border-gray-300 rounded-md shadow-sm">
                <button onClick={() => handleYearChange(-1)} disabled={currentIndex <= 0} className={buttonClass}>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>

                <div className="relative">
                    <button onClick={() => setIsOpen(!isOpen)} className="px-4 py-2 text-sm font-semibold text-gray-900 focus:outline-none">
                        {selectedYear}
                    </button>
                    {isOpen && (
                        <div className="absolute top-full -left-4 mt-2 w-28 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => { onChange(year); setIsOpen(false); }}
                                    className={`block w-full text-left px-4 py-2 text-sm ${selectedYear === year ? 'bg-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={() => handleYearChange(1)} disabled={currentIndex >= availableYears.length - 1} className={buttonClass}>
                     <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
            </div>
        </div>
    );
};


const BillingReport: React.FC<BillingReportProps> = ({ items, stockInRecords, stockOutRecords, adHocCharges, organization }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { pricing } = organization;

  const yearlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i);

    return months.map(month => {
      const monthStartDate = new Date(selectedYear, month, 1);
      const monthEndDate = new Date(selectedYear, month + 1, 0);
      monthEndDate.setHours(23, 59, 59, 999);

      // Filter records for the current month
      const shipmentsInMonth = stockOutRecords.filter(r => {
        const orderDate = new Date(r.orderDate);
        return orderDate.getFullYear() === selectedYear && orderDate.getMonth() === month;
      });
      const stockInInMonth = stockInRecords.filter(r => {
        const arrivalDate = new Date(r.arrivalDate);
        return arrivalDate.getFullYear() === selectedYear && arrivalDate.getMonth() === month;
      });
      const adHocChargesInMonth = adHocCharges.filter(c => {
        const chargeDate = new Date(c.date);
        return chargeDate.getFullYear() === selectedYear && chargeDate.getMonth() === month;
      });
      
      // 1. FULFILLMENT SERVICE (per shipment)
      const totalShipments = shipmentsInMonth.length;
      const fulfillmentTier = [...pricing.fulfillmentTiers]
        .sort((a, b) => b.volume - a.volume)
        .find(tier => totalShipments >= tier.volume);
      const fulfillmentRate = fulfillmentTier ? fulfillmentTier.price : (pricing.fulfillmentTiers[0]?.price || 0);
      const fulfillmentCost = totalShipments * fulfillmentRate;

      // 2. STORAGE RENTAL (daily calculation for accuracy)
      let storageCost = 0;
      if (pricing.storage.ratePerPalletPerMonth > 0) {
        const dailyRate = pricing.storage.ratePerPalletPerMonth / 30; // Prorated daily rate
        let currentDate = new Date(monthStartDate);

        while (currentDate <= monthEndDate) {
            let dailyTotalCBM = 0;
            for (const item of items) {
                let balanceOnDate = item.startingStock;
                stockInRecords
                    .filter(r => r.sku === item.sku && new Date(r.arrivalDate) <= currentDate)
                    .forEach(r => balanceOnDate += r.arrivedQty);
                stockOutRecords
                    .filter(r => r.sku === item.sku && new Date(r.orderDate) <= currentDate)
                    .forEach(r => balanceOnDate -= r.orderedQty);
                
                if (balanceOnDate > 0) {
                    const itemCBM = (item.lengthCm * item.widthCm * item.heightCm) / 1000000;
                    dailyTotalCBM += itemCBM * balanceOnDate;
                }
            }
            
            const pallets = pricing.storage.palletCBM > 0 ? dailyTotalCBM / pricing.storage.palletCBM : 0;
            storageCost += pallets * dailyRate;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // 3. LOGISTICS FEE (TRANSPORT) - Billed only on 'Delivered' status
      const deliveredShipments = shipmentsInMonth.filter(s => s.fulfillmentStatus === 'Delivered');
      const logisticsCost = deliveredShipments.reduce((sum, shipment) => {
        let cost = 0;
        const weight = shipment.totalWeightKg;
        if (weight > 0 && weight < 3) cost = pricing.transport.courier.first3kg;
        else if (weight >= 3) cost = pricing.transport.courier.first3kg + (Math.ceil(weight - 3) * pricing.transport.courier.subsequentKg);
        if (weight >= 25 && weight <= 50) cost = Math.min(cost, pricing.transport.courier.withinState25to50kg);
        return sum + cost;
      }, 0);

      // 4. HANDLING FEE (Inbound & Outbound + Ad-hoc)
      const inboundHandling = stockInInMonth.reduce((sum, rec) => {
        const rate = rec.uom === 'Ctn' ? pricing.handling.inboundOutbound.perCarton : pricing.handling.inboundOutbound.perUnit;
        return sum + (rec.arrivedQty * rate);
      }, 0);
      const outboundHandling = shipmentsInMonth.reduce((sum, rec) => {
          const rate = rec.uom === 'Ctn' ? pricing.handling.inboundOutbound.perCarton : pricing.handling.inboundOutbound.perUnit;
          return sum + (rec.orderedQty * rate);
      }, 0);
      const adHocHandlingCost = adHocChargesInMonth
        .filter(c => c.type === 'Handling')
        .reduce((sum, c) => sum + c.amount, 0);
      const handlingCost = inboundHandling + outboundHandling + adHocHandlingCost;

      // 5. CONSUMABLE ITEM (Rate-based + Ad-hoc)
      const perShipmentConsumableCost = pricing.consumableItems.reduce((sum, item) => sum + item.price, 0);
      const rateBasedConsumableCost = totalShipments * perShipmentConsumableCost;
      const adHocConsumableCost = adHocChargesInMonth
        .filter(c => c.type === 'Consumable')
        .reduce((sum, c) => sum + c.amount, 0);
      const consumableCost = rateBasedConsumableCost + adHocConsumableCost;

      const totalCost = fulfillmentCost + storageCost + logisticsCost + handlingCost + consumableCost;
      
      return {
          month: monthStartDate.toLocaleString('default', { month: 'long' }),
          storage: storageCost,
          fulfillment: fulfillmentCost,
          logistics: logisticsCost,
          handling: handlingCost,
          consumable: consumableCost,
          total: totalCost,
      };
    });
  }, [selectedYear, stockOutRecords, stockInRecords, items, pricing, adHocCharges]);

  const annualTotal = useMemo(() => {
    return yearlyData.reduce((totals, monthData) => {
        totals.storage += monthData.storage;
        totals.fulfillment += monthData.fulfillment;
        totals.logistics += monthData.logistics;
        totals.handling += monthData.handling;
        totals.consumable += monthData.consumable;
        totals.total += monthData.total;
        return totals;
    }, { storage: 0, fulfillment: 0, logistics: 0, handling: 0, consumable: 0, total: 0 });
  }, [yearlyData]);

  const availableYears = useMemo(() => {
    const years = new Set([
        ...stockInRecords.map(r => new Date(r.arrivalDate).getFullYear()),
        ...stockOutRecords.map(r => new Date(r.orderDate).getFullYear()),
        ...adHocCharges.map(c => new Date(c.date).getFullYear()),
    ]);
    if(years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => a - b);
  }, [stockInRecords, stockOutRecords, adHocCharges]);

  const handleExportMonthlyReport = (monthIndex: number) => {
    const monthStartDate = new Date(selectedYear, monthIndex, 1);
    const monthEndDate = new Date(selectedYear, monthIndex + 1, 0);
    monthEndDate.setHours(23, 59, 59, 999);

    const shipmentsInMonth = stockOutRecords.filter(r => {
        const orderDate = new Date(r.orderDate);
        return orderDate.getFullYear() === selectedYear && orderDate.getMonth() === monthIndex;
    });
    const stockInInMonth = stockInRecords.filter(r => {
        const arrivalDate = new Date(r.arrivalDate);
        return arrivalDate.getFullYear() === selectedYear && arrivalDate.getMonth() === monthIndex;
    });
    const adHocChargesInMonth = adHocCharges.filter(c => {
        const chargeDate = new Date(c.date);
        return chargeDate.getFullYear() === selectedYear && chargeDate.getMonth() === monthIndex;
    });

    const monthName = monthStartDate.toLocaleString('default', { month: 'long' });

    // FULFILLMENT
    const totalShipments = shipmentsInMonth.length;
    const fulfillmentTier = [...pricing.fulfillmentTiers].sort((a, b) => b.volume - a.volume).find(tier => totalShipments >= tier.volume);
    const fulfillmentRate = fulfillmentTier ? fulfillmentTier.price : (pricing.fulfillmentTiers[0]?.price || 0);
    const fulfillmentCost = totalShipments * fulfillmentRate;
    const fulfillmentDetails = shipmentsInMonth.map(s => ({ 'DO No.': s.doNo, 'Order Date': s.orderDate, 'Consignee': s.consigneeName, 'SKU': s.sku, 'Quantity': s.orderedQty }));
    
    // STORAGE
    let totalStorageCost = 0;
    const storageDetailsData = [];
    if (pricing.storage.ratePerPalletPerMonth > 0) {
        const dailyRate = pricing.storage.ratePerPalletPerMonth / 30;
        let currentDate = new Date(monthStartDate);
        while (currentDate <= monthEndDate) {
            let dailyTotalCBM = 0;
            for (const item of items) {
                let balanceOnDate = item.startingStock;
                stockInRecords.filter(r => r.sku === item.sku && new Date(r.arrivalDate) <= currentDate).forEach(r => balanceOnDate += r.arrivedQty);
                stockOutRecords.filter(r => r.sku === item.sku && new Date(r.orderDate) <= currentDate).forEach(r => balanceOnDate -= r.orderedQty);
                if (balanceOnDate > 0) {
                    const itemCBM = (item.lengthCm * item.widthCm * item.heightCm) / 1000000;
                    dailyTotalCBM += itemCBM * balanceOnDate;
                }
            }
            const pallets = pricing.storage.palletCBM > 0 ? dailyTotalCBM / pricing.storage.palletCBM : 0;
            const dailyCost = pallets * dailyRate;
            storageDetailsData.push({ 'Date': currentDate.toISOString().split('T')[0], 'Total CBM': dailyTotalCBM.toFixed(4), 'Pallets': pallets.toFixed(2), 'Cost (RM)': dailyCost.toFixed(2) });
            totalStorageCost += dailyCost;
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    // LOGISTICS
    const deliveredShipments = shipmentsInMonth.filter(s => s.fulfillmentStatus === 'Delivered');
    const logisticsDetails = deliveredShipments.map(shipment => {
        let cost = 0;
        const weight = shipment.totalWeightKg;
        if (weight > 0 && weight < 3) cost = pricing.transport.courier.first3kg;
        else if (weight >= 3) cost = pricing.transport.courier.first3kg + (Math.ceil(weight - 3) * pricing.transport.courier.subsequentKg);
        if (weight >= 25 && weight <= 50) cost = Math.min(cost, pricing.transport.courier.withinState25to50kg);
        return { 'DO No.': shipment.doNo, 'Delivered Date': shipment.deliveredDate, 'Consignee': shipment.consigneeName, 'Total Weight (kg)': shipment.totalWeightKg.toFixed(2), 'Cost (RM)': cost.toFixed(2) };
    });
    const totalLogisticsCost = logisticsDetails.reduce((sum, d) => sum + parseFloat(d['Cost (RM)']), 0);

    // HANDLING
    const handlingDetails:any[] = [];
    stockInInMonth.forEach(rec => {
        const rate = rec.uom === 'Ctn' ? pricing.handling.inboundOutbound.perCarton : pricing.handling.inboundOutbound.perUnit;
        const cost = rec.arrivedQty * rate;
        if(cost > 0) handlingDetails.push({ 'Date': rec.arrivalDate, 'Type': 'Inbound', 'DO No.': rec.doNo, 'SKU': rec.sku, 'Quantity': rec.arrivedQty, 'Cost (RM)': cost.toFixed(2) });
    });
    shipmentsInMonth.forEach(rec => {
        const rate = rec.uom === 'Ctn' ? pricing.handling.inboundOutbound.perCarton : pricing.handling.inboundOutbound.perUnit;
        const cost = rec.orderedQty * rate;
        if(cost > 0) handlingDetails.push({ 'Date': rec.orderDate, 'Type': 'Outbound', 'DO No.': rec.doNo, 'SKU': rec.sku, 'Quantity': rec.orderedQty, 'Cost (RM)': cost.toFixed(2) });
    });
    const totalHandlingCost = handlingDetails.reduce((sum, d) => sum + parseFloat(d['Cost (RM)']), 0) 
        + adHocChargesInMonth.filter(c => c.type === 'Handling').reduce((sum, c) => sum + c.amount, 0);

    // CONSUMABLES
    const perShipmentConsumableCost = pricing.consumableItems.reduce((sum, item) => sum + item.price, 0);
    const totalConsumableCost = (totalShipments * perShipmentConsumableCost) + adHocChargesInMonth.filter(c => c.type === 'Consumable').reduce((sum, c) => sum + c.amount, 0);
    const consumableDetails = pricing.consumableItems.map(item => ({ 'Item': item.name, 'Rate per shipment (RM)': item.price.toFixed(2), 'Total Shipments': totalShipments, 'Total Cost (RM)': (item.price * totalShipments).toFixed(2) }));
    
    // Ad-hoc charges
    const adHocDetails = adHocChargesInMonth.map(c => ({ 'Date': c.date, 'Type': c.type, 'Description': c.description, 'Amount (RM)': c.amount.toFixed(2) }));

    // SUMMARY
    const totalCost = fulfillmentCost + totalStorageCost + totalLogisticsCost + totalHandlingCost + totalConsumableCost;
    const summaryData = [{ 'Category': 'Fulfillment Service', 'Cost (RM)': fulfillmentCost.toFixed(2), 'Details': `${totalShipments} shipments @ RM${fulfillmentRate.toFixed(2)}` }, { 'Category': 'Storage Rental', 'Cost (RM)': totalStorageCost.toFixed(2), 'Details': `Based on daily stock levels` }, { 'Category': 'Logistics Fee', 'Cost (RM)': totalLogisticsCost.toFixed(2), 'Details': `${deliveredShipments.length} delivered shipments` }, { 'Category': 'Handling Fee', 'Cost (RM)': totalHandlingCost.toFixed(2), 'Details': `Includes automated and manual charges` }, { 'Category': 'Consumable Items', 'Cost (RM)': totalConsumableCost.toFixed(2), 'Details': `Includes automated and manual charges` }, { 'Category': 'GRAND TOTAL', 'Cost (RM)': totalCost.toFixed(2), 'Details': '' }];

    const wb = XLSX.utils.book_new();
    const addSheet = (sheetName: string, data: any[]) => {
        if (data.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
    };
    
    addSheet('Summary', summaryData);
    addSheet('Fulfillment', fulfillmentDetails);
    addSheet('Storage', storageDetailsData);
    addSheet('Logistics', logisticsDetails);
    addSheet('Handling', handlingDetails);
    addSheet('Consumables', consumableDetails);
    addSheet('Ad-hoc Charges', adHocDetails);

    XLSX.writeFile(wb, `billing-report-${organization.name}-${selectedYear}-${monthName}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Billing Report</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Itemized Monthly Summary</h3>
          <YearSelector 
             selectedYear={selectedYear}
             availableYears={availableYears}
             onChange={setSelectedYear}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3 text-right">Storage Rental</th>
                <th className="px-4 py-3 text-right">Fulfillment Service</th>
                <th className="px-4 py-3 text-right">Logistics Fee</th>
                <th className="px-4 py-3 text-right">Handling Fee</th>
                <th className="px-4 py-3 text-right">Consumable Item</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {yearlyData.map((row, index) => (
                <tr key={row.month} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">{row.month}</td>
                  <td className="px-4 py-4 text-right">${row.storage.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right">${row.fulfillment.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right">${row.logistics.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right">${row.handling.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right">${row.consumable.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right font-bold text-gray-800">${row.total.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => handleExportMonthlyReport(index)}
                      className="py-1 px-3 bg-teal-600 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                    >
                      Download Excel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
                <tr className="bg-gray-100 font-bold text-gray-800 text-sm">
                    <td className="px-4 py-3">Annual Total</td>
                    <td className="px-4 py-3 text-right">${annualTotal.storage.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${annualTotal.fulfillment.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${annualTotal.logistics.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${annualTotal.handling.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${annualTotal.consumable.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-base">${annualTotal.total.toFixed(2)}</td>
                    <td className="px-4 py-3"></td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingReport;