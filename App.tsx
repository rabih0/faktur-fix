import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Section, CompanyInfo, Client, Invoice, InvoiceItem, Offer, Appointment, OfferStatus, InvoiceStatus, RecurringInvoice, Expense } from './types';
import CompanySection from './components/CompanySection';
import ClientsSection from './components/ClientsSection';
import DocumentsSection from './components/DocumentsSection';
import FinancesSection from './components/FinancesSection';
import HomeSection from './components/HomeSection';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import { DEFAULT_COMPANY_INFO, DEFAULT_CLIENTS, DEFAULT_INVOICES, DEFAULT_ITEMS, DEFAULT_OFFERS, DEFAULT_APPOINTMENTS, DEFAULT_EXPENSES } from './constants';

const App: React.FC = () => {
    const [activeSection, setActiveSection] = useState<Section>(Section.Home);
    const [companyInfo, setCompanyInfo] = useLocalStorage<CompanyInfo>('companyInfo', DEFAULT_COMPANY_INFO);
    const [clients, setClients] = useLocalStorage<Client[]>('clients', DEFAULT_CLIENTS);
    const [items, setItems] = useLocalStorage<InvoiceItem[]>('items', DEFAULT_ITEMS);
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', DEFAULT_INVOICES);
    const [offers, setOffers] = useLocalStorage<Offer[]>('offers', DEFAULT_OFFERS);
    const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', DEFAULT_APPOINTMENTS);
    const [recurringInvoices, setRecurringInvoices] = useLocalStorage<RecurringInvoice[]>('recurringInvoices', []);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', DEFAULT_EXPENSES);

    useEffect(() => {
        // --- Generate invoices from recurring ones ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newInvoices: Invoice[] = [];
        let updatedRecurringInvoices = [...recurringInvoices];

        recurringInvoices.forEach(rec => {
            if (rec.isActive && new Date(rec.nextDueDate) <= today) {
                const lastInvoiceNumberStr = invoices.length > 0 ? (
                    [...invoices, ...newInvoices]
                        .map(i => i.invoiceNumber.replace(companyInfo.invoiceNumberPrefix, ''))
                        .map(n => parseInt(n, 10))
                        .filter(n => !isNaN(n))
                        .reduce((max, n) => Math.max(max, n), 0)
                ).toString() : "0";

                const lastInvoiceNumber = parseInt(lastInvoiceNumberStr, 10);

                const newInvoice: Invoice = {
                    id: Date.now().toString() + Math.random(),
                    invoiceNumber: `${companyInfo.invoiceNumberPrefix}${lastInvoiceNumber + 1}`,
                    clientId: rec.clientId,
                    date: new Date().toISOString().split('T')[0],
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
                    items: rec.items.map(item => ({ ...item, id: `inv-item-${Date.now()}-${Math.random()}` })),
                    taxRate: rec.taxRate,
                    status: InvoiceStatus.Draft,
                };
                newInvoices.push(newInvoice);

                // Update nextDueDate for the recurring invoice
                const currentNextDue = new Date(rec.nextDueDate);
                let newNextDue: Date;
                switch (rec.frequency) {
                    case 'monthly':
                        newNextDue = new Date(currentNextDue.setMonth(currentNextDue.getMonth() + 1));
                        break;
                    case 'quarterly':
                        newNextDue = new Date(currentNextDue.setMonth(currentNextDue.getMonth() + 3));
                        break;
                    case 'yearly':
                        newNextDue = new Date(currentNextDue.setFullYear(currentNextDue.getFullYear() + 1));
                        break;
                }

                updatedRecurringInvoices = updatedRecurringInvoices.map(r => r.id === rec.id ? { ...r, nextDueDate: newNextDue.toISOString().split('T')[0] } : r);
            }
        });

        if (newInvoices.length > 0) {
            setInvoices(prev => [...prev, ...newInvoices]);
            setRecurringInvoices(updatedRecurringInvoices);
        }
    }, []);


    const handleConvertToInvoice = (offer: Offer) => {
        setOffers(offers.map(o => o.id === offer.id ? { ...o, status: OfferStatus.Accepted } : o));

        const lastInvoiceNumber = invoices.length > 0 ? Math.max(0, ...invoices.map(i => parseInt(i.invoiceNumber.replace(companyInfo.invoiceNumberPrefix, ''), 10)).filter(n => !isNaN(n))) : 0;

        const newInvoice: Invoice = {
            id: Date.now().toString(),
            invoiceNumber: `${companyInfo.invoiceNumberPrefix}${(lastInvoiceNumber + 1).toString()}`,
            clientId: offer.clientId,
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
            items: offer.items.map(item => ({ ...item, id: `inv-item-${Date.now()}-${Math.random()}` })),
            taxRate: offer.taxRate,
            status: InvoiceStatus.Draft,
            offerId: offer.id,
        };

        setInvoices(prevInvoices => [...prevInvoices, newInvoice]);
        setActiveSection(Section.Documents);
    };

    const renderSection = () => {
        switch (activeSection) {
            case Section.Home:
                return <HomeSection
                    appointments={appointments}
                    clients={clients}
                    invoices={invoices}
                    offers={offers}
                    companyInfo={companyInfo}
                    setActiveSection={setActiveSection}
                />;
            case Section.Documents:
                return (
                    <DocumentsSection
                        invoices={invoices}
                        setInvoices={setInvoices}
                        offers={offers}
                        setOffers={setOffers}
                        recurringInvoices={recurringInvoices}
                        setRecurringInvoices={setRecurringInvoices}
                        clients={clients}
                        companyInfo={companyInfo}
                        items={items}
                        setItems={setItems}
                        onConvertToInvoice={handleConvertToInvoice}
                    />
                );
            case Section.Finances:
                return (
                    <FinancesSection
                        expenses={expenses}
                        setExpenses={setExpenses}
                        invoices={invoices}
                        clients={clients}
                        companyInfo={companyInfo}
                    />
                );
            case Section.Clients:
                return <ClientsSection clients={clients} setClients={setClients} />;
            case Section.Company:
                return <CompanySection companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />;
            default:
                return <HomeSection appointments={appointments} clients={clients} invoices={invoices} offers={offers} companyInfo={companyInfo} />;
        }
    };

    return (
        <div className="flex flex-col h-screen font-sans">
            <Header />
            <main className="flex-1 overflow-y-auto pb-20">
                {renderSection()}
            </main>
            <BottomNav activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>
    );
};

export default App;