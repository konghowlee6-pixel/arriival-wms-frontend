import React from 'react';
import type { Item, StockInRecord, StockOutRecord } from '../types';

interface StockHistoryModalProps {
  item: Item;
  stockInRecords: StockInRecord[];
  stockOutRecords: StockOutRecord[];
  onClose: () => void;
}

interface HistoryRecord {
    date: string;
    type: 'Stock In' | 'Stock Out';
    quantity: number;
    // Fix: Changed warehouse type to string to match StockInRecord and StockOutRecord types.
    warehouse: string;
    doNo: string;
    key: string;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ item, stockInRecords, stockOutRecords, onClose }) => {
  const stockInHistory: HistoryRecord[] = stockInRecords
    .filter(rec => rec.sku === item.sku && rec.warehouse === item.warehouse)
    .map(rec => ({
      date: rec.arrivalDate,
      type: 'Stock In',
      quantity: rec.arrivedQty,
      warehouse: rec.warehouse,
      doNo: rec.doNo,
      key: `in-${rec.id}`,
    }));

  const stockOutHistory: HistoryRecord[] = stockOutRecords
    .filter(rec => rec.sku === item.sku && rec.warehouse === item.warehouse)
    .map(rec => ({
      date: rec.orderDate,
      type: 'Stock Out',
      quantity: rec.orderedQty,
      warehouse: rec.warehouse,
      doNo: rec.doNo,
      key: `out-${rec.id}`,
    }));

  const combinedHistory = [...stockInHistory, ...stockOutHistory]
    .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <style>{`
          @keyframes fade-in-scale {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-scale { animation: fade-in-scale 0.2s forwards; }
        `}</style>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            Stock History for: <span className="font-bold">{item.sku}</span> <span className="text-gray-600 font-normal">({item.description})</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Type</th>
                <th scope="col" className="px-6 py-3">Quantity</th>
                <th scope="col" className="px-6 py-3">Warehouse</th>
                <th scope="col" className="px-6 py-3">DO No.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {combinedHistory.map(record => (
                <tr key={record.key} className="bg-white hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{record.date || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      record.type === 'Stock In'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-bold ${
                      record.type === 'Stock In' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {record.type === 'Stock In' ? '+' : '-'}{record.quantity}
                  </td>
                  <td className="px-6 py-4">{record.warehouse}</td>
                  <td className="px-6 py-4">{record.doNo}</td>
                </tr>
              ))}
              {combinedHistory.length === 0 && (
                  <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">No stock movement history found for this item.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t flex justify-end bg-gray-50 rounded-b-lg">
            <button onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;