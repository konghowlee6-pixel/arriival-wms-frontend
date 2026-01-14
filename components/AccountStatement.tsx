import React, { useState, useMemo } from 'react';
import type { Item, StockInRecord, StockOutRecord, Organization } from '../types';

interface AccountStatementProps {
  items: Item[];
  stockInRecords: StockInRecord[];
  stockOutRecords: StockOutRecord[];
  organization: Organization;
}

const AccountStatement: React.FC<AccountStatementProps> = ({ items, stockInRecords, stockOutRecords, organization }) => {
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  const statementData = useMemo(() => {
    const { start, end } = dateRange;
    if (!start || !end || new Date(start) > new Date(end)) return null;

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    
    const { pricing } = organization;
    let totalFulfillment = 0, totalStorage = 0, totalTransport = 0, totalHandling = 0;
    
    // 1. Fulfillment Charges
    const shipmentsInRange = stockOutRecords.filter(r => {
        const orderDate = new Date(r.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
    });
    const totalShipments = shipmentsInRange.length;
    const fulfillmentTier = [...pricing.fulfillmentTiers]
        .sort((a,b) => b.volume - a.volume)
        .find(tier => totalShipments >= tier.volume);
    const fulfillmentRate = fulfillmentTier ? fulfillmentTier.price : 0;
    totalFulfillment = totalShipments * fulfillmentRate;
    
    // 2. Storage Rental Charges
    const storageDetails: { date: string, cbm: number, pallets: number, cost: number }[] = [];
    if (pricing.storage.ratePerPalletPerMonth > 0) {
        let currentDate = new Date(start);
        const dailyRate = pricing.storage.ratePerPalletPerMonth / 30; // Assuming 30 days per month
        
        while (currentDate <= endDate) {
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
            const dailyCost = pallets * dailyRate;
            storageDetails.push({ date: currentDate.toISOString().split('T')[0], cbm: dailyTotalCBM, pallets, cost: dailyCost });
            totalStorage += dailyCost;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    
    // 3. Transport Charges (Billed only on 'Delivered' status)
    const transportDetails: (StockOutRecord & { cost: number })[] = [];
    const deliveredShipmentsInRange = shipmentsInRange.filter(s => s.fulfillmentStatus === 'Delivered');
    deliveredShipmentsInRange.forEach(shipment => {
        let cost = 0;
        const weight = shipment.totalWeightKg;
        if (weight > 0 && weight < 3) cost = pricing.transport.courier.first3kg;
        else if (weight >= 3) cost = pricing.transport.courier.first3kg + (Math.ceil(weight - 3) * pricing.transport.courier.subsequentKg);
        
        if (weight >= 25 && weight <= 50) { // Assuming this is an alternative rate
           cost = Math.min(cost, pricing.transport.courier.withinState25to50kg);
        }
        // Ocean freight is not automatically calculated as it's a manual choice.
        if(cost > 0) {
          transportDetails.push({ ...shipment, cost });
          totalTransport += cost;
        }
    });

    // 4. Handling Charges
    const handlingDetails: { date: string, type: 'Inbound'|'Outbound', uom: string, qty: number, cost: number, doNo: string }[] = [];
    const inboundInRange = stockInRecords.filter(r => {
        const arrivalDate = new Date(r.arrivalDate);
        return arrivalDate >= startDate && arrivalDate <= endDate;
    });
    inboundInRange.forEach(rec => {
        const rate = rec.uom === 'Ctn' ? pricing.handling.inboundOutbound.perCarton : pricing.handling.inboundOutbound.perUnit;
        const cost = rec.arrivedQty * rate;
        if(cost > 0) {
          handlingDetails.push({ date: rec.arrivalDate, type: 'Inbound', uom: rec.uom, qty: rec.arrivedQty, cost, doNo: rec.doNo });
          totalHandling += cost;
        }
    });
    shipmentsInRange.forEach(rec => {
        const rate = rec.uom === 'Ctn' ? pricing.handling.inboundOutbound.perCarton : pricing.handling.inboundOutbound.perUnit;
        const cost = rec.orderedQty * rate;
        if (cost > 0) {
            handlingDetails.push({ date: rec.orderDate, type: 'Outbound', uom: rec.uom, qty: rec.orderedQty, cost, doNo: rec.doNo });
            totalHandling += cost;
        }
    });

    return { 
      fulfillment: { totalShipments, rate: fulfillmentRate, total: totalFulfillment },
      storage: { details: storageDetails, total: totalStorage },
      transport: { details: transportDetails, total: totalTransport },
      handling: { details: handlingDetails, total: totalHandling },
      grandTotal: totalFulfillment + totalStorage + totalTransport + totalHandling,
    };
  }, [dateRange, items, stockInRecords, stockOutRecords, organization]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePrint = () => {
    const printContent = document.getElementById('print-area')?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
        document.body.innerHTML = `
            <html>
                <head>
                    <title>Account Statement</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body class="p-8">${printContent}</body>
            </html>
        `;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Reload to re-attach React components
    }
  };

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center no-print">
            <h2 className="text-3xl font-bold text-gray-900">Account Statement</h2>
            <button onClick={handlePrint} className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700">Print Statement</button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end border-b pb-4 mb-4 no-print">
                <div>
                    <label htmlFor="startDateReport" className={labelClass}>Start Date</label>
                    <input id="startDateReport" type="date" name="start" value={dateRange.start} onChange={handleDateChange} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="endDateReport" className={labelClass}>End Date</label>
                    <input id="endDateReport" type="date" name="end" value={dateRange.end} onChange={handleDateChange} className={inputClass} />
                </div>
            </div>

            <div id="print-area">
                {/* Printable Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
                    <p className="text-gray-500">For period: {dateRange.start} to {dateRange.end}</p>
                    <div className="mt-6 border-t pt-4">
                        <h2 className="text-base font-semibold text-gray-800">Bill To:</h2>
                        <address className="mt-2 not-italic text-gray-600">
                            <strong className="block font-semibold text-gray-700">{organization.name}</strong>
                            {organization.billingAddress && <span className="block">{organization.billingAddress}</span>}
                            {organization.companyRegNo && <span className="block">Reg: {organization.companyRegNo}</span>}
                            {organization.contactPerson && <span className="block">Attn: {organization.contactPerson}</span>}
                            {organization.contactEmail && <span className="block">{organization.contactEmail}</span>}
                            {organization.contactPhone && <span className="block">{organization.contactPhone}</span>}
                        </address>
                    </div>
                </div>

                {statementData ? (
                    <div className="space-y-8">
                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                            <div className="bg-gray-50 p-4 rounded-lg"><h4 className="text-sm font-medium text-gray-500 uppercase">Fulfillment</h4><p className="mt-1 text-2xl font-semibold text-gray-900">${statementData.fulfillment.total.toFixed(2)}</p></div>
                            <div className="bg-gray-50 p-4 rounded-lg"><h4 className="text-sm font-medium text-gray-500 uppercase">Storage</h4><p className="mt-1 text-2xl font-semibold text-gray-900">${statementData.storage.total.toFixed(2)}</p></div>
                            <div className="bg-gray-50 p-4 rounded-lg"><h4 className="text-sm font-medium text-gray-500 uppercase">Transport</h4><p className="mt-1 text-2xl font-semibold text-gray-900">${statementData.transport.total.toFixed(2)}</p></div>
                            <div className="bg-gray-50 p-4 rounded-lg"><h4 className="text-sm font-medium text-gray-500 uppercase">Handling</h4><p className="mt-1 text-2xl font-semibold text-gray-900">${statementData.handling.total.toFixed(2)}</p></div>
                            <div className="bg-purple-50 p-4 rounded-lg"><h4 className="text-sm font-medium text-purple-700 uppercase">Grand Total</h4><p className="mt-1 text-2xl font-semibold text-purple-900">${statementData.grandTotal.toFixed(2)}</p></div>
                        </div>

                        {/* Detailed Breakdowns */}
                        <div className="space-y-6">
                            <div><h3 className="text-xl font-semibold text-gray-800 mb-2">Charges Breakdown</h3></div>
                            
                            {/* Fulfillment */}
                            <div className="p-4 border rounded-md"><h4 className="font-semibold">Fulfillment Service</h4><p className="text-sm text-gray-600">{statementData.fulfillment.totalShipments} shipments @ ${statementData.fulfillment.rate.toFixed(2)}/shipment = <span className="font-bold">${statementData.fulfillment.total.toFixed(2)}</span></p></div>
                            
                            {/* Storage */}
                            <div className="p-4 border rounded-md"><h4 className="font-semibold mb-2">Storage Rental</h4>
                                <p className="text-sm text-gray-600 mb-2">Total Cost: <span className="font-bold">${statementData.storage.total.toFixed(2)}</span></p>
                            </div>
                            
                            {/* Transport */}
                            <div className="p-4 border rounded-md"><h4 className="font-semibold mb-2">Transport Service</h4>
                                {statementData.transport.details.length > 0 ? (
                                    <p className="text-sm text-gray-600 mb-2">Total Cost: <span className="font-bold">${statementData.transport.total.toFixed(2)}</span> ({statementData.transport.details.length} chargeable shipments)</p>
                                ) : <p className="text-sm text-gray-500">No transport charges in this period.</p>}
                            </div>

                            {/* Handling */}
                             <div className="p-4 border rounded-md"><h4 className="font-semibold mb-2">Handling Process</h4>
                                {statementData.handling.details.length > 0 ? (
                                    <p className="text-sm text-gray-600 mb-2">Total Cost: <span className="font-bold">${statementData.handling.total.toFixed(2)}</span> ({statementData.handling.details.length} chargeable events)</p>
                                ) : <p className="text-sm text-gray-500">No handling charges in this period.</p>}
                            </div>
                        </div>
                        
                         {/* Rates */}
                        <div className="space-y-6 pt-4 border-t">
                             <div><h3 className="text-xl font-semibold text-gray-800 mb-2">Applied Rates</h3></div>
                             <div className="p-4 border rounded-md">
                                <h4 className="font-semibold mb-2">Consumable Item Rates</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    {organization.pricing.consumableItems.map(c => <li key={c.id}>{c.name}: ${c.price.toFixed(2)} / {c.unit}</li>)}
                                </ul>
                             </div>
                        </div>

                    </div>
                ) : (
                    <p className="text-center py-10 text-gray-500">Please select a valid date range to generate a statement.</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default AccountStatement;