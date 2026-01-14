import React, { useState, useMemo } from 'react';
import type { Consignee, PermissionSet } from '../types';
import EditConsigneeModal from './EditConsigneeModal';

interface ConsigneesProps {
  consignees: Consignee[];
  onAddConsignee: (consignee: Omit<Consignee, 'id'>) => void;
  onUpdateConsignee: (consignee: Consignee) => void;
  onDeleteConsignee: (consigneeId: string) => void;
  permissions: PermissionSet;
}

const Consignees: React.FC<ConsigneesProps> = ({ consignees, onAddConsignee, onUpdateConsignee, onDeleteConsignee, permissions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newConsignee, setNewConsignee] = useState<Omit<Consignee, 'id'>>({
    name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [editingConsignee, setEditingConsignee] = useState<Consignee | null>(null);

  const canEdit = permissions.canManageConsignees;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewConsignee(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsignee.name.trim()) {
      alert('Consignee name is required.');
      return;
    }
    onAddConsignee(newConsignee);
    setNewConsignee({ name: '', address: '', phone: '', email: '' });
    setIsAdding(false);
  };

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Consignee Management</h2>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Consignee List</h3>
          {canEdit && (
            <button onClick={() => setIsAdding(!isAdding)} className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
              {isAdding ? 'Cancel' : 'Add New Consignee'}
            </button>
          )}
        </div>

        {isAdding && canEdit && (
          <form onSubmit={handleSubmit} className="p-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Name <span className="text-red-500">*</span></label><input type="text" name="name" value={newConsignee.name} onChange={handleInputChange} className={inputClass} required /></div>
            <div><label className={labelClass}>Email</label><input type="email" name="email" value={newConsignee.email} onChange={handleInputChange} className={inputClass} /></div>
            <div><label className={labelClass}>Phone</label><input type="tel" name="phone" value={newConsignee.phone} onChange={handleInputChange} className={inputClass} /></div>
            <div className="md:col-span-2"><label className={labelClass}>Address</label><textarea name="address" value={newConsignee.address} onChange={handleInputChange} className={inputClass} rows={3}></textarea></div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancel</button>
              <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save Consignee</button>
            </div>
          </form>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Address</th>
                {canEdit && <th className="px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {consignees.map(consignee => (
                <tr key={consignee.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{consignee.name}</td>
                  <td className="px-6 py-4">{consignee.email}</td>
                  <td className="px-6 py-4">{consignee.phone}</td>
                  <td className="px-6 py-4">{consignee.address}</td>
                  {canEdit && (
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button onClick={() => setEditingConsignee(consignee)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                      <button onClick={() => onDeleteConsignee(consignee.id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {consignees.length === 0 && (
                <tr><td colSpan={canEdit ? 5 : 4} className="text-center py-6 text-gray-500">No consignees found. Add one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingConsignee && canEdit && (
        <EditConsigneeModal
          consignee={editingConsignee}
          onClose={() => setEditingConsignee(null)}
          onUpdate={(updatedConsignee) => {
            onUpdateConsignee(updatedConsignee);
            setEditingConsignee(null);
          }}
        />
      )}
    </div>
  );
};

export default Consignees;