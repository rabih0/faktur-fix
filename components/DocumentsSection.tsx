import React, { useState } from 'react';
import { Invoice, Offer, Client, CompanyInfo, InvoiceItem, RecurringInvoice } from '../types';
import InvoicesSection from './InvoicesSection';
import OffersSection from './OffersSection';

interface DocumentsSectionProps {
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    offers: Offer[];
    setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
    recurringInvoices: RecurringInvoice[];
    setRecurringInvoices: React.Dispatch<React.SetStateAction<RecurringInvoice[]>>;
    clients: Client[];
    companyInfo: CompanyInfo;
    items: InvoiceItem[];
    setItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
    onConvertToInvoice: (offer: Offer) => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'offers'>('invoices');

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-2 sticky top-0 z-10">
                <nav className="flex gap-2" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'invoices'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                            receipt_long
                        </span>
                        Rechnungen
                    </button>
                    <button
                        onClick={() => setActiveTab('offers')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'offers'
                                ? 'bg-purple-100 text-purple-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                            description
                        </span>
                        Angebote
                    </button>
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
                {activeTab === 'invoices' ? (
                    <InvoicesSection
                        invoices={props.invoices}
                        setInvoices={props.setInvoices}
                        recurringInvoices={props.recurringInvoices}
                        setRecurringInvoices={props.setRecurringInvoices}
                        clients={props.clients}
                        companyInfo={props.companyInfo}
                        items={props.items}
                        setItems={props.setItems}
                    />
                ) : (
                    <OffersSection
                        offers={props.offers}
                        setOffers={props.setOffers}
                        clients={props.clients}
                        companyInfo={props.companyInfo}
                        items={props.items}
                        setItems={props.setItems}
                        onConvertToInvoice={(offer) => {
                            props.onConvertToInvoice(offer);
                            setActiveTab('invoices');
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default DocumentsSection;
