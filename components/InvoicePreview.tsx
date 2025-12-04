import React, { forwardRef } from 'react';
import { Invoice, Client, CompanyInfo } from '../types';

interface InvoicePreviewProps {
    invoice: Invoice;
    client: Client;
    companyInfo: CompanyInfo;
}

const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({ invoice, client, companyInfo }, ref) => {
    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const tax = subtotal * (invoice.taxRate / 100);
    const total = subtotal + tax;

    return (
        <div
            ref={ref}
            className="bg-white text-black"
            style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '15mm 20mm',
                margin: '0 auto',
                boxSizing: 'border-box',
                fontFamily: '"Noto Serif", Georgia, serif',
                fontSize: '10pt',
                lineHeight: '1.4'
            }}
        >
            {/* Sender Address (for window envelope) */}
            <div style={{ fontSize: '7pt', marginBottom: '3mm', color: '#666' }}>
                {companyInfo.name} · {companyInfo.address} · {companyInfo.zip} {companyInfo.city}
            </div>

            {/* Header: Company and Client Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15mm' }}>
                {/* Client Address Block */}
                <div style={{ width: '85mm' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '2mm' }}>
                        {client.name}
                    </div>
                    <div>{client.address}</div>
                    <div>{client.zip} {client.city}</div>
                </div>

                {/* Company Info Block */}
                <div style={{ width: '85mm', textAlign: 'right', fontSize: '9pt' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '3mm', color: '#1a1a1a' }}>
                        {companyInfo.name}
                    </div>
                    <div>{companyInfo.address}</div>
                    <div>{companyInfo.zip} {companyInfo.city}</div>
                    <div style={{ marginTop: '2mm' }}>Tel: {companyInfo.phone}</div>
                    <div>E-Mail: {companyInfo.email}</div>
                    {companyInfo.taxNumber && <div>St.-Nr.: {companyInfo.taxNumber}</div>}
                </div>
            </div>

            {/* Invoice Title and Metadata */}
            <div style={{ marginBottom: '8mm' }}>
                <h1 style={{
                    fontSize: '18pt',
                    fontWeight: 'bold',
                    color: '#3B82F6',
                    marginBottom: '4mm',
                    letterSpacing: '0.5px'
                }}>
                    Rechnung #{invoice.invoiceNumber}
                </h1>
                <div style={{ display: 'flex', gap: '15mm', fontSize: '9pt' }}>
                    <div><strong>Rechnungsdatum:</strong> {new Date(invoice.date).toLocaleDateString('de-DE')}</div>
                    <div><strong>Fälligkeitsdatum:</strong> {new Date(invoice.dueDate).toLocaleDateString('de-DE')}</div>
                </div>
            </div>

            {/* Line Items Table */}
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '8mm',
                fontSize: '9pt'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#3B82F6', color: 'white' }}>
                        <th style={{
                            padding: '6px 8px',
                            textAlign: 'left',
                            fontWeight: '600',
                            width: '50%'
                        }}>Beschreibung</th>
                        <th style={{
                            padding: '6px 8px',
                            textAlign: 'center',
                            fontWeight: '600',
                            width: '12%'
                        }}>Menge</th>
                        <th style={{
                            padding: '6px 8px',
                            textAlign: 'right',
                            fontWeight: '600',
                            width: '18%'
                        }}>Einzelpreis</th>
                        <th style={{
                            padding: '6px 8px',
                            textAlign: 'right',
                            fontWeight: '600',
                            width: '20%'
                        }}>Gesamtpreis</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map((item, index) => (
                        <tr key={index} style={{
                            borderBottom: '1px solid #e5e7eb'
                        }}>
                            <td style={{ padding: '5px 8px' }}>{item.description}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                                {item.unitPrice.toFixed(2)} {companyInfo.currency}
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '500' }}>
                                {(item.quantity * item.unitPrice).toFixed(2)} {companyInfo.currency}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Financial Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12mm' }}>
                <div style={{ width: '45%', fontSize: '10pt' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <span>Zwischensumme:</span>
                        <span style={{ fontWeight: '500' }}>{subtotal.toFixed(2)} {companyInfo.currency}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <span>zzgl. {invoice.taxRate}% MwSt.:</span>
                        <span style={{ fontWeight: '500' }}>{tax.toFixed(2)} {companyInfo.currency}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        marginTop: '3mm',
                        borderTop: '2px solid #3B82F6',
                        fontSize: '13pt',
                        fontWeight: 'bold'
                    }}>
                        <span>Gesamtbetrag:</span>
                        <span>{total.toFixed(2)} {companyInfo.currency}</span>
                    </div>
                </div>
            </div>

            {/* Payment Information */}
            <div style={{
                marginTop: '15mm',
                paddingTop: '8mm',
                borderTop: '1px solid #d1d5db',
                fontSize: '9pt'
            }}>
                <p style={{ marginBottom: '5mm', textAlign: 'center', fontWeight: '500' }}>
                    Bitte überweisen Sie den Gesamtbetrag bis zum {new Date(invoice.dueDate).toLocaleDateString('de-DE')} auf folgendes Konto:
                </p>

                {companyInfo.paymentNotice && (
                    <p style={{
                        textAlign: 'center',
                        fontWeight: '600',
                        marginBottom: '5mm',
                        color: '#3B82F6'
                    }}>
                        {companyInfo.paymentNotice}
                    </p>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '3mm 10mm',
                    maxWidth: '140mm',
                    margin: '0 auto',
                    padding: '4mm',
                    backgroundColor: '#f9fafb',
                    borderRadius: '2mm'
                }}>
                    <div><strong>Kontoinhaber:</strong></div>
                    <div>{companyInfo.accountHolder}</div>
                    <div><strong>Bank:</strong></div>
                    <div>{companyInfo.bankName}</div>
                    <div><strong>IBAN:</strong></div>
                    <div style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{companyInfo.iban}</div>
                    <div><strong>BIC:</strong></div>
                    <div style={{ fontFamily: 'monospace' }}>{companyInfo.bic}</div>
                </div>

                <p style={{
                    textAlign: 'center',
                    marginTop: '8mm',
                    fontStyle: 'italic',
                    color: '#666'
                }}>
                    Vielen Dank für Ihren Auftrag!
                </p>
            </div>

            {/* Footer with small print */}
            <div style={{
                position: 'absolute',
                bottom: '10mm',
                left: '20mm',
                right: '20mm',
                fontSize: '7pt',
                color: '#666',
                textAlign: 'center',
                borderTop: '0.5px solid #d1d5db',
                paddingTop: '3mm'
            }}>
                {companyInfo.name} · {companyInfo.address} · {companyInfo.zip} {companyInfo.city}
                {companyInfo.taxNumber && ` · St.-Nr.: ${companyInfo.taxNumber}`}
            </div>
        </div>
    );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
