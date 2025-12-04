
import { CompanyInfo, Client, InvoiceItem, Invoice, Offer, Appointment, Expense } from './types';

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
    name: 'Ihre Firma GmbH',
    address: 'Musterstraße 1',
    zip: '12345',
    city: 'Musterstadt',
    phone: '0123 456789',
    email: 'kontakt@ihrefirma.de',
    taxNumber: '123/456/7890',
    bankName: 'Musterbank',
    iban: 'DE12345678901234567890',
    bic: 'MUSTERDEFF',
    accountHolder: 'Ihre Firma GmbH',
    logo: '',
    primaryColor: '#3b82f6', // blue-500
    brandingTextColor: '#000000',
    defaultTaxRate: 19,
    currency: '€',
    invoiceNumberPrefix: 'RE-',
    offerNumberPrefix: 'AN-',
    onlinePaymentLink: '',
    emailSignature: 'Mit freundlichen Grüßen,\nIhre Firma GmbH',
    paymentNotice: ''
};

export const DEFAULT_CLIENTS: Client[] = [
    {
        id: '1',
        name: 'Max Mustermann',
        address: 'Kundenweg 2',
        zip: '54321',
        city: 'Kundenstadt',
        phone: '0987 654321',
        email: 'max@mustermann.de'
    }
];

export const DEFAULT_ITEMS: InvoiceItem[] = [
    { id: 'item-1', description: 'Umzugshelfer (pro Stunde)', quantity: 1, unitPrice: 50 },
    { id: 'item-2', description: 'Endreinigung Pauschale', quantity: 1, unitPrice: 250 },
    { id: 'item-3', description: 'Verpackungsmaterial', quantity: 1, unitPrice: 75 },
];

export const DEFAULT_INVOICES: Invoice[] = [];

export const DEFAULT_OFFERS: Offer[] = [];

export const DEFAULT_APPOINTMENTS: Appointment[] = [];

export const DEFAULT_EXPENSES: Expense[] = [];

export const EXPENSE_CATEGORIES = ['Material', 'Treibstoff', 'Marketing', 'Versicherung', 'Bürobedarf', 'Sonstiges'];
