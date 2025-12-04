
import React, { useState, useRef } from 'react';
import { CompanyInfo } from '../types';
import Icon from './Icon';
import { ICONS } from '../constants/icons';

type CompanyTab = 'info' | 'branding' | 'defaults' | 'payments';

const InputField: React.FC<{ label: string; value: string | number; name: keyof CompanyInfo; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; isOptional?: boolean, step?: string }> = ({ label, value, name, onChange, type = 'text', isOptional, step }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-black">
            {label} {isOptional && <span className="text-black">(Optional)</span>}
        </label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            step={step}
            className="mt-1 block w-full bg-gray-200 border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 sm:text-sm p-2 text-black"
        />
    </div>
);

const TextAreaField: React.FC<{ label: string; value: string; name: keyof CompanyInfo; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number }> = ({ label, value, name, onChange, rows=3 }) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-black">
            {label}
        </label>
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            rows={rows}
            className="mt-1 block w-full bg-gray-200 border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 sm:text-sm p-2 text-black"
        />
    </div>
)

const CompanySection: React.FC<{ companyInfo: CompanyInfo, setCompanyInfo: (info: CompanyInfo) => void }> = ({ companyInfo, setCompanyInfo }) => {
    const [localInfo, setLocalInfo] = useState(companyInfo);
    const [activeTab, setActiveTab] = useState<CompanyTab>('info');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const isNumber = e.target.type === 'number';
        setLocalInfo(prev => ({ 
            ...prev, 
            [name]: isNumber ? parseFloat(value) : value 
        }));
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalInfo(prev => ({ ...prev, [name]: value }));
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalInfo(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = () => {
        setCompanyInfo(localInfo);
    };

    const TabButton: React.FC<{tab: CompanyTab, label: string}> = ({tab, label}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab 
                ? 'bg-white text-black border-b-2 border-violet-500' 
                : 'text-gray-500 hover:text-black'
            }`}
        >
            {label}
        </button>
    )

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-black">Firma & Einstellungen</h1>
                <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors">Speichern</button>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tab="info" label="Stammdaten" />
                    <TabButton tab="branding" label="Branding & Layout" />
                    <TabButton tab="defaults" label="Standardwerte" />
                    <TabButton tab="payments" label="Zahlungen & E-Mail" />
                </nav>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        <InputField label="Firmenname" name="name" value={localInfo.name} onChange={handleChange} />
                        <InputField label="Adresse" name="address" value={localInfo.address} onChange={handleChange} />
                        <InputField label="Postleitzahl" name="zip" value={localInfo.zip} onChange={handleChange} />
                        <InputField label="Stadt" name="city" value={localInfo.city} onChange={handleChange} />
                        <InputField label="Telefon" name="phone" value={localInfo.phone} onChange={handleChange} />
                        <InputField label="E-Mail" name="email" value={localInfo.email} onChange={handleChange} />
                        <InputField label="Steuernummer" name="taxNumber" value={localInfo.taxNumber || ''} onChange={handleChange} isOptional={true}/>
                        <div className="md:col-span-2 mt-6">
                             <h2 className="text-xl font-semibold text-black border-b pb-2 mb-4">Bankinformationen</h2>
                        </div>
                        <InputField label="Kontoinhaber" name="accountHolder" value={localInfo.accountHolder} onChange={handleChange} />
                        <InputField label="Bank" name="bankName" value={localInfo.bankName} onChange={handleChange} />
                        <InputField label="IBAN" name="iban" value={localInfo.iban} onChange={handleChange} />
                        <InputField label="BIC" name="bic" value={localInfo.bic} onChange={handleChange} />
                    </div>
                )}
                {activeTab === 'branding' && (
                    <div className="animate-fade-in space-y-6">
                        <div>
                             <h2 className="text-xl font-semibold text-black mb-2">Firmenlogo</h2>
                             <div className="flex items-center gap-6">
                                {localInfo.logo ? (
                                    <img src={localInfo.logo} alt="Firmenlogo" className="h-20 w-auto object-contain bg-gray-100 p-2 rounded"/>
                                ) : (
                                    <div className="h-20 w-32 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">Kein Logo</div>
                                )}
                                <input type="file" accept="image/*" onChange={handleLogoUpload} ref={fileInputRef} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-black text-white rounded-md shadow hover:bg-gray-800 transition-colors flex items-center gap-2">
                                    <Icon path={ICONS.upload} className="w-5 h-5" />
                                    Logo ändern
                                </button>
                                {localInfo.logo && <button onClick={() => setLocalInfo(prev => ({...prev, logo: ''}))} className="p-2 text-red-500 hover:text-red-700" title="Logo entfernen"><Icon path={ICONS.trash} className="w-5 h-5"/></button>}
                             </div>
                        </div>
                         <div>
                             <h2 className="text-xl font-semibold text-black mb-2">Markenfarbe</h2>
                             <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-600">Diese Farbe wird in Kopfzeilen von Dokumenten verwendet.</p>
                                <div className="relative">
                                    <input type="color" name="primaryColor" value={localInfo.primaryColor} onChange={handleColorChange} className="w-12 h-10 p-1 border-none cursor-pointer" />
                                </div>
                                <span className="p-2 rounded" style={{backgroundColor: localInfo.primaryColor, color: '#fff'}}>{localInfo.primaryColor}</span>
                             </div>
                        </div>
                        <div>
                             <h2 className="text-xl font-semibold text-black mb-2">Farbe des Firmennamens</h2>
                             <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-600">Wird für den Firmennamen auf Dokumenten verwendet (wenn kein Logo gesetzt ist).</p>
                                <div className="relative">
                                    <input type="color" name="brandingTextColor" value={localInfo.brandingTextColor || '#000000'} onChange={handleColorChange} className="w-12 h-10 p-1 border-none cursor-pointer" />
                                </div>
                                <span className="p-2 rounded" style={{backgroundColor: localInfo.brandingTextColor, color: '#fff'}}>{localInfo.brandingTextColor}</span>
                             </div>
                        </div>
                    </div>
                )}
                {activeTab === 'defaults' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        <InputField label="Standard-MwSt. (%)" name="defaultTaxRate" type="number" step="0.1" value={localInfo.defaultTaxRate} onChange={handleChange} />
                        <InputField label="Währungssymbol" name="currency" value={localInfo.currency} onChange={handleChange} />
                        <InputField label="Präfix Rechnungsnummer" name="invoiceNumberPrefix" value={localInfo.invoiceNumberPrefix} onChange={handleChange} />
                        <InputField label="Präfix Angebotsnummer" name="offerNumberPrefix" value={localInfo.offerNumberPrefix} onChange={handleChange} />
                    </div>
                )}
                {activeTab === 'payments' && (
                     <div className="space-y-6 animate-fade-in">
                        <div>
                             <h2 className="text-xl font-semibold text-black mb-2">Online-Zahlungen</h2>
                             <p className="text-sm text-gray-600 mb-2">Fügen Sie einen Link hinzu (z.B. PayPal.me), um einen "Online Bezahlen"-Button auf Rechnungen anzuzeigen.</p>
                             <InputField label="Zahlungslink" name="onlinePaymentLink" value={localInfo.onlinePaymentLink || ''} onChange={handleChange} isOptional={true}/>
                        </div>
                        <div>
                             <h2 className="text-xl font-semibold text-black mb-2">Zusätzlicher Zahlungshinweis</h2>
                             <p className="text-sm text-gray-600 mb-2">Dieser Text wird auf der Rechnung über den Bankdaten angezeigt.</p>
                             <TextAreaField label="Hinweis-Text" name="paymentNotice" value={localInfo.paymentNotice || ''} onChange={handleChange} rows={2}/>
                        </div>
                        <div>
                             <h2 className="text-xl font-semibold text-black mb-2">E-Mail Signatur</h2>
                             <p className="text-sm text-gray-600 mb-2">Diese Signatur wird automatisch in E-Mails eingefügt, die aus der App gesendet werden.</p>
                             <TextAreaField label="Signatur" name="emailSignature" value={localInfo.emailSignature || ''} onChange={handleChange} rows={4}/>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanySection;
