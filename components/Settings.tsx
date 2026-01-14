import React, { useState } from 'react';
import type { User, Role, Permission, PermissionSet, Warehouse } from '../types';

const permissionLabels: Record<Permission, string> = {
    canViewDashboard: "View Dashboard & Items",
    canEditItems: "Add/Edit/Delete Items",
    canManageStockIn: "Manage Stock In",
    canViewStockIn: "View Stock In List",
    canManageStockOut: "Manage Stock Out",
    canViewStockOut: "View Stock Out List",
    canManageDO: "Manage DO Uploads",
    canViewDO: "View Uploaded Documents List",
    canManageConsignees: "Manage Consignees",
    canManageWarehouses: "Manage Warehouses",
    canViewMovementReport: "View Movement Report",
    canViewBilling: "View Billing & Account Statement",
    canViewAuditTrail: "View Audit Trail",
    canManageUsers: "Manage Users & Roles",
    canManageProfile: "Manage Client Profile",
    canManagePricing: "Manage Price Settings"
};

interface InviteUserModalProps {
    roles: Role[];
    defaultRoleId: string | null;
    onClose: () => void;
    onInvite: (email: string, roleId: string) => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ roles, defaultRoleId, onClose, onInvite }) => {
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState(defaultRoleId || (roles[0]?.id || ''));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !roleId) {
            alert("Email and role are required.");
            return;
        }
        onInvite(email, roleId);
        onClose();
    };
    
    const labelClass = "block text-sm font-medium text-gray-700";
    const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">Invite New User</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="email-invite" className={labelClass}>Email Address</label>
                            <input type="email" id="email-invite" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="role-invite" className={labelClass}>Role</label>
                            <select id="role-invite" value={roleId} onChange={e => setRoleId(e.target.value)} className={inputClass}>
                                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="p-4 border-t flex justify-end bg-gray-50 gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">Send Invitation</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface RoleEditModalProps {
    role: Role | null;
    warehouses: Warehouse[];
    onClose: () => void;
    onSave: (role: Role) => void;
}

const RoleEditModal: React.FC<RoleEditModalProps> = ({ role, warehouses, onClose, onSave }) => {
    const [name, setName] = useState(role?.name || '');
    const [permissions, setPermissions] = useState<PermissionSet>(role?.permissions || {
        canViewDashboard: true, canEditItems: false, canManageStockIn: false, canViewStockIn: false, canManageStockOut: false, canViewStockOut: false, canManageDO: false, canViewDO: false,
        canManageConsignees: false, canManageWarehouses: false, canViewMovementReport: false, canViewBilling: false, canViewAuditTrail: false,
        canManageUsers: false, canManageProfile: false, canManagePricing: false,
    });
    const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>(role?.warehouseIds || []);

    const handlePermissionChange = (permission: Permission, value: boolean) => {
        setPermissions(prev => ({ ...prev, [permission]: value }));
    };

    const handleWarehouseSelectionChange = (warehouseId: string, isSelected: boolean) => {
        setSelectedWarehouseIds(prev =>
            isSelected ? [...prev, warehouseId] : prev.filter(id => id !== warehouseId)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Role name is required.");
            return;
        }
        onSave({
            id: role?.id || `role-${Date.now()}`,
            name,
            permissions,
            warehouseIds: selectedWarehouseIds,
        });
    };

    const labelClass = "block text-sm font-medium text-gray-700";
    const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{role ? 'Edit Role' : 'Create New Role'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto">
                    <div className="p-6 space-y-6">
                        <div>
                            <label className={labelClass}>Role Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Assigned Warehouses</label>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border p-4 rounded-md max-h-48 overflow-y-auto">
                                {warehouses.map(warehouse => (
                                    <label key={warehouse.id} className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedWarehouseIds.includes(warehouse.id)}
                                            onChange={e => handleWarehouseSelectionChange(warehouse.id, e.target.checked)}
                                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-600">{warehouse.name}</span>
                                    </label>
                                ))}
                                {warehouses.length === 0 && <p className="text-sm text-gray-500">No warehouses configured.</p>}
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Permissions</label>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 rounded-md">
                                {Object.keys(permissionLabels).map(key => (
                                    <label key={key} className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={permissions[key as Permission]}
                                            onChange={e => handlePermissionChange(key as Permission, e.target.checked)}
                                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-600">{permissionLabels[key as Permission]}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t flex justify-end bg-gray-50 gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save Role</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface SettingsProps {
    users: User[];
    roles: Role[];
    warehouses: Warehouse[];
    currentUser: User;
    onInviteUser: (email: string, roleId: string) => void;
    onDeleteUser: (userId: string) => void;
    onUpdateUserRole: (userId: string, roleId: string) => void;
    onAddRole: (role: Role) => void;
    onUpdateRole: (role: Role) => void;
    onDeleteRole: (roleId: string) => void;
    defaultRoleId: string | null;
    onSetDefaultRole: (roleId: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ users, roles, warehouses, currentUser, onInviteUser, onDeleteUser, onUpdateUserRole, onAddRole, onUpdateRole, onDeleteRole, defaultRoleId, onSetDefaultRole }) => {
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [isInvitingUser, setIsInvitingUser] = useState(false);
    
    const isRoleInUse = (roleId: string) => users.some(u => u.roleId === roleId);
    
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">Roles & Permissions</h2>
            
            {/* User Management */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Manage Users</h3>
                    <button onClick={() => setIsInvitingUser(true)} className="py-2 px-4 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700">Invite User</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">User Email</th>
                                <th className="px-6 py-3">Role / Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {user.status === 'pending' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Pending Invitation
                                            </span>
                                        ) : (
                                            <select 
                                                value={user.roleId} 
                                                onChange={(e) => onUpdateUserRole(user.id, e.target.value)}
                                                className="block w-full max-w-xs px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                                                disabled={user.id === currentUser.id}
                                                title={user.id === currentUser.id ? "Admins cannot change their own role." : "Select a role"}
                                            >
                                                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-4">
                                        {user.status === 'pending' ? (
                                            <button onClick={() => onDeleteUser(user.id)} className="text-red-600 hover:text-red-900 font-medium">Revoke</button>
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Management */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Manage Roles</h3>
                    <button onClick={() => setIsCreatingRole(true)} className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700">Add New Role</button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Role Name</th>
                                <th className="px-6 py-3">Assigned Warehouses</th>
                                <th className="px-6 py-3 text-center" title="Default role for new user invitations">Default Template</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{role.name}</td>
                                    <td className="px-6 py-4">
                                        {role.warehouseIds?.map(whId => warehouses.find(w => w.id === whId)?.name).filter(Boolean).join(', ') || 'None'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => onSetDefaultRole(role.id)}
                                            className={`p-1.5 rounded-full transition-colors duration-200 ease-in-out ${defaultRoleId === role.id ? 'text-yellow-500 bg-yellow-100' : 'text-gray-400 hover:bg-gray-200'}`}
                                            title={defaultRoleId === role.id ? "This is the default role for new invitations. Click to unset." : "Set as default role for new invitations."}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-4">
                                        <button onClick={() => setEditingRole(role)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                                        <button 
                                            onClick={() => onDeleteRole(role.id)} 
                                            disabled={isRoleInUse(role.id)}
                                            className="text-red-600 hover:text-red-900 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                                            title={isRoleInUse(role.id) ? "Cannot delete role while it is assigned to users." : ""}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isInvitingUser && (
                <InviteUserModal 
                    roles={roles}
                    defaultRoleId={defaultRoleId}
                    onClose={() => setIsInvitingUser(false)}
                    onInvite={onInviteUser}
                />
            )}

            {(editingRole || isCreatingRole) && (
                <RoleEditModal 
                    role={editingRole}
                    warehouses={warehouses}
                    onClose={() => { setEditingRole(null); setIsCreatingRole(false); }}
                    onSave={(role) => {
                        if (editingRole) {
                            onUpdateRole(role);
                        } else {
                            onAddRole(role);
                        }
                        setEditingRole(null);
                        setIsCreatingRole(false);
                    }}
                />
            )}
        </div>
    );
};

export default Settings;