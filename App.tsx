import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Item, StockInRecord, StockOutRecord, DeliveryOrder, Consignee, User, Organization, AuditTrailRecord, Pricing, Role, Permission, PermissionSet, Warehouse, AdHocCharge } from './types';
import { getInvitationEmailHtml } from './utils/emailTemplates';

// Component Imports
import ItemDetails from './components/ItemDetails';
import StockIn from './components/StockIn';
import StockOut from './components/StockOut';
import DOUpload from './components/DOUpload';
import Consignees from './components/Consignees';
import Warehouses from './components/Warehouses';
import Auth from './components/Auth';
import SystemAdminDashboard from './components/SystemAdminDashboard';
import ImpersonationBanner from './components/ImpersonationBanner';
import AuditTrail from './components/AuditTrail';
import ItemMovementReport from './components/ItemMovementReport';
import BillingReport from './components/BillingReport';
import AccountStatement from './components/AccountStatement';
import Settings from './components/Settings';
import ClientProfile from './components/ClientProfile';
import PriceSettings from './components/PriceSettings';
import AccountSetup from './components/AccountSetup';
import ResetPassword from './components/ResetPassword';


type Page = 'Dashboard' | 'Stock In' | 'Stock Out' | 'DO Upload' | 'Consignees' | 'Warehouses' | 'Item Movement Report' | 'Audit Trail' | 'Billing Report' | 'Account Statement' | 'Settings' | 'Client Profile' | 'Price Settings';

const NavIcon: React.FC<{ type: Page }> = ({ type }) => {
    const iconClass = "h-5 w-5 mr-3 text-gray-400 group-hover:text-white transition-colors";
    switch(type) {
        case 'Dashboard': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
        case 'Stock In': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" /></svg>;
        case 'Stock Out': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110-18 9 9 0 010 18z" /></svg>;
        case 'DO Upload': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
        case 'Consignees': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97m8.176 5.97h3v1a2 2 0 01-2 2h-1v-1a2 2 0 00-2-2h-1v1a2 2 0 002 2h1v-1z" /></svg>;
        case 'Warehouses': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
        case 'Item Movement Report': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
        case 'Billing Report':
        case 'Account Statement': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
        case 'Audit Trail': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
        case 'Client Profile': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
        case 'Price Settings': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>;
        case 'Settings': return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
        default: return null;
    }
};

export const initializeDefaultRoles = (orgId: string, warehouseIds: string[]): { roles: Role[], adminRoleId: string } => {
    const adminRoleId = `role-${orgId}-admin`;
    const warehouseRoleId = `role-${orgId}-warehouse`;
    const clientRoleId = `role-${orgId}-client`;

    const defaultRoles: Role[] = [
        {
            id: adminRoleId,
            name: 'Administrator',
            permissions: {
                canViewDashboard: true, canEditItems: true, canManageStockIn: true, canViewStockIn: true, canManageStockOut: true, canViewStockOut: true, canManageDO: true, canViewDO: true,
                canManageConsignees: true, canManageWarehouses: true, canViewMovementReport: true, canViewBilling: true, canViewAuditTrail: true,
                canManageUsers: true, canManageProfile: true, canManagePricing: true,
            },
            warehouseIds: warehouseIds, // Admin gets access to all initial warehouses
        },
        {
            id: warehouseRoleId,
            name: 'Warehouse Staff',
            permissions: {
                canViewDashboard: true, canEditItems: true, canManageStockIn: true, canViewStockIn: true, canManageStockOut: true, canViewStockOut: true, canManageDO: true, canViewDO: true,
                canManageConsignees: true, canManageWarehouses: false, canViewMovementReport: true, canViewBilling: false, canViewAuditTrail: false,
                canManageUsers: false, canManageProfile: false, canManagePricing: false,
            },
            warehouseIds: [], // Warehouse staff must be assigned warehouses explicitly
        },
        {
            id: clientRoleId,
            name: 'Client',
            permissions: {
                canViewDashboard: true, canEditItems: false, canManageStockIn: false, canViewStockIn: false, canManageStockOut: false, canViewStockOut: false, canManageDO: false, canViewDO: false,
                canManageConsignees: false, canManageWarehouses: false, canViewMovementReport: false, canViewBilling: true, canViewAuditTrail: false,
                canManageUsers: false, canManageProfile: false, canManagePricing: false,
            },
            warehouseIds: [], // Client role has no warehouse access by default
        }
    ];
    return { roles: defaultRoles, adminRoleId };
};


const OrgApp: React.FC<{
  user: User;
  organization: Organization;
  onLogout: () => void;
}> = ({ user, organization, onLogout }) => {
    const [currentUser, setCurrentUser] = useState<User>(user);
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');

    // Data state
    const [items, setItems] = useState<Item[]>([]);
    const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>([]);
    const [stockOutRecords, setStockOutRecords] = useState<StockOutRecord[]>([]);
    const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
    const [consignees, setConsignees] = useState<Consignee[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [auditTrail, setAuditTrail] = useState<AuditTrailRecord[]>([]);
    const [usersInOrg, setUsersInOrg] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [adHocCharges, setAdHocCharges] = useState<AdHocCharge[]>([]);
    const [defaultRoleId, setDefaultRoleId] = useState<string | null>(null);
    const [currentOrganization, setCurrentOrganization] = useState<Organization>(organization);
    
    const orgId = organization.id;
    const getStorageKey = useCallback((key: string) => `inventory-app-${orgId}-${key}`, [orgId]);

    useEffect(() => {
        const loadData = <T,>(key: string, initialData: T): T => {
            const storageKey = getStorageKey(key);
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                try { return JSON.parse(savedData); } catch (e) { console.error(`Failed to parse ${key}`, e); return initialData; }
            }
            return initialData;
        };
        
        setItems(loadData('items', []));
        setStockInRecords(loadData('stockIn', []));
        setStockOutRecords(loadData('stockOut', []));
        setDeliveryOrders(loadData('deliveryOrders', []));
        setConsignees(loadData('consignees', []));
        setAuditTrail(loadData('auditTrail', []));
        setAdHocCharges(loadData('adHocCharges', []));
        
        let loadedWarehouses = loadData('warehouses', []) as Warehouse[];
        if (loadedWarehouses.length === 0) {
            loadedWarehouses = [
                { id: `wh-${orgId}-sabah`, name: 'Sabah', address: 'Default Sabah Address' },
                { id: `wh-${orgId}-sarawak`, name: 'Sarawak', address: 'Default Sarawak Address' },
            ];
            localStorage.setItem(getStorageKey('warehouses'), JSON.stringify(loadedWarehouses));
        }
        setWarehouses(loadedWarehouses);

        const allUsers = JSON.parse(localStorage.getItem('inventory-app-users') || '[]') as User[];
        setUsersInOrg(allUsers.filter((u: User) => u.organizationId === orgId));
        
        let loadedRoles = loadData('roles', []) as Role[];
        if (loadedRoles.length === 0) {
            const { roles: defaultRoles, adminRoleId } = initializeDefaultRoles(orgId, loadedWarehouses.map(w => w.id));
            loadedRoles = defaultRoles;
            localStorage.setItem(getStorageKey('roles'), JSON.stringify(defaultRoles));

            const orgUsers = allUsers.filter(u => u.organizationId === orgId);
            const updatedUsers = allUsers.map(u => {
                if (orgUsers.some(ou => ou.id === u.id)) {
                    return { ...u, roleId: adminRoleId };
                }
                return u;
            });
            localStorage.setItem('inventory-app-users', JSON.stringify(updatedUsers));
            setUsersInOrg(updatedUsers.filter((u: User) => u.organizationId === orgId));
        }
        setRoles(loadedRoles);
        
        const loadedDefaultRoleId = loadData<string | null>('defaultRoleId', null);
        setDefaultRoleId(loadedDefaultRoleId);

        setCurrentOrganization(organization);
        setCurrentUser(user);
    }, [orgId, organization, user, getStorageKey]);

    const addAuditRecord = useCallback((action: string, details: string) => {
        const newRecord: AuditTrailRecord = {
            id: `audit-${Date.now()}`, timestamp: new Date().toISOString(), user: currentUser.email, action, details,
        };
        const updatedTrail = [newRecord, ...auditTrail];
        setAuditTrail(updatedTrail);
        localStorage.setItem(getStorageKey('auditTrail'), JSON.stringify(updatedTrail));
    }, [currentUser.email, auditTrail, getStorageKey]);

    const handleUpdateAndSave = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, data: T[], key: string, auditAction?: string, auditDetails?: string) => {
        setter(data);
        localStorage.setItem(getStorageKey(key), JSON.stringify(data));
        if(auditAction && auditDetails) addAuditRecord(auditAction, auditDetails);
    };
    
    // CRUD handlers...
    const handleAddItem = (item: Omit<Item, 'id' | 'balanceStock'>) => {
        const newItem: Item = { ...item, id: `item-${Date.now()}`, balanceStock: item.startingStock, creationDate: new Date().toISOString().split('T')[0] };
        handleUpdateAndSave(setItems, [...items, newItem], 'items', 'Create Item', `SKU: ${newItem.sku}`);
    };
    const handleUpdateItem = (updatedItem: Item) => {
        const newItems = items.map(item => item.id === updatedItem.id ? updatedItem : item);
        handleUpdateAndSave(setItems, newItems, 'items', 'Update Item', `SKU: ${updatedItem.sku}`);
    };
    const onDeleteItem = (itemToDelete: Item) => {
        if(window.confirm(`Are you sure you want to delete item ${itemToDelete.sku}?`)){
            handleUpdateAndSave(setItems, items.filter(i => i.id !== itemToDelete.id), 'items', 'Delete Item', `SKU: ${itemToDelete.sku}`);
        }
    };
    
    const handleAddStockIn = (record: Omit<StockInRecord, 'id'>) => {
        const newRecord: StockInRecord = { ...record, id: `in-${Date.now()}` };
        handleUpdateAndSave(setStockInRecords, [newRecord, ...stockInRecords], 'stockIn', 'Stock In', `SKU: ${record.sku}, Qty: ${record.arrivedQty}`);
    };
    const handleUpdateStockIn = (updatedRecord: StockInRecord) => {
        handleUpdateAndSave(setStockInRecords, stockInRecords.map(rec => rec.id === updatedRecord.id ? updatedRecord : rec), 'stockIn', 'Update Stock In', `SKU: ${updatedRecord.sku}`);
    };
    const onDeleteStockIn = (recordToDelete: StockInRecord) => {
        if(window.confirm(`Are you sure you want to delete this stock in record?`)){
            handleUpdateAndSave(setStockInRecords, stockInRecords.filter(r => r.id !== recordToDelete.id), 'stockIn', 'Delete Stock In', `SKU: ${recordToDelete.sku}`);
        }
    };

    const onAddStockOut = (record: Omit<StockOutRecord, 'id' | 'balanceStock' | 'totalWeightKg'>) => {
        const totalIn = stockInRecords.filter(r => r.sku === record.sku && r.warehouse === record.warehouse).reduce((sum, r) => sum + r.arrivedQty, 0);
        const totalOut = stockOutRecords.filter(r => r.sku === record.sku && r.warehouse === record.warehouse).reduce((sum, r) => sum + r.orderedQty, 0);
        const item = items.find(i => i.sku === record.sku && i.warehouse === record.warehouse);
        const balanceStock = (item?.startingStock || 0) + totalIn - totalOut;
        const totalWeightKg = (item?.weightKg || 0) * record.orderedQty;
        const newRecord: StockOutRecord = { ...record, id: `out-${Date.now()}`, balanceStock, totalWeightKg };
        handleUpdateAndSave(setStockOutRecords, [newRecord, ...stockOutRecords], 'stockOut', 'Stock Out', `SKU: ${record.sku}, Qty: ${record.orderedQty}`);
    };
    const onUpdateStockOut = (updatedRecord: StockOutRecord) => {
        handleUpdateAndSave(setStockOutRecords, stockOutRecords.map(rec => rec.id === updatedRecord.id ? updatedRecord : rec), 'stockOut', 'Update Stock Out', `SKU: ${updatedRecord.sku}`);
    };
    const onDeleteStockOut = (recordId: string) => {
        const record = stockOutRecords.find(r => r.id === recordId);
        if(record && window.confirm(`Are you sure you want to delete the stock-out record?`)){
            handleUpdateAndSave(setStockOutRecords, stockOutRecords.filter(r => r.id !== recordId), 'stockOut', 'Delete Stock Out', `SKU: ${record.sku}`);
        }
    };

    const onAddDeliveryOrder = (order: Omit<DeliveryOrder, 'id'>) => {
        const newOrder: DeliveryOrder = { ...order, id: `do-${Date.now()}` };
        handleUpdateAndSave(setDeliveryOrders, [newOrder, ...deliveryOrders], 'deliveryOrders', 'Upload DO', `DO: ${order.doNo}`);
    };
    const onUpdateDeliveryOrder = (updatedOrder: DeliveryOrder) => {
        handleUpdateAndSave(setDeliveryOrders, deliveryOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o), 'deliveryOrders', 'Update DO', `DO: ${updatedOrder.doNo}`);
    };

    const onAddConsignee = (consignee: Omit<Consignee, 'id'>) => {
        const newConsignee: Consignee = { ...consignee, id: `consignee-${Date.now()}`};
        handleUpdateAndSave(setConsignees, [newConsignee, ...consignees], 'consignees', 'Add Consignee', `Name: ${consignee.name}`);
    };
    const onUpdateConsignee = (updatedConsignee: Consignee) => {
        handleUpdateAndSave(setConsignees, consignees.map(c => c.id === updatedConsignee.id ? updatedConsignee : c), 'consignees', 'Update Consignee', `Name: ${updatedConsignee.name}`);
    };
    const onDeleteConsignee = (consigneeId: string) => {
        const consignee = consignees.find(c => c.id === consigneeId);
        if(consignee && window.confirm(`Are you sure you want to delete consignee ${consignee.name}?`)){
            handleUpdateAndSave(setConsignees, consignees.filter(c => c.id !== consigneeId), 'consignees', 'Delete Consignee', `Name: ${consignee.name}`);
        }
    };
    
    // Warehouse Management
    const onAddWarehouse = (warehouse: Omit<Warehouse, 'id'>) => {
        const newWarehouse: Warehouse = { ...warehouse, id: `wh-${Date.now()}`};
        handleUpdateAndSave(setWarehouses, [...warehouses, newWarehouse], 'warehouses', 'Add Warehouse', `Name: ${warehouse.name}`);
    };
    const onUpdateWarehouse = (updatedWarehouse: Warehouse) => {
        handleUpdateAndSave(setWarehouses, warehouses.map(w => w.id === updatedWarehouse.id ? updatedWarehouse : w), 'warehouses', 'Update Warehouse', `Name: ${updatedWarehouse.name}`);
    };
    const onDeleteWarehouse = (warehouseId: string) => {
        const warehouse = warehouses.find(w => w.id === warehouseId);
        if(warehouse && window.confirm(`Are you sure you want to delete warehouse ${warehouse.name}?`)){
             const isUsed = items.some(i => i.warehouse === warehouse.name) ||
                           stockInRecords.some(i => i.warehouse === warehouse.name) ||
                           stockOutRecords.some(i => i.warehouse === warehouse.name);
            if (isUsed) {
                alert(`Cannot delete "${warehouse.name}" as it is currently in use by items or stock records.`);
                return;
            }
            // Also remove this warehouse from any roles that have it assigned
            const updatedRoles = roles.map(role => ({
                ...role,
                warehouseIds: role.warehouseIds.filter(id => id !== warehouseId)
            }));
            handleUpdateAndSave(setRoles, updatedRoles, 'roles'); // Save updated roles
            handleUpdateAndSave(setWarehouses, warehouses.filter(w => w.id !== warehouseId), 'warehouses', 'Delete Warehouse', `Name: ${warehouse.name}`);
        }
    };

    // User and Role Management
    const onInviteUser = (email: string, roleId: string) => {
        const allUsers = JSON.parse(localStorage.getItem('inventory-app-users') || '[]');
        if (allUsers.some((u:User) => u.email.toLowerCase() === email.toLowerCase())) {
            alert("A user with this email already exists.");
            return;
        }

        const invitationToken = `token-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        const newUser: User = {
            id: `user-${Date.now()}`,
            email,
            roleId,
            organizationId: orgId,
            status: 'pending',
            invitationToken,
        };

        const updatedUsers = [...allUsers, newUser];
        localStorage.setItem('inventory-app-users', JSON.stringify(updatedUsers));
        setUsersInOrg(updatedUsers.filter((u: User) => u.organizationId === orgId));
        addAuditRecord('Invite User', `Invited ${email}`);
        
        const invitationLink = `${window.location.origin}?token=${invitationToken}`;
        console.group("--- DEMO: INVITATION EMAIL ---");
        console.log(`An invitation has been sent to ${email}.`);
        console.log(`For this demo, click the link below to set up the account:`);
        console.log(invitationLink);
        console.log("Email content for reference:");
        console.log(getInvitationEmailHtml(invitationLink, organization.name));
        console.groupEnd();
        
        alert(`${email} has been invited. For this demo, the invitation link has been logged to the developer console.`);
    };

    const onDeleteUser = (userId: string) => {
        const allUsers = JSON.parse(localStorage.getItem('inventory-app-users') || '[]');
        const userToDelete = allUsers.find((u:User) => u.id === userId);
        if (!userToDelete) return;
        
        if (window.confirm(`Are you sure you want to revoke the invitation for ${userToDelete.email}?`)) {
            const updatedUsers = allUsers.filter((u: User) => u.id !== userId);
            localStorage.setItem('inventory-app-users', JSON.stringify(updatedUsers));
            setUsersInOrg(updatedUsers.filter((u: User) => u.organizationId === orgId));
            addAuditRecord('Revoke Invitation', `Revoked for ${userToDelete.email}`);
        }
    };

    const onUpdateUserRole = (userId: string, roleId: string) => {
        const allUsers = JSON.parse(localStorage.getItem('inventory-app-users') || '[]');
        const updatedUsers = allUsers.map((u: User) => u.id === userId ? {...u, roleId} : u);
        localStorage.setItem('inventory-app-users', JSON.stringify(updatedUsers));
        setUsersInOrg(updatedUsers.filter((u: User) => u.organizationId === orgId));
        addAuditRecord('Update User Role', `User ID: ${userId}, New Role ID: ${roleId}`);
    };

    const onAddRole = (role: Role) => handleUpdateAndSave(setRoles, [...roles, role], 'roles', 'Create Role', `Name: ${role.name}`);
    const onUpdateRole = (updatedRole: Role) => handleUpdateAndSave(setRoles, roles.map(r => r.id === updatedRole.id ? updatedRole : r), 'roles', 'Update Role', `Name: ${updatedRole.name}`);
    const onDeleteRole = (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if(role && window.confirm(`Are you sure you want to delete role "${role.name}"?`)){
            handleUpdateAndSave(setRoles, roles.filter(r => r.id !== roleId), 'roles', 'Delete Role', `Name: ${role.name}`);
        }
    };
    
    const onSetDefaultRole = (roleId: string) => {
        const newDefaultRoleId = defaultRoleId === roleId ? null : roleId;
        setDefaultRoleId(newDefaultRoleId);
        localStorage.setItem(getStorageKey('defaultRoleId'), JSON.stringify(newDefaultRoleId));
        addAuditRecord('Set Default Role Template', `Role '${roles.find(r => r.id === newDefaultRoleId)?.name || 'None'}' set as default for invitations.`);
    };

    // Org Profile and Pricing
    const onUpdateOrgDetails = (details: Partial<Organization>) => {
        const updatedOrg = { ...currentOrganization, ...details };
        setCurrentOrganization(updatedOrg);
        const allOrgs = JSON.parse(localStorage.getItem('inventory-app-orgs') || '[]').map((o: Organization) => o.id === orgId ? updatedOrg : o);
        localStorage.setItem('inventory-app-orgs', JSON.stringify(allOrgs));
        addAuditRecord('Update Client Profile', `Updated company details for ${updatedOrg.name}`);
    };
    
    const onUpdatePricing = (pricing: Pricing) => {
        const updatedOrg = { ...currentOrganization, pricing };
        setCurrentOrganization(updatedOrg);
        const allOrgs = JSON.parse(localStorage.getItem('inventory-app-orgs') || '[]').map((o: Organization) => o.id === orgId ? updatedOrg : o);
        localStorage.setItem('inventory-app-orgs', JSON.stringify(allOrgs));
        addAuditRecord('Update Pricing', `Updated pricing settings for ${updatedOrg.name}`);
    };

    const onAddAdHocCharge = (charge: Omit<AdHocCharge, 'id'>) => {
        const newCharge: AdHocCharge = { ...charge, id: `adhoc-${Date.now()}` };
        handleUpdateAndSave(setAdHocCharges, [...adHocCharges, newCharge], 'adHocCharges', 'Add Ad-hoc Charge', `${charge.type}: ${charge.description} - $${charge.amount}`);
    };

    const { userPermissions, userAccessibleWarehouses } = useMemo(() => {
        if (currentUser.role === 'System Super Admin') {
            const permissions = {
                canViewDashboard: true, canEditItems: true, canManageStockIn: true, canViewStockIn: true, canManageStockOut: true, canViewStockOut: true, canManageDO: true, canViewDO: true,
                canManageConsignees: true, canManageWarehouses: true, canViewMovementReport: true, canViewBilling: true, canViewAuditTrail: true,
                canManageUsers: true, canManageProfile: true, canManagePricing: true,
            };
            return { userPermissions: permissions, userAccessibleWarehouses: warehouses };
        }
        
        const role = roles.find(r => r.id === currentUser.roleId);
        const permissions = role?.permissions || {
            canViewDashboard: false, canEditItems: false, canManageStockIn: false, canViewStockIn: false, canManageStockOut: false, canViewStockOut: false, canManageDO: false, canViewDO: false,
            canManageConsignees: false, canManageWarehouses: false, canViewMovementReport: false, canViewBilling: false, canViewAuditTrail: false,
            canManageUsers: false, canManageProfile: false, canManagePricing: false,
        };
        
        const accessibleWarehouses = role?.warehouseIds ? warehouses.filter(w => role.warehouseIds.includes(w.id)) : [];
        
        return { userPermissions: permissions, userAccessibleWarehouses: accessibleWarehouses };
    }, [currentUser, roles, warehouses]);

    // Filter data based on user's accessible warehouses
    const { itemsForUser, stockInForUser, stockOutForUser } = useMemo(() => {
        const role = roles.find(r => r.id === currentUser.roleId);
        if (currentUser.role === 'System Super Admin' || (role && role.permissions.canManageWarehouses)) {
            // Admins with "Manage Warehouses" perm can see all data
            return { itemsForUser: items, stockInForUser: stockInRecords, stockOutForUser: stockOutRecords };
        }
        const accessibleWarehouseNames = userAccessibleWarehouses.map(w => w.name);
        return {
            itemsForUser: items.filter(i => accessibleWarehouseNames.includes(i.warehouse)),
            stockInForUser: stockInRecords.filter(r => accessibleWarehouseNames.includes(r.warehouse)),
            stockOutForUser: stockOutRecords.filter(r => accessibleWarehouseNames.includes(r.warehouse)),
        };
    }, [currentUser.roleId, roles, items, stockInRecords, stockOutRecords, userAccessibleWarehouses]);

    const canAccess = (permission: Permission) => userPermissions[permission];

    const navGroups = useMemo(() => ([
        {
            title: 'Inventory',
            links: [
                { name: 'Dashboard', page: 'Dashboard', permission: 'canViewDashboard' },
                { name: 'Stock In', page: 'Stock In', permission: 'canManageStockIn' },
                { name: 'Stock Out', page: 'Stock Out', permission: 'canManageStockOut' },
            ]
        },
        {
            title: 'Logistics',
            links: [
                { name: 'DO Upload', page: 'DO Upload', permission: 'canManageDO' },
                { name: 'Consignees', page: 'Consignees', permission: 'canManageConsignees' },
            ]
        },
        {
            title: 'Reports',
            links: [
                { name: 'Movement Report', page: 'Item Movement Report', permission: 'canViewMovementReport' },
                { name: 'Billing Report', page: 'Billing Report', permission: 'canViewBilling' },
                { name: 'Account Statement', page: 'Account Statement', permission: 'canViewBilling' },
                { name: 'Audit Trail', page: 'Audit Trail', permission: 'canViewAuditTrail' },
            ]
        },
        {
            title: 'Administration',
            links: [
                { name: 'Client Profile', page: 'Client Profile', permission: 'canManageProfile' },
                { name: 'Price Settings', page: 'Price Settings', permission: 'canManagePricing' },
                { name: 'Warehouses', page: 'Warehouses', permission: 'canManageWarehouses' },
                { name: 'Roles & Permissions', page: 'Settings', permission: 'canManageUsers' },
            ]
        }
    ] as const), []);

    const renderPage = () => {
        switch (currentPage) {
            case 'Dashboard': return <ItemDetails organization={currentOrganization} items={itemsForUser} warehouses={userAccessibleWarehouses} stockInRecords={stockInForUser} stockOutRecords={stockOutForUser} onAddItem={handleAddItem} onUpdateItem={handleUpdateItem} onDeleteItem={onDeleteItem} permissions={userPermissions} />;
            case 'Stock In': return <StockIn items={itemsForUser} warehouses={userAccessibleWarehouses} stockInRecords={stockInForUser} onAddStockIn={handleAddStockIn} onUpdateStockIn={handleUpdateStockIn} onDeleteStockIn={onDeleteStockIn} permissions={userPermissions} />;
            case 'Stock Out': return <StockOut items={itemsForUser} warehouses={userAccessibleWarehouses} stockInRecords={stockInForUser} stockOutRecords={stockOutForUser} consignees={consignees} onAddStockOut={onAddStockOut} onUpdateStockOut={onUpdateStockOut} onDeleteStockOut={onDeleteStockOut} permissions={userPermissions} />;
            case 'DO Upload': return <DOUpload deliveryOrders={deliveryOrders} onAddDeliveryOrder={onAddDeliveryOrder} onUpdateDeliveryOrder={onUpdateDeliveryOrder} permissions={userPermissions} />;
            case 'Consignees': return <Consignees consignees={consignees} onAddConsignee={onAddConsignee} onUpdateConsignee={onUpdateConsignee} onDeleteConsignee={onDeleteConsignee} permissions={userPermissions} />;
            case 'Warehouses': return <Warehouses warehouses={warehouses} items={items} stockInRecords={stockInRecords} stockOutRecords={stockOutRecords} onAddWarehouse={onAddWarehouse} onUpdateWarehouse={onUpdateWarehouse} onDeleteWarehouse={onDeleteWarehouse} permissions={userPermissions} />;
            case 'Item Movement Report': return <ItemMovementReport items={itemsForUser} stockInRecords={stockInForUser} stockOutRecords={stockOutForUser} warehouses={userAccessibleWarehouses} />;
            case 'Audit Trail': return <AuditTrail auditTrail={auditTrail} />;
            case 'Billing Report': return <BillingReport items={itemsForUser} stockInRecords={stockInForUser} stockOutRecords={stockOutForUser} adHocCharges={adHocCharges} organization={currentOrganization} />;
            case 'Account Statement': return <AccountStatement items={itemsForUser} stockInRecords={stockInForUser} stockOutRecords={stockOutForUser} organization={currentOrganization} />;
            case 'Settings': return <Settings users={usersInOrg} roles={roles} warehouses={warehouses} currentUser={currentUser} onInviteUser={onInviteUser} onDeleteUser={onDeleteUser} onUpdateUserRole={onUpdateUserRole} onAddRole={onAddRole} onUpdateRole={onUpdateRole} onDeleteRole={onDeleteRole} defaultRoleId={defaultRoleId} onSetDefaultRole={onSetDefaultRole} />;
            case 'Client Profile': return <ClientProfile organization={currentOrganization} onUpdateDetails={onUpdateOrgDetails} />;
            case 'Price Settings': return <PriceSettings organization={currentOrganization} onUpdatePricing={onUpdatePricing} onAddAdHocCharge={onAddAdHocCharge} />;
            default: return <div>Page not found</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="px-6 py-6 border-b border-gray-700">
                    <h1 className="text-xl font-bold text-white">{currentOrganization.name}</h1>
                    <p className="text-sm text-gray-400">ARRIIVAL Inventory System</p>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-4">
                    {navGroups.map(group => {
                        const accessibleLinks = group.links.filter(link => {
                            const perm = link.permission as Permission;
                            if (perm === 'canManageStockIn') return canAccess('canManageStockIn') || canAccess('canViewStockIn');
                            if (perm === 'canManageStockOut') return canAccess('canManageStockOut') || canAccess('canViewStockOut');
                            if (perm === 'canManageDO') return canAccess('canManageDO') || canAccess('canViewDO');
                            return canAccess(perm);
                        });
                        
                        if (accessibleLinks.length === 0) return null;
                        
                        return (
                            <div key={group.title}>
                                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{group.title}</h3>
                                <div className="mt-2 space-y-1">
                                    {accessibleLinks.map(link => (
                                        <button 
                                            key={link.page} 
                                            onClick={() => setCurrentPage(link.page)} 
                                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-left group transition-colors ${
                                                currentPage === link.page 
                                                ? 'bg-purple-600 text-white' 
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        >
                                            <NavIcon type={link.page} />
                                            <span>{link.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">{currentPage}</h2>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm">
                            <span className="text-gray-600 mr-2">Logged in as:</span>
                            <span className="font-semibold text-gray-800">{currentUser.email} ({roles.find(r => r.id === currentUser.roleId)?.name || currentUser.role})</span>
                        </div>
                        <button onClick={onLogout} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 text-sm">Logout</button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [session, setSession] = useState<{ user: User; org: Organization | null } | null>(null);
    const [impersonatedOrg, setImpersonatedOrg] = useState<Organization | null>(null);

    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
    const invitationToken = urlParams.get('token');
    const resetToken = urlParams.get('reset-token');
  
    const handleAuthSuccess = (newSession: { user: User; org: Organization | null }) => {
      window.history.replaceState({}, document.title, window.location.pathname);
      setSession(newSession);
    };
    
    const handleLogout = () => {
      setSession(null);
      setImpersonatedOrg(null);
    };
    
    const handleReturnToAdmin = () => {
      setImpersonatedOrg(null);
    };
    
    if (invitationToken) {
        return <AccountSetup token={invitationToken} onSetupSuccess={handleAuthSuccess} />;
    }

    if (resetToken) {
        return <ResetPassword token={resetToken} onResetSuccess={handleAuthSuccess} />;
    }

    if (!session) {
      return <Auth onAuthSuccess={handleAuthSuccess} />;
    }
  
    if (session.user.role === 'System Super Admin') {
      if (impersonatedOrg) {
        return (
          <>
            <ImpersonationBanner clientName={impersonatedOrg.name} onReturn={handleReturnToAdmin} />
            <OrgApp user={session.user} organization={impersonatedOrg} onLogout={handleLogout} />
          </>
        );
      }
      return <SystemAdminDashboard onImpersonate={setImpersonatedOrg} onLogout={handleLogout} />;
    }
  
    if (session.org) {
      return <OrgApp user={session.user} organization={session.org} onLogout={handleLogout} />;
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-red-600 bg-red-100 p-4 rounded-md">Error: Organization data not found for your account.</p>
        <button onClick={handleLogout} className="mt-4 py-2 px-4 bg-gray-600 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700">
          Logout
        </button>
      </div>
    );
};

export default App;