


import React, { useState, useEffect } from 'react';
// FIX: Import Warehouse type
import type { Organization, User, Warehouse } from '../types';
import { defaultPricing, initialItems, initialStockInRecords, initialStockOutRecords, initialDeliveryOrders } from '../data';
import AddNewClientModal from './AddNewClientModal';
import { initializeDefaultRoles } from '../App';


interface SystemAdminDashboardProps {
    onImpersonate: (org: Organization) => void;
    onLogout: () => void;
}

const SystemAdminDashboard: React.FC<SystemAdminDashboardProps> = ({ onImpersonate, onLogout }) => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        const allOrgs = JSON.parse(localStorage.getItem('inventory-app-orgs') || '[]');
        const allUsers = JSON.parse(localStorage.getItem('inventory-app-users') || '[]');
        setOrganizations(allOrgs);
        setUsers(allUsers);
    }, []);

    const handleAddClient = async (orgName: string, adminEmail: string, adminPass: string) => {
        const allOrgs = JSON.parse(localStorage.getItem('inventory-app-orgs') || '[]');
        if (allOrgs.some((o: Organization) => o.name.toLowerCase() === orgName.trim().toLowerCase())) {
            throw new Error('An organization with this name already exists.');
        }

        const allUsers = JSON.parse(localStorage.getItem('inventory-app-users') || '[]');
        if (allUsers.some((u: User) => u.email === adminEmail)) {
            throw new Error('An account with this email already exists.');
        }

        const newOrg: Organization = { 
            id: `org-${Date.now()}`, 
            name: orgName.trim(),
            pricing: defaultPricing,
            dateJoined: new Date().toISOString().split('T')[0],
            billingAddress: '',
            contactPerson: '',
            contactEmail: '',
            contactPhone: '',
            companyRegNo: '',
        };

        const getStorageKey = (key: string) => `inventory-app-${newOrg.id}-${key}`;
        
        // FIX: Create default warehouses for the new org
        const newWarehouses: Warehouse[] = [
            { id: `wh-${newOrg.id}-sabah`, name: 'Sabah', address: 'Default Sabah Address' },
            { id: `wh-${newOrg.id}-sarawak`, name: 'Sarawak', address: 'Default Sarawak Address' },
        ];
        localStorage.setItem(getStorageKey('warehouses'), JSON.stringify(newWarehouses));
        
        // FIX: Pass warehouse IDs to initializeDefaultRoles
        const { roles: defaultRoles, adminRoleId } = initializeDefaultRoles(newOrg.id, newWarehouses.map(w => w.id));

        const newUser: User = { 
            id: `user-${Date.now()}`, 
            email: adminEmail, 
            password: adminPass, 
            organizationId: newOrg.id,
            roleId: adminRoleId,
            status: 'active',
        };

        const updatedOrgs = [...allOrgs, newOrg];
        const updatedUsers = [...allUsers, newUser];

        localStorage.setItem('inventory-app-orgs', JSON.stringify(updatedOrgs));
        localStorage.setItem('inventory-app-users', JSON.stringify(updatedUsers));

        localStorage.setItem(getStorageKey('items'), JSON.stringify(initialItems));
        localStorage.setItem(getStorageKey('stockIn'), JSON.stringify(initialStockInRecords));
        localStorage.setItem(getStorageKey('stockOut'), JSON.stringify(initialStockOutRecords));
        localStorage.setItem(getStorageKey('deliveryOrders'), JSON.stringify(initialDeliveryOrders));
        localStorage.setItem(getStorageKey('auditTrail'), JSON.stringify([]));
        localStorage.setItem(getStorageKey('consignees'), JSON.stringify([]));
        localStorage.setItem(getStorageKey('roles'), JSON.stringify(defaultRoles));

        setOrganizations(updatedOrgs);
        setUsers(updatedUsers);
    };

    const getAdminForOrg = (orgId: string) => {
        return users.find(u => u.organizationId === orgId);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">System Administration</h1>
                    <button onClick={onLogout} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700">
                        Logout
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-gray-700">Client Organizations</h2>
                        <button onClick={() => setIsAddModalOpen(true)} className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700">
                            Add New Client
                        </button>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Organization Name</th>
                                    <th className="px-6 py-3">Date Joined</th>
                                    <th className="px-6 py-3">Admin User</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organizations.map(org => (
                                    <tr key={org.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{org.name}</td>
                                        <td className="px-6 py-4">{org.dateJoined}</td>
                                        <td className="px-6 py-4">{getAdminForOrg(org.id)?.email || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => onImpersonate(org)}
                                                className="text-indigo-600 hover:text-indigo-900 font-medium"
                                            >
                                                View as Client
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {organizations.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-6 text-gray-500">No client organizations found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isAddModalOpen && (
                <AddNewClientModal 
                    onClose={() => setIsAddModalOpen(false)}
                    onAddClient={handleAddClient}
                />
            )}
        </div>
    );
};

export default SystemAdminDashboard;