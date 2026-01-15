import React, { useState } from 'react';
import type { User, Organization } from '../types';

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
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wms.arrival.com';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("LOGIN_CLICKED");
    setError('');
    setIsLoading(true);

    const payload = {
      email: email.trim(),
      password: password
    };

    console.log("CALLING_API", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("API_RESPONSE", data);

      if (!response.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Store the JWT token in localStorage
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }

      // Transform backend response to match frontend User type
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        password: '', // Don't store password in frontend
        organizationId: data.user.organization_id,
        roleId: data.user.role_id || 'system-super-admin-role',
        role: data.user.role || 'System Super Admin',
        status: 'active'
      };

      // For System Super Admin, org is null
      const org: Organization | null = data.user.organization_id ? {
        id: data.user.organization_id,
        name: data.user.organization_name || 'Organization',
        pricing: { storageFeePerCBM: 0, handlingFeePerCarton: 0 },
        dateJoined: new Date().toISOString().split('T')[0],
        billingAddress: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        companyRegNo: '',
      } : null;

      setIsLoading(false);
      onAuthSuccess({ user, org });

    } catch (err) {
      console.error("API_ERROR", err);
      setError('Unable to connect to the server. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.includes('@') || password.length < 6 || !orgName.trim()) {
      setError('Please provide a valid email, a password of at least 6 characters, and an organization name.');
      setIsLoading(false);
      return;
    }

    const payload = {
      email: email.trim(),
      password: password,
      organizationName: orgName.trim()
    };

    console.log("SIGNUP_CLICKED", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("SIGNUP_RESPONSE", data);

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Store the JWT token
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }

      // Transform backend response
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        password: '',
        organizationId: data.user.organization_id,
        roleId: data.user.role_id || 'admin-role',
        role: data.user.role || 'Admin',
        status: 'active'
      };

      const org: Organization = {
        id: data.user.organization_id,
        name: orgName.trim(),
        pricing: { storageFeePerCBM: 0, handlingFeePerCarton: 0 },
        dateJoined: new Date().toISOString().split('T')[0],
        billingAddress: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        companyRegNo: '',
      };

      setIsLoading(false);
      onAuthSuccess({ user, org });

    } catch (err) {
      console.error("SIGNUP_ERROR", err);
      setError('Unable to connect to the server. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage('Password reset functionality will be implemented soon. Please contact support.');
  };

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    setForgotEmail('');
    setForgotMessage('');
  };
  
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
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Please wait...' : (isLoginView ? 'Sign In' : 'Create Organization')}
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
              <p className="text-sm text-gray-600">Enter your email address to reset your password.</p>
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
