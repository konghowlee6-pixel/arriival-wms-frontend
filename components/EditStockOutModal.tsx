
import React, { useState, useEffect } from 'react';
import type { Item, StockOutRecord } from '../types';

interface EditStockOutModalProps {
  record: StockOutRecord;
  items: Item[];
  itemsWithBalance: (Item & { balanceStock: number })[];
  onClose: () => void;
  onUpdate: (record: StockOutRecord) => void;
}

const EditStockOutModal: React.FC<EditStockOutModalProps> = ({ record, items, itemsWithBalance, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<StockOutRecord>(record);

  useEffect(() => {
    setFormData(record);
  }, [record]);
  
  const currentBalance = itemsWithBalance.find(i => i.sku === formData.sku && i.warehouse === formData.warehouse)?.balanceStock;
  const originalQty = record.orderedQty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantityChange = formData.orderedQty - originalQty;
    if (currentBalance !== undefined && quantityChange > currentBalance) {
        alert(`Updating quantity would exceed available stock. Only ${currentBalance} more units available.`);
        return;
    }
    onUpdate(formData);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'orderedQty' ? parseInt(value, 10) || 0 : value }));
  };
  
  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Edit Stock Out Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
          <div><label className={labelClass}>Order Date</label><input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} className={inputClass} /></div>
          <div><label className={labelClass}>Consignee</label><input type="text" name="consigneeName" value={formData.consigneeName} onChange={handleChange} className={inputClass} /></div>
          <div><label className={labelClass}>DO No.</label><input type="text" name="doNo" value={formData.doNo} onChange={handleChange} className={inputClass} /></div>
          <div>
            <label className={labelClass}>SKU</label>
            <input type="text" value={formData.sku} className={`${inputClass} bg-gray-100`} readOnly />
          </div>
          <div><label className={labelClass}>Warehouse</label><input type="text" value={formData.warehouse} className={`${inputClass} bg-gray-100`} readOnly /></div>
          <div><label className={labelClass}>Ordered Qty</label><input type="number" name="orderedQty" value={formData.orderedQty} onChange={handleChange} className={inputClass} /></div>
          <hr className="md:col-span-3 my-2"/>
          <div>
            <label className={labelClass}>Fulfillment Status</label>
            <select name="fulfillmentStatus" value={formData.fulfillmentStatus} onChange={handleChange} className={inputClass}>
              <option>Pending</option><option>Delivered</option><option>Self collect</option>
            </select>
          </div>
          <div><label className={labelClass}>Delivered Date</label><input type="date" name="deliveredDate" value={formData.deliveredDate} onChange={handleChange} className={inputClass} /></div>
          <div><label className={labelClass}>Delivered By</label><input type="text" name="deliveredBy" value={formData.deliveredBy} onChange={handleChange} className={inputClass} /></div>

          <div className="md:col-span-3 p-4 border-t flex justify-end bg-gray-50 rounded-b-lg gap-3 -mx-6 -mb-6 mt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
            <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStockOutModal;
