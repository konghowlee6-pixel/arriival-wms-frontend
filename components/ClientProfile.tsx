import React, { useState } from 'react';
import type { Organization } from '../types';

interface ClientProfileProps {
    organization: Organization;
    onUpdateDetails: (details: Partial<Organization>) => void;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ organization, onUpdateDetails }) => {
    const [details, setDetails] = useState({
        name: organization.name,
        billingAddress: organization.billingAddress,
        contactPerson: organization.contactPerson,
        contactEmail: organization.contactEmail,
        contactPhone: organization.contactPhone,
        companyRegNo: organization.companyRegNo,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);

        // Simulate a brief delay for better UX
        setTimeout(() => {
            onUpdateDetails(details);
            setIsSaving(false);
            setSaveSuccess(true);

            // Hide the success message after 3 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);
        }, 500);
    };
    
    const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-700";

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">Client Profile</h2>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Manage Company Information</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className={labelClass}>Company Name</label>
                            <input type="text" id="name" name="name" value={details.name} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="companyRegNo" className={labelClass}>Company Registration No.</label>
                            <input type="text" id="companyRegNo" name="companyRegNo" value={details.companyRegNo} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="billingAddress" className={labelClass}>Billing Address</label>
                        <textarea id="billingAddress" name="billingAddress" value={details.billingAddress} onChange={handleChange} className={inputClass} rows={4}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="contactPerson" className={labelClass}>Contact Person</label>
                            <input type="text" id="contactPerson" name="contactPerson" value={details.contactPerson} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="contactEmail" className={labelClass}>Contact Email</label>
                            <input type="email" id="contactEmail" name="contactEmail" value={details.contactEmail} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="contactPhone" className={labelClass}>Contact Phone</label>
                            <input type="tel" id="contactPhone" name="contactPhone" value={details.contactPhone} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                    
                    <div className="pt-5">
                        <div className="flex justify-end items-center gap-4">
                            {saveSuccess && (
                                <span className="text-sm font-medium text-green-600 transition-opacity duration-300" style={{opacity: saveSuccess ? 1 : 0}}>
                                    Profile saved successfully!
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="py-2 px-6 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientProfile;