import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { DeliveryOrder, PermissionSet } from '../types';

// Add XLSX declaration for Excel export
declare const XLSX: any;

// Modal Component for editing DO
interface EditDOModalProps {
  order: DeliveryOrder;
  onClose: () => void;
  onUpdate: (order: DeliveryOrder) => void;
}

const EditDOModal: React.FC<EditDOModalProps> = ({ order, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<DeliveryOrder>(order);

  useEffect(() => {
    setFormData(order);
  }, [order]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doNo.trim()) {
        alert("DO Number cannot be empty.");
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
          <h3 className="text-xl font-semibold text-gray-800">Edit Delivery Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
                <div>
                    <label className={labelClass}>DO Number</label>
                    <input type="text" name="doNo" value={formData.doNo} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>File Name</label>
                    <input type="text" value={formData.fileInfo.name} className={`${inputClass} bg-gray-100`} readOnly />
                </div>
                 <div>
                    <label className={labelClass}>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
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


interface DOUploadProps {
  deliveryOrders: DeliveryOrder[];
  onAddDeliveryOrder: (order: Omit<DeliveryOrder, 'id'>) => void;
  onUpdateDeliveryOrder: (order: DeliveryOrder) => void;
  permissions: PermissionSet;
}

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};


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

const DOUpload: React.FC<DOUploadProps> = ({ deliveryOrders, onAddDeliveryOrder, onUpdateDeliveryOrder, permissions }) => {
  const [doNo, setDoNo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DeliveryOrder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const doNoInputRef = useRef<HTMLInputElement>(null);
  
  const canEdit = permissions.canManageDO;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doNo.trim()) {
      alert('Please enter a DO Number.');
      doNoInputRef.current?.focus();
      return;
    }
    if (!file) {
      alert('Please upload a DO Document.');
      return;
    }

    setIsUploading(true);
    try {
      const fileContent = await fileToDataURL(file);
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newDeliveryOrder: Omit<DeliveryOrder, 'id'> = {
        doNo: doNo.trim(),
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          content: fileContent,
        },
        uploadDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        status: 'Completed',
      };
      onAddDeliveryOrder(newDeliveryOrder);

      alert('Delivery Order uploaded successfully!');

      setDoNo('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
        console.error("Upload failed:", error);
        alert("An error occurred during upload. Please try again.");
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleExport = () => {
    const dataToExport = deliveryOrders.map(order => ({
        "DO Number": order.doNo,
        "File Name": order.fileInfo.name,
        "Upload Date": order.uploadDate,
        "Status": order.status,
    }));
    const filename = `delivery-orders-${new Date().toISOString().split('T')[0]}`;
    exportToExcel(dataToExport, filename);
  };

  const handleDownload = (order: DeliveryOrder) => {
    if (!order.fileInfo.content) {
        alert('File content is not available for download.');
        return;
    }
    const link = document.createElement('a');
    link.href = order.fileInfo.content;
    link.download = order.fileInfo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";
  const exportButtonClass = "py-2 px-4 bg-gray-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors";

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Upload Delivery Order</h2>
      
      {canEdit && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Upload New DO</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 items-end gap-6">
            <div className="md:col-span-1">
                <label htmlFor="doNoUpload" className={labelClass}>DO Number</label>
                <input 
                id="doNoUpload"
                ref={doNoInputRef}
                type="text" 
                value={doNo} 
                onChange={(e) => setDoNo(e.target.value)} 
                placeholder="Enter DO Number" 
                className={inputClass}
                />
            </div>
            <div className="md:col-span-1">
                <label htmlFor="do-file-input" className={labelClass}>DO Document</label>
                <input 
                ref={fileInputRef}
                id="do-file-input"
                type="file" 
                onChange={handleFileChange} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
            </div>
            <button 
                type="submit" 
                disabled={isUploading}
                className="py-2 px-6 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors w-full md:w-auto disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isUploading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                </>
                ) : (
                'Upload DO'
                )}
            </button>
            </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Uploaded Documents</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => handleExport()} className={exportButtonClass}>Export to Excel</button>
            </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">DO No.</th>
                <th scope="col" className="px-6 py-3">File Name</th>
                <th scope="col" className="px-6 py-3">Upload Date</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryOrders.map(order => (
                <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{order.doNo}</td>
                  <td className="px-6 py-4">{order.fileInfo.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.uploadDate}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-4">
                    {canEdit && (
                        <button 
                            onClick={() => setEditingOrder(order)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                            Edit
                        </button>
                    )}
                    <button 
                        onClick={() => handleDownload(order)} 
                        disabled={!order.fileInfo.content}
                        className="text-green-600 hover:text-green-900 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                        title={!order.fileInfo.content ? "File content not available" : "Download file"}
                    >
                        Download
                    </button>
                  </td>
                </tr>
              ))}
              {deliveryOrders.length === 0 && (
                  <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">No delivery orders uploaded yet.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editingOrder && canEdit && (
        <EditDOModal 
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onUpdate={(updatedOrder) => {
            onUpdateDeliveryOrder(updatedOrder);
            setEditingOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default DOUpload;