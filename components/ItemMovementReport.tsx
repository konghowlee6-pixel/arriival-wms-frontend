// Fix: Implement the ItemMovementReport component which was previously missing.
import React, { useState, useMemo, useEffect } from 'react';
import type { Item, StockInRecord, StockOutRecord, Warehouse } from '../types';

interface ItemMovementReportProps {
  items: Item[];
  stockInRecords: StockInRecord[];
  stockOutRecords: StockOutRecord[];
  warehouses: Warehouse[];
}

interface ReportRow {
  sku: string;
  description: string;
  openingStock: number;
  totalIn: number;
  totalOut: number;
  closingStock: number;
}

const ItemMovementReport: React.FC<ItemMovementReportProps> = ({ items, stockInRecords, stockOutRecords, warehouses }) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(warehouses[0]?.name || '');
  const [skuFilter, setSkuFilter] = useState('');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  
  useEffect(() => {
    if (!selectedWarehouse && warehouses.length > 0) {
      setSelectedWarehouse(warehouses[0].name);
    }
  }, [warehouses, selectedWarehouse]);


  const warehouseItems = items.filter(item => item.warehouse === selectedWarehouse);

  const reportData = useMemo(() => {
    if (!selectedWarehouse) return [];

    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }

    const filteredItems = warehouseItems.filter(item =>
      item.sku.toLowerCase().includes(skuFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(skuFilter.toLowerCase())
    );

    return filteredItems.map(item => {
      let openingStock = item.startingStock;
      
      stockInRecords
        .filter(rec => rec.sku === item.sku && rec.warehouse === selectedWarehouse && (!startDate || new Date(rec.arrivalDate) < startDate))
        .forEach(rec => openingStock += rec.arrivedQty);

      stockOutRecords
        .filter(rec => rec.sku === item.sku && rec.warehouse === selectedWarehouse && (!startDate || new Date(rec.orderDate) < startDate))
        .forEach(rec => openingStock -= rec.orderedQty);

      const totalIn = stockInRecords
        .filter(rec => rec.sku === item.sku && rec.warehouse === selectedWarehouse &&
            (!startDate || new Date(rec.arrivalDate) >= startDate) && 
            (!endDate || new Date(rec.arrivalDate) <= endDate))
        .reduce((sum, rec) => sum + rec.arrivedQty, 0);

      const totalOut = stockOutRecords
        .filter(rec => rec.sku === item.sku && rec.warehouse === selectedWarehouse &&
            (!startDate || new Date(rec.orderDate) >= startDate) && 
            (!endDate || new Date(rec.orderDate) <= endDate))
        .reduce((sum, rec) => sum + rec.orderedQty, 0);

      const closingStock = openingStock + totalIn - totalOut;
      
      return {
        sku: item.sku,
        description: item.description,
        openingStock,
        totalIn,
        totalOut,
        closingStock
      };
    });
  }, [skuFilter, dateRange, warehouseItems, stockInRecords, stockOutRecords, selectedWarehouse]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const exportToCSV = (data: ReportRow[], filename: string) => {
    if (data.length === 0) {
        alert("No data to export.");
        return;
    }
    const headers = ["SKU", "Description", "Opening Stock", "Total In", "Total Out", "Closing Stock"];
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            [row.sku, `"${row.description.replace(/"/g, '""')}"`, row.openingStock, row.totalIn, row.totalOut, row.closingStock].join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    exportToCSV(reportData, `item-movement-report-${selectedWarehouse.toLowerCase()}-${dateRange.start}-to-${dateRange.end}.csv`);
  };

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Item Movement Report</h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1">
            <label htmlFor="warehouse-select" className={labelClass}>Warehouse</label>
            <select
              id="warehouse-select"
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
              className={inputClass}
            >
              {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="skuFilterReport" className={labelClass}>SKU or Description</label>
            <input 
              id="skuFilterReport"
              type="text" 
              placeholder="Search by SKU or Description..." 
              value={skuFilter} 
              onChange={(e) => setSkuFilter(e.target.value)} 
              className={inputClass} 
            />
          </div>
          <div>
            <label htmlFor="startDateReport" className={labelClass}>Start Date</label>
            <input 
              id="startDateReport"
              type="date" 
              name="start" 
              value={dateRange.start} 
              onChange={handleFilterChange} 
              className={inputClass} 
            />
          </div>
          <div>
            <label htmlFor="endDateReport" className={labelClass}>End Date</label>
            <input 
              id="endDateReport"
              type="date" 
              name="end" 
              value={dateRange.end} 
              onChange={handleFilterChange} 
              className={inputClass} 
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <button onClick={handleExport} className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                Export to CSV
            </button>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">SKU</th>
                <th scope="col" className="px-6 py-3">Description</th>
                <th scope="col" className="px-6 py-3">Opening Stock</th>
                <th scope="col" className="px-6 py-3">Total In</th>
                <th scope="col" className="px-6 py-3">Total Out</th>
                <th scope="col" className="px-6 py-3">Closing Stock</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(row => (
                <tr key={row.sku} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{row.sku}</td>
                  <td className="px-6 py-4">{row.description}</td>
                  <td className="px-6 py-4">{row.openingStock}</td>
                  <td className="px-6 py-4 text-green-600 font-semibold">+{row.totalIn}</td>
                  <td className="px-6 py-4 text-red-600 font-semibold">-{row.totalOut}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{row.closingStock}</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                  <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">No item movement found for the selected criteria.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemMovementReport;