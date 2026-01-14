import React, { useState } from 'react';

interface AddNewClientModalProps {
  onClose: () => void;
  onAddClient: (orgName: string, adminEmail: string, adminPass: string) => Promise<void>;
}

const AddNewClientModal: React.FC<AddNewClientModalProps> = ({ onClose, onAddClient }) => {
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!orgName.trim() || !adminEmail.trim() || adminPass.length < 6) {
      setError('Please fill all fields. Password must be at least 6 characters.');
      return;
    }
    setIsSaving(true);
    try {
        await onAddClient(orgName, adminEmail, adminPass);
        alert(`Client "${orgName}" created successfully!`);
        onClose();
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
    } finally {
        setIsSaving(false);
    }
  };

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Add New Client</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="orgName" className={labelClass}>Organization Name</label>
                    <input type="text" id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} className={inputClass} required/>
                </div>
                 <div>
                    <label htmlFor="adminEmail" className={labelClass}>HQ Super Admin Email</label>
                    <input type="email" id="adminEmail" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={inputClass} required/>
                </div>
                 <div>
                    <label htmlFor="adminPass" className={labelClass}>Temporary Password</label>
                    <input type="password" id="adminPass" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className={inputClass} required minLength={6}/>
                </div>
                 {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            </div>
            <div className="p-4 border-t flex justify-end bg-gray-50 rounded-b-lg gap-3">
                <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700" disabled={isSaving}>Cancel</button>
                <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Client'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewClientModal;
