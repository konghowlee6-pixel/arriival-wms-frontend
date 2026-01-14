import React, { useState, useEffect } from 'react';
import type { Item, Warehouse } from '../types';

interface EditItemModalProps {
  item: Item;
  warehouses: Warehouse[];
  onClose: () => void;
  onUpdateItem: (item: Item) => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ item, warehouses, onClose, onUpdateItem }) => {
  const [formData, setFormData] = useState<Item>(item);

  useEffect(() => {
    setFormData(item);
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name.includes('Cm') || name.includes('Kg') || name.includes('Stock')) ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateItem(formData);
  };

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Edit Item: {item.sku}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>SKU</label><input type="text" name="sku" value={formData.sku} onChange={handleChange} className={`${inputClass} bg-gray-100`} readOnly /></div>
                <div><label className={labelClass}>Brand</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Description</label><input type="text" name="description" value={formData.description} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Net Weight/Volume</label><input type="text" name="netWeightVolume" value={formData.netWeightVolume} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>UOM</label><select name="uom" value={formData.uom} onChange={handleChange} className={inputClass}><option>Ctn</option><option>Pack</option></select></div>
                <div><label className={labelClass}>Length (cm)</label><input type="number" name="lengthCm" value={formData.lengthCm} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Width (cm)</label><input type="number" name="widthCm" value={formData.widthCm} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Height (cm)</label><input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Weight (kg)</label><input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Starting Stock</label><input type="number" name="startingStock" value={formData.startingStock} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Date Created</label><input type="text" value={formData.creationDate} className={`${inputClass} bg-gray-100`} readOnly /></div>
                <div>
                  <label className={labelClass}>Warehouse</label>
                  <select name="warehouse" value={formData.warehouse} onChange={handleChange} className={`${inputClass} bg-gray-100`} disabled>
                      {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
            </div>
            <div className="p-4 border-t flex justify-end bg-gray-50 rounded-b-lg gap-3">
                <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save Changes</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;