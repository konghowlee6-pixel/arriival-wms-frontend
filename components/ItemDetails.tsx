import React, { useState, useMemo } from 'react';
import type { Item, StockInRecord, StockOutRecord, PermissionSet, Organization, Warehouse } from '../types';
import EditItemModal from './EditItemModal';
import StockHistoryModal from './StockHistoryModal';

// Add XLSX declaration for Excel export
declare const XLSX: any;

interface ItemDetailsProps {
  items: Item[];
  warehouses: Warehouse[];
  stockInRecords: StockInRecord[];
  stockOutRecords: StockOutRecord[];
  onAddItem: (item: Omit<Item, 'id' | 'balanceStock'>) => void;
  onUpdateItem: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  permissions: PermissionSet;
  organization: Organization;
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


const ItemDetails: React.FC<ItemDetailsProps> = ({ items, warehouses, stockInRecords, stockOutRecords, onAddItem, onUpdateItem, onDeleteItem, permissions, organization }) => {
  const [filter, setFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Item, 'id' | 'balanceStock'>>({
    sku: '', brand: '', description: '', netWeightVolume: '', uom: 'Ctn',
    lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0,
    startingStock: 0, warehouse: warehouses[0]?.name || '', creationDate: ''
  });

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);

  const canEdit = permissions.canEditItems;

  const itemsWithDetails = useMemo(() => {
    return items.map(item => {
      const totalIn = stockInRecords
        .filter(rec => rec.sku === item.sku && rec.warehouse === item.warehouse)
        .reduce((sum, rec) => sum + rec.arrivedQty, 0);
      const totalOut = stockOutRecords
        .filter(rec => rec.sku === item.sku && rec.warehouse === item.warehouse)
        .reduce((sum, rec) => sum + rec.orderedQty, 0);
      
      const balanceStock = item.startingStock + totalIn - totalOut;

      return { ...item, balanceStock };
    });
  }, [items, stockInRecords, stockOutRecords]);

  const filteredItems = itemsWithDetails.filter(item =>
    item.sku.toLowerCase().includes(filter.toLowerCase()) ||
    item.description.toLowerCase().includes(filter.toLowerCase()) ||
    item.brand.toLowerCase().includes(filter.toLowerCase())
  );
  
  const handleExport = () => {
      const dataToExport = filteredItems.map(item => ({
        "Date Created": item.creationDate,
        "SKU": item.sku,
        "Brand": item.brand,
        "Description": item.description,
        "Net Weight / Volume": item.netWeightVolume,
        "UOM": item.uom,
        "Length (cm)": item.lengthCm,
        "Width (cm)": item.widthCm,
        "Height (cm)": item.heightCm,
        "Weight (kg)": item.weightKg,
        "Starting Stock": item.startingStock,
        "Balance Stock": item.balanceStock,
        "Warehouse": item.warehouse,
    }));

    const filename = `item-details-${new Date().toISOString().split('T')[0]}`;
    exportToExcel(dataToExport, filename);
  };


  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.sku || !newItem.description) {
        alert("SKU and Description are required.");
        return;
    }
    onAddItem(newItem);
    setNewItem({
        sku: '', brand: '', description: '', netWeightVolume: '', uom: 'Ctn',
        lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0,
        startingStock: 0, warehouse: warehouses[0]?.name || '', creationDate: ''
    });
    setIsAdding(false);
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: name === 'startingStock' || name.includes('Cm') || name.includes('Kg') ? parseFloat(value) || 0 : value }));
  };

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";
  const exportButtonClass = "py-2 px-4 bg-gray-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-purple-600">{organization.name}</p>
        <h2 className="text-3xl font-bold text-gray-900 mt-1">Item Master List</h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">All Items</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} className={exportButtonClass}>Export to Excel</button>
              {canEdit && (
                <button onClick={() => setIsAdding(!isAdding)} className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
                    {isAdding ? 'Cancel' : 'Add New Item'}
                </button>
              )}
            </div>
        </div>
        
        {isAdding && canEdit && (
            <form onSubmit={handleAddNewItem} className="p-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className={labelClass}>SKU <span className="text-red-500">*</span></label><input type="text" name="sku" value={newItem.sku} onChange={handleNewItemChange} className={inputClass} required /></div>
                <div><label className={labelClass}>Brand</label><input type="text" name="brand" value={newItem.brand} onChange={handleNewItemChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Description <span className="text-red-500">*</span></label><input type="text" name="description" value={newItem.description} onChange={handleNewItemChange} className={inputClass} required /></div>
                <div><label className={labelClass}>Net Weight/Volume</label><input type="text" name="netWeightVolume" value={newItem.netWeightVolume} onChange={handleNewItemChange} className={inputClass} /></div>
                <div><label className={labelClass}>UOM</label><select name="uom" value={newItem.uom} onChange={handleNewItemChange} className={inputClass}><option>Ctn</option><option>Pack</option></select></div>
                <div><label className={labelClass}>Length (cm)</label><input type="number" name="lengthCm" value={newItem.lengthCm} onChange={handleNewItemChange} className={inputClass} /></div>
                <div><label className={labelClass}>Width (cm)</label><input type="number" name="widthCm" value={newItem.widthCm} onChange={handleNewItemChange} className={inputClass} /></div>
                <div><label className={labelClass}>Height (cm)</label><input type="number" name="heightCm" value={newItem.heightCm} onChange={handleNewItemChange} className={inputClass} /></div>
                <div><label className={labelClass}>Weight (kg)</label><input type="number" name="weightKg" value={newItem.weightKg} onChange={handleNewItemChange} className={inputClass} /></div>
                <div><label className={labelClass}>Balance Stock</label><input type="number" name="startingStock" value={newItem.startingStock} onChange={handleNewItemChange} className={inputClass} /></div>
                <div>
                    <label className={labelClass}>Warehouse</label>
                    <select name="warehouse" value={newItem.warehouse} onChange={handleNewItemChange} className={inputClass}>
                        {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                    </select>
                </div>
                <div className="lg:col-span-4 flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancel</button>
                    <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save Item</button>
                </div>
            </form>
        )}

        <div className="mt-4">
             <input 
              type="text" 
              placeholder="Search by SKU, Description, or Brand..." 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)} 
              className={inputClass}
            />
        </div>
        
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Date Created</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Brand</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Net Weight / Volume</th>
                <th className="px-6 py-3">UOM</th>
                <th className="px-6 py-3">Length (cm)</th>
                <th className="px-6 py-3">Width (cm)</th>
                <th className="px-6 py-3">Height (cm)</th>
                <th className="px-6 py-3">Weight (kg)</th>
                <th className="px-6 py-3">Starting Stock</th>
                <th className="px-6 py-3">Balance Stock</th>
                <th className="px-6 py-3">Warehouse</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{item.creationDate}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.sku}</td>
                  <td className="px-6 py-4">{item.brand}</td>
                  <td className="px-6 py-4">{item.description}</td>
                  <td className="px-6 py-4">{item.netWeightVolume}</td>
                  <td className="px-6 py-4">{item.uom}</td>
                  <td className="px-6 py-4">{item.lengthCm}</td>
                  <td className="px-6 py-4">{item.widthCm}</td>
                  <td className="px-6 py-4">{item.heightCm}</td>
                  <td className="px-6 py-4">{item.weightKg}</td>
                  <td className="px-6 py-4">{item.startingStock}</td>
                  <td className="px-6 py-4 font-bold">{item.balanceStock}</td>
                  <td className="px-6 py-4">{item.warehouse}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {canEdit && <button onClick={() => setEditingItem(item)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>}
                    <button onClick={() => setHistoryItem(item)} className="text-blue-600 hover:text-blue-900 font-medium">History</button>
                    {canEdit && <button onClick={() => onDeleteItem(item)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                  <tr><td colSpan={14} className="text-center py-6 text-gray-500">No items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <EditItemModal 
            item={editingItem}
            warehouses={warehouses}
            onClose={() => setEditingItem(null)}
            onUpdateItem={(updatedItem) => {
                onUpdateItem(updatedItem);
                setEditingItem(null);
            }}
        />
      )}

      {historyItem && (
        <StockHistoryModal
            item={historyItem}
            stockInRecords={stockInRecords}
            stockOutRecords={stockOutRecords}
            onClose={() => setHistoryItem(null)}
        />
      )}
    </div>
  );
};

export default ItemDetails;