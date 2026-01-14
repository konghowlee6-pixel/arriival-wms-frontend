import React, { useState, useEffect } from 'react';
import type { User, Organization } from '../types';

interface AccountSetupProps {
  token: string;
  onSetupSuccess: (session: { user: User; org: Organization | null }) => void;
}

const AccountSetup: React.FC<AccountSetupProps> = ({ token, onSetupSuccess }) => {
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('inventory-app-users') || '[]') as User[];
    const userToSetup = allUsers.find(u => u.invitationToken === token && u.status === 'pending');
    if (userToSetup) {
      setUser(userToSetup);
    } else {
      setError('This invitation link is invalid or has already been used.');
    }
    setIsLoading(false);
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!user) {
        setError('User not found. Cannot set password.');
        return;
    }

    const allUsers = JSON.parse(localStorage.getItem('inventory-app-users') || '[]') as User[];
    const updatedUsers = allUsers.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          password: password,
          status: 'active' as const,
          invitationToken: undefined
        };
      }
      return u;
    });

    localStorage.setItem('inventory-app-users', JSON.stringify(updatedUsers));

    const activatedUser = updatedUsers.find(u => u.id === user.id);
    if (!activatedUser) {
        setError('Failed to activate user account. Please contact support.');
        return;
    }

    const allOrgs = JSON.parse(localStorage.getItem('inventory-app-orgs') || '[]') as Organization[];
    const org = allOrgs.find(o => o.id === activatedUser.organizationId);

    alert('Account activated successfully! You will now be logged in.');
    onSetupSuccess({ user: activatedUser, org: org || null });
  };
  
  const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">Activate Your Account</h1>
        </div>
        
        {isLoading ? (
            <p className="text-center text-gray-500">Verifying invitation...</p>
        ) : user ? (
            <>
                <p className="text-center text-gray-500">Welcome, <span className="font-semibold">{user.email}</span>. Please set a password to continue.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password" className={labelClass}>New Password</label>
                        <input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                        <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

                    <div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                        Set Password & Log In
                        </button>
                    </div>
                </form>
            </>
        ) : (
            <div className="text-center">
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
                <a href={window.location.origin} className="mt-4 inline-block text-sm font-medium text-purple-600 hover:text-purple-500">
                    Go to Login Page
                </a>
            </div>
        )}
      </div>
    </div>
  );
};

export default AccountSetup;