import React, { useState } from 'react';
import type { Warehouse, Item, StockInRecord, StockOutRecord, PermissionSet } from '../types';
import EditWarehouseModal from './EditWarehouseModal';

interface WarehousesProps {
  warehouses: Warehouse[];
  items: Item[];
  stockInRecords: StockInRecord[];
  stockOutRecords: StockOutRecord[];
  onAddWarehouse: (warehouse: Omit<Warehouse, 'id'>) => void;
  onUpdateWarehouse: (warehouse: Warehouse) => void;
  onDeleteWarehouse: (warehouseId: string) => void;
  permissions: PermissionSet;
}

const Warehouses: React.FC<WarehousesProps> = ({ warehouses, items, stockInRecords, stockOutRecords, onAddWarehouse, onUpdateWarehouse, onDeleteWarehouse, permissions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState<Omit<Warehouse, 'id'>>({ name: '', address: '' });
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const canEdit = permissions.canManageWarehouses;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewWarehouse(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.name.trim()) {
      alert('Warehouse name is required.');
      return;
    }
    onAddWarehouse(newWarehouse);
    setNewWarehouse({ name: '', address: '' });
    setIsAdding(false);
  };
  
  const isWarehouseInUse = (warehouseName: string): boolean => {
      return items.some(i => i.warehouse === warehouseName) ||
             stockInRecords.some(i => i.warehouse === warehouseName) ||
             stockOutRecords.some(i => i.warehouse === warehouseName);
  }

  const handleDelete = (warehouse: Warehouse) => {
    if (isWarehouseInUse(warehouse.name)) {
        alert(`Cannot delete "${warehouse.name}" as it is currently in use by items or stock records.`);
        return;
    }
    onDeleteWarehouse(warehouse.id);
  }

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Warehouse Management</h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Warehouse List</h3>
          {canEdit && (
            <button onClick={() => setIsAdding(!isAdding)} className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
              {isAdding ? 'Cancel' : 'Add New Warehouse'}
            </button>
          )}
        </div>

        {isAdding && canEdit && (
          <form onSubmit={handleSubmit} className="p-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Name <span className="text-red-500">*</span></label><input type="text" name="name" value={newWarehouse.name} onChange={handleInputChange} className={inputClass} required /></div>
            <div className="md:col-span-2"><label className={labelClass}>Address</label><textarea name="address" value={newWarehouse.address} onChange={handleInputChange} className={inputClass} rows={3}></textarea></div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancel</button>
              <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save Warehouse</button>
            </div>
          </form>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Address</th>
                {canEdit && <th className="px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {warehouses.map(warehouse => (
                <tr key={warehouse.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{warehouse.name}</td>
                  <td className="px-6 py-4">{warehouse.address}</td>
                  {canEdit && (
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button onClick={() => setEditingWarehouse(warehouse)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                      <button 
                        onClick={() => handleDelete(warehouse)} 
                        className="text-red-600 hover:text-red-900 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={isWarehouseInUse(warehouse.name)}
                        title={isWarehouseInUse(warehouse.name) ? 'This warehouse is in use and cannot be deleted.' : ''}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {warehouses.length === 0 && (
                <tr><td colSpan={canEdit ? 3 : 2} className="text-center py-6 text-gray-500">No warehouses found. Add one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingWarehouse && canEdit && (
        <EditWarehouseModal
          warehouse={editingWarehouse}
          onClose={() => setEditingWarehouse(null)}
          onUpdate={(updatedWarehouse) => {
            onUpdateWarehouse(updatedWarehouse);
            setEditingWarehouse(null);
          }}
        />
      )}
    </div>
  );
};

export default Warehouses;
