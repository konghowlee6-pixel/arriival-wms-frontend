// Fix: Implement the AuditTrail component which was previously missing.
import React, { useState } from 'react';
import type { AuditTrailRecord } from '../types';

interface AuditTrailProps {
  auditTrail: AuditTrailRecord[];
}

const AuditTrail: React.FC<AuditTrailProps> = ({ auditTrail }) => {
  const [filter, setFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredTrail = auditTrail.filter(record => {
    const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
    const matchesFilter = 
        record.action.toLowerCase().includes(filter.toLowerCase()) ||
        record.details.toLowerCase().includes(filter.toLowerCase()) ||
        record.user.toLowerCase().includes(filter.toLowerCase());
    const matchesDate =
        (!dateRange.start || recordDate >= dateRange.start) &&
        (!dateRange.end || recordDate <= dateRange.end);
    return matchesFilter && matchesDate;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'start' || name === 'end') {
      setDateRange(prev => ({ ...prev, [name]: value }));
    } else {
      setFilter(value);
    }
  };

  const resetFilters = () => {
    setFilter('');
    setDateRange({ start: '', end: '' });
  };
  
  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Audit Trail</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Filter Logs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="lg:col-span-2">
                <label htmlFor="filter" className={labelClass}>Search</label>
                <input 
                    id="filter"
                    type="text" 
                    placeholder="Search by User, Action, or Details..." 
                    value={filter} 
                    onChange={handleFilterChange} 
                    className={inputClass} 
                />
            </div>
            <div>
                <label htmlFor="startDateAudit" className={labelClass}>Start Date</label>
                <input 
                    id="startDateAudit"
                    type="date" 
                    name="start" 
                    value={dateRange.start} 
                    onChange={handleFilterChange} 
                    className={inputClass} 
                />
            </div>
            <div>
                <label htmlFor="endDateAudit" className={labelClass}>End Date</label>
                <input 
                    id="endDateAudit"
                    type="date" 
                    name="end" 
                    value={dateRange.end} 
                    onChange={handleFilterChange} 
                    className={inputClass} 
                />
            </div>
            <div className="flex justify-end">
                <button onClick={resetFilters} className="py-2 px-4 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 transition-colors">Reset</button>
            </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Timestamp</th>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3">Action</th>
                <th scope="col" className="px-6 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrail.map(record => (
                <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(record.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">{record.user}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{record.action}</td>
                  <td className="px-6 py-4">{record.details}</td>
                </tr>
              ))}
              {filteredTrail.length === 0 && (
                <tr><td colSpan={4} className="text-center py-6 text-gray-500">No audit trail records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;