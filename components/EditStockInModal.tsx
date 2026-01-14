

import React, { useState, useEffect } from 'react';
import type { Item, StockInRecord, Warehouse } from '../types';

interface EditStockInModalProps {
  record: StockInRecord;
  items: Item[];
  warehouses: Warehouse[];
  onClose: () => void;
  onUpdate: (record: StockInRecord) => void;
}

const EditStockInModal: React.FC<EditStockInModalProps> = ({ record, items, warehouses, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<StockInRecord>(record);

  useEffect(() => {
    setFormData(record);
  }, [record]);

  useEffect(() => {
    const selectedItem = items.find(item => item.sku === formData.sku && item.warehouse === formData.warehouse);
    if (selectedItem) {
        setFormData(prev => ({
            ...prev,
            brand: selectedItem.brand,
            itemDescription: selectedItem.description,
            netWeightVolume: selectedItem.netWeightVolume,
            uom: selectedItem.uom,
        }));
    }
  }, [formData.sku, formData.warehouse, items]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'arrivedQty' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };
  
  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Edit Stock In Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
            <div><label className={labelClass}>Arrival Date</label><input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>DO No.</label><input type="text" name="doNo" value={formData.doNo} onChange={handleChange} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Warehouse</label>
              <select name="warehouse" value={formData.warehouse} onChange={handleChange} className={inputClass}>
                  {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
              </select>
            </div>
            <div>
                <label className={labelClass}>SKU</label>
                <select name="sku" value={formData.sku} onChange={handleChange} className={inputClass}>
                    <option value="">Select SKU</option>
                    {items.filter(i => i.warehouse === formData.warehouse).map(item => <option key={item.id} value={item.sku}>{item.sku} - {item.description}</option>)}
                </select>
            </div>
            <div className="md:col-span-2"><label className={labelClass}>Description</label><input type="text" name="itemDescription" value={formData.itemDescription} className={`${inputClass} bg-gray-100`} readOnly /></div>
            <div><label className={labelClass}>Arrived Qty</label><input type="number" name="arrivedQty" value={formData.arrivedQty} onChange={handleChange} className={inputClass} /></div>
            <div className="md:col-span-2 p-4 border-t flex justify-end bg-gray-50 rounded-b-lg gap-3 -mx-6 -mb-6 mt-4">
                <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save Changes</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditStockInModal;