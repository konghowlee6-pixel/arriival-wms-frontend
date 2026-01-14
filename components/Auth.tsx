import React, { useState, useEffect } from 'react';
import type { User, Organization, Warehouse } from '../types';
import { initialItems, initialStockInRecords, initialStockOutRecords, initialDeliveryOrders, defaultPricing } from '../data';
import { initializeDefaultRoles } from '../App';
import { getPasswordResetEmailHtml } from '../utils/emailTemplates';


interface AuthProps {
  onAuthSuccess: (session: { user: User; org: Organization | null }) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');


  const getUsers = (): User[] => JSON.parse(localStorage.getItem('inventory-app-users') || '[]');
  const getOrgs = (): Organization[] => JSON.parse(localStorage.getItem('inventory-app-orgs') || '[]');

  // One-time setup for the System Super Admin to ensure it's always available and correct.
  useEffect(() => {
    const users = getUsers();
    const adminEmail = 'admin@arriival.com';
    const adminIndex = users.findIndex(u => u.email.toLowerCase() === adminEmail.toLowerCase());
    
    const correctAdminUser: User = {
        id: 'user-system-admin',
        email: adminEmail,
        password: 'admin123',
        organizationId: null,
        roleId: 'system-super-admin-role',
        role: 'System Super Admin',
        status: 'active'
    };
    
    let updatedUsers;

    if (adminIndex > -1) {
      const existingAdmin = users[adminIndex];
      // Preserve existing ID if different from default
      correctAdminUser.id = existingAdmin.id;
      // Deep compare to see if an update is needed
      if (JSON.stringify(existingAdmin) !== JSON.stringify(correctAdminUser)) {
        updatedUsers = [...users];
        updatedUsers[adminIndex] = correctAdminUser;
      }
    } else {
      // Admin doesn't exist, add it
      updatedUsers = [...users, correctAdminUser];
    }
    
    if (updatedUsers) {
        localStorage.setItem('inventory-app-users', JSON.stringify(updatedUsers));
        console.log("System Super Admin account has been set up/reset. Email: admin@arriival.com, Pass: admin123");
    }
  }, []);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      setError('Invalid email or password.');
      return;
    }
    
    if (user.status === 'pending') {
      setError('This account has not been activated. Please use the invitation link sent to your email.');
      return;
    }

    if (user.role === 'System Super Admin') {
        onAuthSuccess({ user, org: null });
        return;
    }

    const orgs = getOrgs();
    const org = orgs.find(o => o.id === user.organizationId);
    if (!org) {
      setError('Could not find the organization associated with this user. Please contact support.');
      return;
    }
    onAuthSuccess({ user, org });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@') || password.length < 6 || !orgName.trim()) {
      setError('Please provide a valid email, a password of at least 6 characters, and an organization name.');
      return;
    }

    const users = getUsers();
    const orgs = getOrgs();

    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const existingOrg = orgs.find(o => o.name.toLowerCase() === orgName.trim().toLowerCase());

    if (existingOrg) {
      setError(`An organization named "${orgName}" already exists. If you have been invited, please use the invitation link sent to your email to set up your account.`);
      return;
    }

    if (existingUser) {
        setError('An account with this email already exists. Please sign in or use the "Forgot Password" link.');
        return;
    }
    
    // New Organization Signup
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
    
    const newWarehouses: Warehouse[] = [
        { id: `wh-${newOrg.id}-sabah`, name: 'Sabah', address: 'Default Sabah Address' },
        { id: `wh-${newOrg.id}-sarawak`, name: 'Sarawak', address: 'Default Sarawak Address' },
    ];
    localStorage.setItem(getStorageKey('warehouses'), JSON.stringify(newWarehouses));
    
    const { roles: defaultRoles, adminRoleId } = initializeDefaultRoles(newOrg.id, newWarehouses.map(w => w.id));

    const newUser: User = { 
        id: `user-${Date.now()}`, 
        email, 
        password, 
        organizationId: newOrg.id,
        roleId: adminRoleId,
        status: 'active',
    };

    localStorage.setItem('inventory-app-users', JSON.stringify([...users, newUser]));
    localStorage.setItem('inventory-app-orgs', JSON.stringify([...orgs, newOrg]));

    localStorage.setItem(getStorageKey('items'), JSON.stringify(initialItems));
    localStorage.setItem(getStorageKey('stockIn'), JSON.stringify(initialStockInRecords));
    localStorage.setItem(getStorageKey('stockOut'), JSON.stringify(initialStockOutRecords));
    localStorage.setItem(getStorageKey('deliveryOrders'), JSON.stringify(initialDeliveryOrders));
    localStorage.setItem(getStorageKey('auditTrail'), JSON.stringify([]));
    localStorage.setItem(getStorageKey('consignees'), JSON.stringify([]));
    localStorage.setItem(getStorageKey('roles'), JSON.stringify(defaultRoles));

    onAuthSuccess({ user: newUser, org: newOrg });
  };


  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = getUsers();
    const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === forgotEmail.toLowerCase());

    if (userIndex !== -1) {
        const token = `reset-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const expires = Date.now() + 3600000; // 1 hour from now

        allUsers[userIndex].passwordResetToken = token;
        allUsers[userIndex].passwordResetExpires = expires;

        localStorage.setItem('inventory-app-users', JSON.stringify(allUsers));

        const resetLink = `${window.location.origin}?reset-token=${token}`;
        
        console.group("--- DEMO: PASSWORD RESET ---");
        console.log(`A password reset link has been generated for ${forgotEmail}.`);
        console.log(`For this demo, click the link below to reset the password:`);
        console.log(resetLink);
        console.log("Email content for reference:");
        console.log(getPasswordResetEmailHtml(resetLink));
        console.groupEnd();
    }
    setForgotMessage('If an account with this email exists, a password reset link has been logged to the developer console.');
  };

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    setForgotEmail('');
    setForgotMessage('');
  }
  
  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <>
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
            <div className="mx-auto h-12 w-12">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#8B5CF6"/>
                    <path d="M12 18V6M12 6L8 10M12 6L16 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-800">ARRIIVAL</h1>
            <h2 className="text-lg font-medium text-purple-600">Inventory System</h2>
            <p className="text-gray-500 mt-2">{isLoginView ? "Welcome back! Please sign in." : "Create a new organization account."}</p>
        </div>
        
        <form onSubmit={isLoginView ? handleLogin : handleSignUp} className="space-y-4">
          {!isLoginView && (
            <div>
              <label htmlFor="orgName" className={labelClass}>Organization Name</label>
              <input id="orgName" name="orgName" type="text" required value={orgName} onChange={e => setOrgName(e.target.value)} className={inputClass} />
            </div>
          )}
          <div>
            <label htmlFor="email" className={labelClass}>Email Address</label>
            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <input 
                id="password" 
                name="password" 
                type={isPasswordVisible ? 'text' : 'password'} 
                autoComplete="current-password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className={`${inputClass} pr-10`} 
              />
              <button 
                type="button" 
                onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              >
                {isPasswordVisible ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>
          
          {isLoginView && (
             <div className="flex items-center justify-end">
                <div className="text-sm">
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotModalOpen(true); }} className="font-medium text-purple-600 hover:text-purple-500">
                        Forgot your password?
                    </a>
                </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

          <div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              {isLoginView ? 'Sign In' : 'Create Organization'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="text-sm font-medium text-purple-600 hover:text-purple-500">
            {isLoginView ? 'Need to create an organization? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
    
    {isForgotModalOpen && (
       <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-semibold text-gray-800">Reset Password</h3>
            <button onClick={closeForgotModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <form onSubmit={handleForgotPassword}>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Enter your email address. For this demo, a password reset link will be logged to the developer console.</p>
              <div>
                <label htmlFor="email-forgot" className={labelClass}>Email Address</label>
                <input type="email" id="email-forgot" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className={inputClass} required />
              </div>
              {forgotMessage && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{forgotMessage}</p>}
            </div>
            <div className="p-4 border-t flex justify-end bg-gray-50 gap-3">
              <button type="button" onClick={closeForgotModal} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
              <button type="submit" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">Send Reset Link</button>
            </div>
          </form>
        </div>
      </div>
    )}

    </>
  );
};

export default Auth;