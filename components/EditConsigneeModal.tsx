import React, { useState, useEffect } from 'react';
import type { Consignee } from '../types';

interface EditConsigneeModalProps {
  consignee: Consignee;
  onClose: () => void;
  onUpdate: (consignee: Consignee) => void;
}

const EditConsigneeModal: React.FC<EditConsigneeModalProps> = ({ consignee, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<Consignee>(consignee);

  useEffect(() => {
    setFormData(consignee);
  }, [consignee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Consignee name cannot be empty.");
      return;
    }
    onUpdate(formData);
  };

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Edit Consignee</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Name <span className="text-red-500">*</span></label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} required /></div>
                <div><label className={labelClass}>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Address</label><textarea name="address" value={formData.address} onChange={handleChange} className={inputClass} rows={3}></textarea></div>
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

export default EditConsigneeModal;