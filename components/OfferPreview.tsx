import React, { forwardRef } from 'react';
import { Offer, Client, CompanyInfo } from '../types';

interface OfferPreviewProps {
    offer: Offer;
    client: Client;
    companyInfo: CompanyInfo;
}

const OfferPreview = forwardRef<HTMLDivElement, OfferPreviewProps>(({ offer, client, companyInfo }, ref) => {
    const subtotal = offer.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const tax = subtotal * (offer.taxRate / 100);
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

            {/* Offer Title and Metadata */}
            <div style={{ marginBottom: '8mm' }}>
                <h1 style={{
                    fontSize: '18pt',
                    fontWeight: 'bold',
                    color: '#8b5cf6',
                    marginBottom: '4mm',
                    letterSpacing: '0.5px'
                }}>
                    Angebot #{offer.offerNumber}
                </h1>
                <div style={{ display: 'flex', gap: '15mm', fontSize: '9pt' }}>
                    <div><strong>Angebotsdatum:</strong> {new Date(offer.date).toLocaleDateString('de-DE')}</div>
                    <div><strong>Gültig bis:</strong> {new Date(offer.validUntil).toLocaleDateString('de-DE')}</div>
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
                    <tr style={{ backgroundColor: '#8b5cf6', color: 'white' }}>
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
                    {offer.items.map((item, index) => (
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
                        <span>zzgl. {offer.taxRate}% MwSt.:</span>
                        <span style={{ fontWeight: '500' }}>{tax.toFixed(2)} {companyInfo.currency}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        marginTop: '3mm',
                        borderTop: '2px solid #8b5cf6',
                        fontSize: '13pt',
                        fontWeight: 'bold'
                    }}>
                        <span>Gesamtbetrag:</span>
                        <span>{total.toFixed(2)} {companyInfo.currency}</span>
                    </div>
                </div>
            </div>

            {/* Offer Validity Notice */}
            <div style={{
                marginTop: '15mm',
                paddingTop: '8mm',
                borderTop: '1px solid #d1d5db',
                fontSize: '9pt'
            }}>
                <p style={{ marginBottom: '5mm', textAlign: 'center', fontWeight: '500' }}>
                    Dieses Angebot ist gültig bis zum {new Date(offer.validUntil).toLocaleDateString('de-DE')}.
                </p>

                {companyInfo.paymentNotice && (
                    <p style={{
                        textAlign: 'center',
                        fontWeight: '600',
                        marginBottom: '5mm',
                        color: '#8b5cf6'
                    }}>
                        {companyInfo.paymentNotice}
                    </p>
                )}

                <div style={{
                    padding: '5mm',
                    backgroundColor: '#f9fafb',
                    borderRadius: '2mm',
                    marginTop: '5mm',
                    textAlign: 'center'
                }}>
                    <p style={{ marginBottom: '3mm', fontWeight: '600' }}>
                        Bei Annahme dieses Angebots:
                    </p>
                    <p>
                        Bitte bestätigen Sie Ihre Auftragserteilung schriftlich oder per E-Mail an {companyInfo.email}
                    </p>
                </div>

                <p style={{
                    textAlign: 'center',
                    marginTop: '8mm',
                    fontStyle: 'italic',
                    color: '#666'
                }}>
                    Wir freuen uns auf Ihre Rückmeldung!
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

OfferPreview.displayName = 'OfferPreview';

export default OfferPreview;
