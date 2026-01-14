import React, { useState, useEffect, useMemo } from 'react';
import type { Item, StockOutRecord, StockInRecord, PermissionSet, Consignee, Warehouse } from '../types';
import EditStockOutModal from './EditStockOutModal';

// Add XLSX declaration for Excel export
declare const XLSX: any;

interface StockOutProps {
  items: Item[];
  warehouses: Warehouse[];
  stockInRecords: StockInRecord[];
  stockOutRecords: StockOutRecord[];
  consignees: Consignee[];
  onAddStockOut: (record: Omit<StockOutRecord, 'id' | 'balanceStock' | 'totalWeightKg'>) => void;
  onUpdateStockOut: (record: StockOutRecord) => void;
  onDeleteStockOut: (recordId: string) => void;
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


const StockOut: React.FC<StockOutProps> = ({ items, warehouses, stockInRecords, stockOutRecords, consignees, onAddStockOut, onUpdateStockOut, onDeleteStockOut, permissions }) => {
  const initialFormState: Omit<StockOutRecord, 'id' | 'balanceStock' | 'totalWeightKg'> = {
    orderDate: new Date().toISOString().split('T')[0],
    doNo: '',
    consigneeName: '',
    sku: '',
    brand: '',
    itemDescription: '',
    netWeightVolume: '',
    uom: 'Pack',
    orderedQty: 0,
    fulfillmentStatus: 'Pending',
    deliveredDate: '',
    deliveredBy: '',
    warehouse: warehouses[0]?.name || '',
  };
  const [newRecord, setNewRecord] = useState(initialFormState);
  const [editingRecord, setEditingRecord] = useState<StockOutRecord | null>(null);
  const [lastAddedRecord, setLastAddedRecord] = useState<Omit<StockOutRecord, 'id' | 'balanceStock' | 'totalWeightKg'> | null>(null);

  const canEdit = permissions.canManageStockOut;

  const itemsWithBalance = useMemo(() => {
    return items.map(item => {
      const totalIn = stockInRecords
        .filter(rec => rec.sku === item.sku && rec.warehouse === item.warehouse)
        .reduce((sum, rec) => sum + rec.arrivedQty, 0);
      const totalOut = stockOutRecords
        .filter(rec => rec.sku === item.sku && rec.warehouse === item.warehouse)
        .reduce((sum, rec) => sum + rec.orderedQty, 0);
      return { ...item, balanceStock: item.startingStock + totalIn - totalOut };
    });
  }, [items, stockInRecords, stockOutRecords]);
  
  const currentBalance = itemsWithBalance.find(i => i.sku === newRecord.sku && i.warehouse === newRecord.warehouse)?.balanceStock;

  useEffect(() => {
    if (newRecord.sku) {
      const selectedItem = items.find(item => item.sku === newRecord.sku && item.warehouse === newRecord.warehouse);
      if (selectedItem) {
        setNewRecord(prev => ({ ...prev, brand: selectedItem.brand, itemDescription: selectedItem.description, uom: selectedItem.uom, netWeightVolume: selectedItem.netWeightVolume }));
      }
    } else {
        setNewRecord(prev => ({ ...prev, brand: '', itemDescription: '', netWeightVolume: '', uom: 'Pack' }));
    }
  }, [newRecord.sku, newRecord.warehouse, items]);
  
  const handleExport = () => {
    const dataToExport = stockOutRecords.map(rec => ({
        "Order Date": rec.orderDate,
        "DO No.": rec.doNo,
        "Consignee Name": rec.consigneeName,
        "SKU": rec.sku,
        "Brand": rec.brand,
        "Item Description": rec.itemDescription,
        "Net Weight / Volume": rec.netWeightVolume,
        "UOM": rec.uom,
        "Balance Stock (Before Tx)": rec.balanceStock,
        "Ordered Qty": rec.orderedQty,
        "Fulfillment Status": rec.fulfillmentStatus,
        "Delivered Date": rec.deliveredDate,
        "Delivered By": rec.deliveredBy,
        "Warehouse": rec.warehouse
    }));
    const filename = `stock-out-history-${new Date().toISOString().split('T')[0]}`;
    exportToExcel(dataToExport, filename);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({ ...prev, [name]: name === 'orderedQty' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.sku || newRecord.orderedQty <= 0 || !newRecord.consigneeName) {
      alert('Please select a consignee, an SKU, and enter a valid quantity.');
      return;
    }
    const selectedItem = items.find(item => item.sku === newRecord.sku && item.warehouse === newRecord.warehouse);
    if (!selectedItem) {
      alert('Could not find item details. Please select a valid SKU.');
      return;
    }

    if(currentBalance === undefined || newRecord.orderedQty > currentBalance) {
        alert(`Order quantity (${newRecord.orderedQty}) exceeds available stock (${currentBalance || 0}).`);
        return;
    }

    onAddStockOut(newRecord);
    setLastAddedRecord(newRecord);
    setNewRecord(initialFormState);
  };
  
  const handleDeleteClick = (record: StockOutRecord) => {
    const confirmationMessage = `Are you sure you want to delete the stock-out record for SKU "${record.sku}"?\n\nThis will increase the balance stock by ${record.orderedQty} unit(s).\n\nThis action cannot be undone.`;
    if (window.confirm(confirmationMessage)) {
      onDeleteStockOut(record.id);
    }
  };

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";
  const exportButtonClass = "py-2 px-4 bg-gray-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors";

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Stock Out</h2>
      
      {canEdit && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Record New Stock Order</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {/* Order Info */}
            <div><label className={labelClass}>Order Date <span className="text-red-500">*</span></label><input type="date" name="orderDate" value={newRecord.orderDate} onChange={handleInputChange} className={inputClass} /></div>
            <div>
                <label className={labelClass}>Consignee <span className="text-red-500">*</span></label>
                <select name="consigneeName" value={newRecord.consigneeName} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select a consignee</option>
                    {consignees.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>
            <div><label className={labelClass}>DO No. <span className="text-red-500">*</span></label><input type="text" name="doNo" value={newRecord.doNo} onChange={handleInputChange} className={inputClass} placeholder="Delivery Order No." /></div>
            <div>
                <label className={labelClass}>Warehouse <span className="text-red-500">*</span></label>
                <select name="warehouse" value={newRecord.warehouse} onChange={handleInputChange} className={inputClass}>
                    {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
            </div>
            
            {/* Item Selection & Quantity */}
            <div className="lg:col-span-2">
                <label className={labelClass}>SKU <span className="text-red-500">*</span></label>
                <select name="sku" value={newRecord.sku} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select SKU</option>
                    {items.filter(i => i.warehouse === newRecord.warehouse).map(item => <option key={item.id} value={item.sku}>{item.sku} - {item.description}</option>)}
                </select>
            </div>
            <div className="lg:col-span-2">
                <label className={labelClass}>Item Description</label>
                <input type="text" name="itemDescription" value={newRecord.itemDescription} className={`${inputClass} bg-gray-100`} readOnly />
            </div>

            {/* Derived Item Details & Stock */}
            <div>
                <label className={labelClass}>Net Weight / Volume</label>
                <input type="text" name="netWeightVolume" value={newRecord.netWeightVolume} className={`${inputClass} bg-gray-100`} readOnly />
            </div>
            <div>
                <label className={labelClass}>UOM</label>
                <input type="text" name="uom" value={newRecord.uom} className={`${inputClass} bg-gray-100`} readOnly />
            </div>
            <div>
                <label className={labelClass}>Current Stock</label>
                <input type="text" value={currentBalance ?? 'Select SKU'} className={`${inputClass} bg-gray-100`} readOnly />
            </div>
            <div>
                <label className={labelClass}>Ordered Qty <span className="text-red-500">*</span></label>
                <input type="number" name="orderedQty" value={newRecord.orderedQty} onChange={handleInputChange} className={inputClass} />
            </div>

            {/* Fulfillment Details */}
            <hr className="lg:col-span-4 my-2 border-t border-gray-200" />
            <h4 className="lg:col-span-4 text-md font-semibold text-gray-700 -mb-2">Fulfillment Details</h4>
            
            <div>
                <label className={labelClass}>Fulfillment Status</label>
                <select name="fulfillmentStatus" value={newRecord.fulfillmentStatus} onChange={handleInputChange} className={inputClass}>
                    <option>Pending</option>
                    <option>Delivered</option>
                    <option>Self collect</option>
                </select>
            </div>

            <div>
                <label className={labelClass}>Delivered Date</label>
                <input type="date" name="deliveredDate" value={newRecord.deliveredDate} onChange={handleInputChange} className={inputClass} />
            </div>

            <div className="lg:col-span-2">
                <label className={labelClass}>Delivered By</label>
                <input type="text" name="deliveredBy" value={newRecord.deliveredBy} onChange={handleInputChange} className={inputClass} placeholder="e.g., Ipin, Office" />
            </div>

            {/* Submit button */}
            <div className="lg:col-span-4 flex justify-end mt-4 gap-3">
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
            <h3 className="text-xl font-semibold text-gray-800">Stock Out History</h3>
            <div className="flex items-center gap-2">
                <button onClick={() => handleExport()} className={exportButtonClass}>Export to Excel</button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Order Date</th>
                <th className="px-6 py-3">DO No.</th>
                <th className="px-6 py-3">Consignee Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Brand</th>
                <th className="px-6 py-3">Item Description</th>
                <th className="px-6 py-3">Net Weight / Volume</th>
                <th className="px-6 py-3">UOM</th>
                <th className="px-6 py-3">Balance Stock</th>
                <th className="px-6 py-3">Ordered Qty</th>
                <th className="px-6 py-3">Fulfillment Status</th>
                <th className="px-6 py-3">Delivered Date</th>
                <th className="px-6 py-3">Delivered By</th>
                {canEdit && <th className="px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {stockOutRecords.map(rec => (
                <tr key={rec.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{rec.orderDate}</td>
                  <td className="px-6 py-4">{rec.doNo}</td>
                  <td className="px-6 py-4">{rec.consigneeName}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{rec.sku}</td>
                  <td className="px-6 py-4">{rec.brand}</td>
                  <td className="px-6 py-4">{rec.itemDescription}</td>
                  <td className="px-6 py-4">{rec.netWeightVolume}</td>
                  <td className="px-6 py-4">{rec.uom}</td>
                  <td className="px-6 py-4">{rec.balanceStock}</td>
                  <td className="px-6 py-4 font-semibold text-red-600">-{rec.orderedQty}</td>
                  <td className="px-6 py-4">{rec.fulfillmentStatus}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{rec.deliveredDate}</td>
                  <td className="px-6 py-4">{rec.deliveredBy}</td>
                  {canEdit && (
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => setEditingRecord(rec)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                      <button onClick={() => handleDeleteClick(rec)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {stockOutRecords.length === 0 && (
                  <tr><td colSpan={canEdit ? 14 : 13} className="text-center py-6 text-gray-500">No stock-out records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingRecord && canEdit && (
        <EditStockOutModal 
            record={editingRecord}
            items={items}
            itemsWithBalance={itemsWithBalance}
            onClose={() => setEditingRecord(null)}
            onUpdate={(updatedRecord) => {
                onUpdateStockOut(updatedRecord);
                setEditingRecord(null);
            }}
        />
      )}
    </div>
  );
};

export default StockOut;