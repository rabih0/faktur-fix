
// Fix: Removed a self-referential import which caused multiple declaration conflicts.

export enum Section {
    Home = 'Home',
    Documents = 'Dokumente',
    Finances = 'Finanzen',
    Clients = 'Kunden',
    Company = 'Firma',
}

export enum OfferStatus {
    Draft = 'Entwurf',
    Sent = 'Gesendet',
    Accepted = 'Angenommen',
    Rejected = 'Abgelehnt',
}

export enum InvoiceStatus {
    Draft = 'Entwurf',
    Sent = 'Gesendet',
    Paid = 'Bezahlt',
    Overdue = 'Überfällig',
}

export interface CompanyInfo {
    name: string;
    address: string;
    zip: string;
    city: string;
    phone: string;
    email: string;
    taxNumber?: string;
    bankName: string;
    iban: string;
    bic: string;
    accountHolder: string;
    // Branding & Layout
    logo?: string; // base64 encoded image
    primaryColor?: string;
    brandingTextColor?: string;
    // Defaults
    defaultTaxRate: number;
    currency: string;
    invoiceNumberPrefix: string;
    offerNumberPrefix: string;
    // Payments & Email
    onlinePaymentLink?: string;
    emailSignature?: string;
    paymentNotice?: string;
}

export interface Client {
    id: string;
    name: string;
    address: string;
    zip: string;
    city: string;
    phone: string;
    email: string;
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    clientId: string;
    date: string;
    dueDate: string;
    items: InvoiceItem[];
    taxRate: number;
    status: InvoiceStatus;
    offerId?: string;
}

export interface Offer {
    id: string;
    offerNumber: string;
    clientId: string;
    date: string;
    validUntil: string;
    items: InvoiceItem[];
    taxRate: number;
    status: OfferStatus;
}

export interface Appointment {
    id: string;
    clientId: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
}

export interface RecurringInvoice {
    id: string;
    clientId: string;
    items: InvoiceItem[];
    taxRate: number;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    startDate: string;
    nextDueDate: string;
    isActive: boolean;
    title: string;
}

export interface Expense {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
}
