import React, { useState } from 'react';
import type { Organization, Pricing, FulfillmentTier, ConsumableItem, AdHocCharge } from '../types';

interface PriceSettingsProps {
    organization: Organization;
    onUpdatePricing: (pricing: Pricing) => void;
    onAddAdHocCharge: (charge: Omit<AdHocCharge, 'id'>) => void;
}

const PriceSettings: React.FC<PriceSettingsProps> = ({ organization, onUpdatePricing, onAddAdHocCharge }) => {
    const [pricing, setPricing] = useState<Pricing>(organization.pricing);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [adhocHandling, setAdhocHandling] = useState({ description: '', amount: '' });
    const [adhocConsumable, setAdhocConsumable] = useState({ description: '', amount: '' });


    const handleFulfillmentChange = (id: string, field: 'volume' | 'price', value: number) => {
        setPricing(prev => ({
            ...prev,
            fulfillmentTiers: prev.fulfillmentTiers.map(t => t.id === id ? { ...t, [field]: value } : t)
        }));
    };

    const addFulfillmentTier = () => {
        const newTier: FulfillmentTier = { id: `tier-${Date.now()}`, volume: 0, price: 0 };
        setPricing(prev => ({ ...prev, fulfillmentTiers: [...prev.fulfillmentTiers, newTier] }));
    };

    const removeFulfillmentTier = (id: string) => {
        setPricing(prev => ({ ...prev, fulfillmentTiers: prev.fulfillmentTiers.filter(t => t.id !== id) }));
    };
    
    const handleConsumableChange = (id: string, field: 'name' | 'price' | 'unit', value: string | number) => {
        setPricing(prev => ({
            ...prev,
            consumableItems: prev.consumableItems.map(c => c.id === id ? { ...c, [field]: value } : c)
        }));
    };
    
    const addConsumable = () => {
        const newConsumable: ConsumableItem = { id: `con-${Date.now()}`, name: '', price: 0, unit: 'Per Item' };
        setPricing(prev => ({...prev, consumableItems: [...prev.consumableItems, newConsumable]}));
    };
    
    const removeConsumable = (id: string) => {
        setPricing(prev => ({...prev, consumableItems: prev.consumableItems.filter(c => c.id !== id)}));
    };
    
    const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [section, key] = name.split('.');
        setPricing(prev => ({
            ...prev,
            [section]: { ...prev[section as keyof Pricing], [key]: parseFloat(value) || 0 }
        }));
    };
    
    const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [section, subSection, key] = name.split('.');
        setPricing(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof Pricing],
                [subSection]: {
                    ...(prev[section as keyof Pricing] as any)[subSection],
                    [key]: parseFloat(value) || 0
                }
            }
        }));
    };


    const handleSave = () => {
        setIsSaving(true);
        setSaveSuccess(false);

        setTimeout(() => {
            onUpdatePricing(pricing);
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }, 500);
    };

    const handleAdhocSubmit = (type: 'Handling' | 'Consumable') => {
        const charge = type === 'Handling' ? adhocHandling : adhocConsumable;
        const amount = parseFloat(charge.amount);
        if (!charge.description.trim() || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid description and a positive amount.');
            return;
        }
        onAddAdHocCharge({
            date: new Date().toISOString().split('T')[0],
            type,
            description: charge.description,
            amount
        });
        alert(`${type} charge of $${amount.toFixed(2)} submitted successfully.`);
        // Reset form
        if (type === 'Handling') {
            setAdhocHandling({ description: '', amount: '' });
        } else {
            setAdhocConsumable({ description: '', amount: '' });
        }
    };
    
    const inputClass = "block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const subHeaderClass = "text-lg font-semibold text-gray-700 mb-4 pb-2 border-b";

    const renderStorage = () => (
        <div className="space-y-4">
            <h3 className={subHeaderClass}>1. Storage Rental</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><label className={labelClass}>Rate per Pallet/Month (RM)</label><input type="number" name="storage.ratePerPalletPerMonth" value={pricing.storage.ratePerPalletPerMonth} onChange={handleSimpleChange} className={inputClass} step="0.01"/></div>
                 <div><label className={labelClass}>Standard Pallet Size (CBM)</label><input type="number" name="storage.palletCBM" value={pricing.storage.palletCBM} onChange={handleSimpleChange} className={inputClass} step="0.01"/></div>
            </div>
        </div>
    );

    const renderFulfillment = () => (
        <div className="space-y-4">
            <h3 className={subHeaderClass}>2. Fulfillment Service (Pick & Pack) per DO</h3>
            {pricing.fulfillmentTiers.map(tier => (
                <div key={tier.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div><label className={labelClass}>Volume (Monthly)</label><input type="number" value={tier.volume} onChange={e => handleFulfillmentChange(tier.id, 'volume', parseFloat(e.target.value))} className={inputClass}/></div>
                    <div><label className={labelClass}>Price (RM)</label><input type="number" value={tier.price} onChange={e => handleFulfillmentChange(tier.id, 'price', parseFloat(e.target.value))} className={inputClass} step="0.01"/></div>
                    <button onClick={() => removeFulfillmentTier(tier.id)} className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 h-fit mt-auto md:mt-6">Remove</button>
                </div>
            ))}
            <button onClick={addFulfillmentTier} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700">Add Tier</button>
        </div>
    );
    
    const renderTransport = () => (
        <div className="space-y-6">
            <h3 className={subHeaderClass}>3. Logistics Fee</h3>
            <div>
                <h4 className="font-semibold text-gray-600 mb-2">Courier Service</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelClass}>First 3kg (RM)</label><input type="number" name="transport.courier.first3kg" value={pricing.transport.courier.first3kg} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Subsequent kg (RM)</label><input type="number" name="transport.courier.subsequentKg" value={pricing.transport.courier.subsequentKg} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Within State 25-50kg (RM)</label><input type="number" name="transport.courier.withinState25to50kg" value={pricing.transport.courier.withinState25to50kg} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-gray-600 mb-2">Ocean Freight</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>KLG-SBW per 1m³ (RM)</label><input type="number" name="transport.oceanFreight.klgSbw1m3" value={pricing.transport.oceanFreight.klgSbw1m3} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>KLG-BKI per 1m³ (RM)</label><input type="number" name="transport.oceanFreight.klgBki1m3" value={pricing.transport.oceanFreight.klgBki1m3} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                </div>
            </div>
        </div>
    );

    const renderHandling = () => (
        <div className="space-y-6">
             <h3 className={subHeaderClass}>4. Handling Fee</h3>
             <div>
                <h4 className="font-semibold text-gray-600 mb-2">Rate Settings</h4>
                <h5 className="font-medium text-gray-500 mb-2 text-sm">Manpower Loading/Unloading</h5>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div><label className={labelClass}>Palletize 40ft (RM)</label><input type="number" name="handling.manpower.palletize40ft" value={pricing.handling.manpower.palletize40ft} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Palletize 20ft (RM)</label><input type="number" name="handling.manpower.palletize20ft" value={pricing.handling.manpower.palletize20ft} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Palletize 5-10 ton (RM)</label><input type="number" name="handling.manpower.palletize5to10ton" value={pricing.handling.manpower.palletize5to10ton} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Palletize 1-3 ton (RM)</label><input type="number" name="handling.manpower.palletize1to3ton" value={pricing.handling.manpower.palletize1to3ton} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Loose 40ft (RM)</label><input type="number" name="handling.manpower.loose40ft" value={pricing.handling.manpower.loose40ft} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Loose 20ft (RM)</label><input type="number" name="handling.manpower.loose20ft" value={pricing.handling.manpower.loose20ft} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Loose 5-10 ton (RM)</label><input type="number" name="handling.manpower.loose5to10ton" value={pricing.handling.manpower.loose5to10ton} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Loose 1-3 ton (RM)</label><input type="number" name="handling.manpower.loose1to3ton" value={pricing.handling.manpower.loose1to3ton} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                 </div>
             </div>
             <div>
                <h5 className="font-medium text-gray-500 mb-2 text-sm">Inbound/Outbound Handling</h5>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelClass}>Per Pallet (RM)</label><input type="number" name="handling.inboundOutbound.perPallet" value={pricing.handling.inboundOutbound.perPallet} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Per Carton (RM)</label><input type="number" name="handling.inboundOutbound.perCarton" value={pricing.handling.inboundOutbound.perCarton} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Per Unit/Pack (RM)</label><input type="number" name="handling.inboundOutbound.perUnit" value={pricing.handling.inboundOutbound.perUnit} onChange={handleNestedChange} className={inputClass} step="0.01"/></div>
                 </div>
             </div>
             <div className="pt-4 border-t mt-6">
                <h4 className="font-semibold text-gray-600 mb-2">Ad-hoc Charge Submission</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1"><label className={labelClass}>Description</label><input type="text" value={adhocHandling.description} onChange={e => setAdhocHandling(p => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="e.g., Special Project Labor" /></div>
                    <div><label className={labelClass}>Amount (RM)</label><input type="number" value={adhocHandling.amount} onChange={e => setAdhocHandling(p => ({ ...p, amount: e.target.value }))} className={inputClass} step="0.01" placeholder="0.00" /></div>
                    <button onClick={() => handleAdhocSubmit('Handling')} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Submit Charge</button>
                </div>
            </div>
        </div>
    );
    
    const renderConsumables = () => (
        <div className="space-y-4">
             <h3 className={subHeaderClass}>5. Consumable Items</h3>
             <h4 className="font-semibold text-gray-600 mb-2">Rate Settings</h4>
             {pricing.consumableItems.map(item => (
                 <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div><label className={labelClass}>Item Name</label><input type="text" value={item.name} onChange={e => handleConsumableChange(item.id, 'name', e.target.value)} className={inputClass}/></div>
                    <div><label className={labelClass}>Price (RM)</label><input type="number" value={item.price} onChange={e => handleConsumableChange(item.id, 'price', parseFloat(e.target.value))} className={inputClass} step="0.01"/></div>
                    <div><label className={labelClass}>Unit</label><input type="text" value={item.unit} onChange={e => handleConsumableChange(item.id, 'unit', e.target.value)} className={inputClass}/></div>
                    <button onClick={() => removeConsumable(item.id)} className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 h-fit mt-auto md:mt-6">Remove</button>
                 </div>
             ))}
             <button onClick={addConsumable} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700">Add Consumable Rate</button>

             <div className="pt-4 border-t mt-6">
                <h4 className="font-semibold text-gray-600 mb-2">Ad-hoc Charge Submission</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1"><label className={labelClass}>Description</label><input type="text" value={adhocConsumable.description} onChange={e => setAdhocConsumable(p => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="e.g., Custom Packaging" /></div>
                    <div><label className={labelClass}>Amount (RM)</label><input type="number" value={adhocConsumable.amount} onChange={e => setAdhocConsumable(p => ({ ...p, amount: e.target.value }))} className={inputClass} step="0.01" placeholder="0.00" /></div>
                    <button onClick={() => handleAdhocSubmit('Consumable')} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Submit Charge</button>
                </div>
            </div>
        </div>
    );


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Price Settings</h2>
                <div className="flex items-center gap-4">
                    {saveSuccess && (
                        <span className="text-sm font-medium text-green-600 transition-opacity duration-300" style={{opacity: saveSuccess ? 1 : 0}}>
                            Settings saved successfully!
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="py-2 px-6 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-8">
                {renderStorage()}
                <hr/>
                {renderFulfillment()}
                <hr/>
                {renderTransport()}
                <hr/>
                {renderHandling()}
                <hr/>
                {renderConsumables()}
            </div>
        </div>
    );
};

export default PriceSettings;