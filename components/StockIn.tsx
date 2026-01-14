


import React, { useState, useEffect } from 'react';
import type { Item, StockInRecord, PermissionSet, Warehouse } from '../types';
import EditStockInModal from './EditStockInModal';

// Add XLSX declaration for Excel export
declare const XLSX: any;

interface StockInProps {
  items: Item[];
  warehouses: Warehouse[];
  stockInRecords: StockInRecord[];
  onAddStockIn: (record: Omit<StockInRecord, 'id'>) => void;
  onUpdateStockIn: (record: StockInRecord) => void;
  onDeleteStockIn: (record: StockInRecord) => void;
  permissions: PermissionSet;
}

// Generic export to Excel function
const exportToExcel = (data: any[], filename: string) => {
    if (typeof XLSX === 'undefined') {
        console.error("XLSX library is not loaded.");
        alert("Excel export functionality is currently unavailable.");
        return;
    }
    if (data.length === 0) {
        alert("No data to export.");
        return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

const StockIn: React.FC<StockInProps> = ({ items, warehouses, stockInRecords, onAddStockIn, onUpdateStockIn, onDeleteStockIn, permissions }) => {
  const initialFormState: Omit<StockInRecord, 'id'> = {
    arrivalDate: new Date().toISOString().split('T')[0],
    doNo: '',
    sku: '',
    brand: '',
    itemDescription: '',
    netWeightVolume: '',
    uom: 'Pack',
    arrivedQty: 0,
    warehouse: warehouses[0]?.name || '',
  };
  const [newRecord, setNewRecord] = useState(initialFormState);
  const [editingRecord, setEditingRecord] = useState<StockInRecord | null>(null);
  const [lastAddedRecord, setLastAddedRecord] = useState<Omit<StockInRecord, 'id'> | null>(null);
  const canEdit = permissions.canManageStockIn;

  useEffect(() => {
    if (newRecord.sku) {
      const selectedItem = items.find(item => item.sku === newRecord.sku && item.warehouse === newRecord.warehouse);
      if (selectedItem) {
        setNewRecord(prev => ({
          ...prev,
          brand: selectedItem.brand,
          itemDescription: selectedItem.description,
          netWeightVolume: selectedItem.netWeightVolume,
          uom: selectedItem.uom,
        }));
      }
    } else {
        setNewRecord(prev => ({
            ...prev,
            brand: '',
            itemDescription: '',
            netWeightVolume: '',
            uom: 'Pack',
        }));
    }
  }, [newRecord.sku, newRecord.warehouse, items]);
  
  const handleExport = () => {
      const dataToExport = stockInRecords.map(rec => ({
        "Arrival Date": rec.arrivalDate,
        "DO No.": rec.doNo,
        "SKU": rec.sku,
        "Brand": rec.brand,
        "Item Description": rec.itemDescription,
        "Net Weight / Volume": rec.netWeightVolume,
        "UOM": rec.uom,
        "Arrived Qty": rec.arrivedQty,
        "Warehouse": rec.warehouse
    }));
    const filename = `stock-in-history-${new Date().toISOString().split('T')[0]}`;
    exportToExcel(dataToExport, filename);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({ ...prev, [name]: name === 'arrivedQty' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.sku || newRecord.arrivedQty <= 0) {
      alert('Please select an SKU and enter a valid quantity.');
      return;
    }
    onAddStockIn(newRecord);
    setLastAddedRecord(newRecord);
    setNewRecord(initialFormState);
  };
  
  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";
  const exportButtonClass = "py-2 px-4 bg-gray-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors";

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Stock In</h2>

      {canEdit && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Record New Stock Arrival</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div><label className={labelClass}>Arrival Date <span className="text-red-500">*</span></label><input type="date" name="arrivalDate" value={newRecord.arrivalDate} onChange={handleInputChange} className={inputClass} /></div>
            <div><label className={labelClass}>DO No. <span className="text-red-500">*</span></label><input type="text" name="doNo" value={newRecord.doNo} onChange={handleInputChange} className={inputClass} placeholder="Delivery Order No."/></div>
            <div>
              <label className={labelClass}>Warehouse <span className="text-red-500">*</span></label>
              <select name="warehouse" value={newRecord.warehouse} onChange={handleInputChange} className={inputClass}>
                  {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>SKU <span className="text-red-500">*</span></label>
              <select name="sku" value={newRecord.sku} onChange={handleInputChange} className={inputClass}>
                <option value="">Select SKU</option>
                {items.filter(i => i.warehouse === newRecord.warehouse).map(item => <option key={item.id} value={item.sku}>{item.sku} - {item.description}</option>)}
              </select>
            </div>
            <div className="lg:col-span-4"><label className={labelClass}>Description</label><input type="text" name="itemDescription" value={newRecord.itemDescription} className={`${inputClass} bg-gray-100`} readOnly /></div>
            <div className="lg:col-span-2">
                <label className={labelClass}>Net Weight / Volume</label>
                <input type="text" name="netWeightVolume" value={newRecord.netWeightVolume} onChange={handleInputChange} className={inputClass} placeholder="e.g., 2KG/6L" />
            </div>
            <div>
                <label className={labelClass}>UOM</label>
                <select name="uom" value={newRecord.uom} onChange={handleInputChange} className={inputClass}>
                    <option>Pack</option>
                    <option>Ctn</option>
                </select>
            </div>
            <div><label className={labelClass}>Arrived Qty <span className="text-red-500">*</span></label><input type="number" name="arrivedQty" value={newRecord.arrivedQty} onChange={handleInputChange} className={inputClass} /></div>
            <div className="lg:col-span-4 flex justify-end gap-3">
              {lastAddedRecord && (
                <button 
                  type="button" 
                  onClick={() => { if (lastAddedRecord) setNewRecord(lastAddedRecord); }}
                  className="py-2 px-6 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                >
                  Repeat Last
                </button>
              )}
              <button type="submit" className="py-2 px-6 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">Add Record</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Stock In History</h3>
            <div className="flex items-center gap-2">
                <button onClick={handleExport} className={exportButtonClass}>Export to Excel</button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Arrival Date</th>
                <th className="px-6 py-3">DO No.</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Brand</th>
                <th className="px-6 py-3">Item Description</th>
                <th className="px-6 py-3">Net Weight / Volume</th>
                <th className="px-6 py-3">UOM</th>
                <th className="px-6 py-3">Arrived Qty</th>
                {canEdit && <th className="px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {stockInRecords.map(rec => (
                <tr key={rec.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{rec.arrivalDate}</td>
                  <td className="px-6 py-4">{rec.doNo}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{rec.sku}</td>
                  <td className="px-6 py-4">{rec.brand}</td>
                  <td className="px-6 py-4">{rec.itemDescription}</td>
                  <td className="px-6 py-4">{rec.netWeightVolume}</td>
                  <td className="px-6 py-4">{rec.uom}</td>
                  <td className="px-6 py-4 font-semibold text-green-600">+{rec.arrivedQty}</td>
                  {canEdit && (
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => setEditingRecord(rec)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                      <button onClick={() => onDeleteStockIn(rec)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
               {stockInRecords.length === 0 && (
                  <tr><td colSpan={canEdit ? 9 : 8} className="text-center py-6 text-gray-500">No stock-in records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingRecord && canEdit && (
        <EditStockInModal 
            record={editingRecord}
            items={items}
            warehouses={warehouses}
            onClose={() => setEditingRecord(null)}
            onUpdate={(updatedRecord) => {
                onUpdateStockIn(updatedRecord);
                setEditingRecord(null);
            }}
        />
      )}
    </div>
  );
};

export default StockIn;