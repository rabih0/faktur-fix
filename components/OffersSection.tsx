import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Offer, Client, CompanyInfo, InvoiceItem, OfferStatus } from '../types';
import OfferPreview from './OfferPreview';
import EmailComposerModal from './EmailComposerModal';
import { generateTasksForMovingAndCleaning } from '../services/geminiService';
import Icon from './Icon';
import { ICONS } from '../constants/icons';

// @ts-ignore
const jspdf = window.jspdf;
// @ts-ignore
const html2canvas = window.html2canvas;


interface OffersSectionProps {
    offers: Offer[];
    setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
    clients: Client[];
    companyInfo: CompanyInfo;
    items: InvoiceItem[];
    setItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
    onConvertToInvoice: (offer: Offer) => void;
}

const OfferEditor: React.FC<{
    onClose: () => void;
    onSave: (offer: Offer) => void;
    clients: Client[];
    companyInfo: CompanyInfo;
    existingItems: InvoiceItem[];
    setExistingItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
    lastOfferNumber: number;
}> = ({ onClose, onSave, clients, companyInfo, existingItems, setExistingItems, lastOfferNumber }) => {
    const [offer, setOffer] = useState<Offer>({
        id: Date.now().toString(),
        offerNumber: `${companyInfo.offerNumberPrefix}${(lastOfferNumber + 1).toString()}`,
        clientId: clients[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
        items: [],
        taxRate: companyInfo.defaultTaxRate,
        status: OfferStatus.Draft,
    });
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<InvoiceItem | null>(null);

    const offerPreviewRef = useRef<HTMLDivElement>(null);
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        if (navigator.share && navigator.canShare) {
            setCanShare(true);
        }
    }, []);

    const handleGeneratePDF = () => {
        const input = offerPreviewRef.current;
        if (!input) return;

        html2canvas(input, { scale: 2, windowWidth: 1200 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Angebot-${offer.offerNumber}.pdf`);
        });
    };

    const handleSharePDF = async () => {
        const input = offerPreviewRef.current;
        if (!input) return;

        try {
            const canvas = await html2canvas(input, { scale: 2, windowWidth: 1200 });
            const pdf = new jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const pdfBlob = pdf.output('blob');
            const pdfFile = new File([pdfBlob], `Angebot-${offer.offerNumber}.pdf`, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    title: `Angebot ${offer.offerNumber}`,
                    text: `Anbei das Angebot ${offer.offerNumber}`,
                    files: [pdfFile],
                });
            } else {
                alert('Das Teilen von Dateien wird von diesem Browser nicht unterstützt.');
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Fehler beim Teilen der PDF:', error);
                alert('Die PDF konnte nicht geteilt werden.');
            }
        }
    };

    const handleAddItem = (item: InvoiceItem) => {
        setOffer(prev => ({ ...prev, items: [...prev.items, { ...item, id: Date.now().toString() }] }));
    };

    const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...offer.items];
        (newItems[index] as any)[field] = value;
        setOffer(prev => ({ ...prev, items: newItems }));
    };

    const handleRemoveItem = (index: number) => {
        setOffer(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const handleGenerateAIItems = async () => {
        setIsGenerating(true);
        const newItems = await generateTasksForMovingAndCleaning();
        setExistingItems(prev => {
            const existingDescriptions = new Set(prev.map(item => item.description));
            const uniqueNewItems = newItems.filter(item => !existingDescriptions.has(item.description));
            return [...prev, ...uniqueNewItems];
        });
        setIsGenerating(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDragEnter = (index: number) => {
        if (index !== draggedItemIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
            setDraggedItemIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newItems = [...offer.items];
        const [draggedItem] = newItems.splice(draggedItemIndex, 1);
        newItems.splice(dropIndex, 0, draggedItem);

        setOffer(prev => ({ ...prev, items: newItems }));
        setDraggedItemIndex(null);
        setDragOverIndex(null);
    };

    const handleSaveNewTemplate = (newTemplate: InvoiceItem) => {
        setExistingItems(prev => [...prev, newTemplate]);
        setShowNewTemplateForm(false);
    };

    const handleUpdateTemplate = (updatedTemplate: InvoiceItem) => {
        setExistingItems(prev => prev.map(item => item.id === updatedTemplate.id ? updatedTemplate : item));
        setEditingTemplate(null);
    };

    const handleDeleteTemplate = (id: string) => {
        setExistingItems(prev => prev.filter(item => item.id !== id));
    };

    const TemplateForm: React.FC<{
        template: InvoiceItem | { description: string; quantity: number; unitPrice: number };
        onSave: (template: InvoiceItem) => void;
        onCancel: () => void;
    }> = ({ template, onSave, onCancel }) => {
        const [formData, setFormData] = useState(template);
        const isNew = !('id' in formData);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value, type } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) || 0 : value
            }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({
                ...formData,
                id: isNew ? `manual-item-${Date.now()}` : (formData as InvoiceItem).id,
                quantity: 1
            });
        };

        return (
            <form onSubmit={handleSubmit} className="flex gap-2 items-center p-2 bg-violet-50 rounded shadow-sm my-2">
                <input name="description" value={formData.description} onChange={handleChange} placeholder="Beschreibung" className="flex-grow bg-white p-2 rounded text-black border border-gray-300" required />
                <input name="unitPrice" type="number" step="0.01" value={formData.unitPrice} onChange={handleChange} placeholder="Preis" className="w-24 bg-white p-2 rounded text-black border border-gray-300" required />
                <button type="submit" className="p-2 text-green-600 hover:text-green-800" title="Speichern">
                    <Icon path={ICONS.check} className="w-5 h-5" />
                </button>
                <button type="button" onClick={onCancel} className="p-2 text-red-600 hover:text-red-800" title="Abbrechen">
                    <Icon path={ICONS.xMark} className="w-5 h-5" />
                </button>
            </form>
        );
    };


    const subtotal = offer.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const tax = subtotal * (offer.taxRate / 100);
    const total = subtotal + tax;

    if (showPreview) {
        const selectedClient = clients.find(c => c.id === offer.clientId);
        return (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex flex-col p-4 items-center">
                <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl flex-1 overflow-y-auto mb-24">
                    {selectedClient && (
                        <OfferPreview ref={offerPreviewRef} offer={offer} client={selectedClient} companyInfo={companyInfo} />
                    )}
                </div>
                <div className="absolute bottom-[5rem] flex justify-center gap-2">
                    <button onClick={() => setShowPreview(false)} className="px-5 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-colors">Schließen</button>
                    {canShare &&
                        <button onClick={handleSharePDF} className="px-5 py-2 bg-fuchsia-600 text-white rounded-lg shadow-md hover:bg-fuchsia-700 transition-colors">Teilen</button>
                    }
                    <button onClick={handleGeneratePDF} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors">PDF</button>
                    <button onClick={() => { onSave(offer); setShowPreview(false); }} className="px-5 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors">Speichern</button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-black">Neues Angebot</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <label htmlFor="offer-clientId" className="block text-sm font-medium text-black">Kunde</label>
                    <select id="offer-clientId" value={offer.clientId} onChange={e => setOffer(prev => ({ ...prev, clientId: e.target.value }))} className="mt-1 w-full bg-gray-200 p-2 rounded text-black">
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="offer-offerNumber" className="block text-sm font-medium text-black">Angebotsnummer</label>
                    <input id="offer-offerNumber" type="text" value={offer.offerNumber} onChange={e => setOffer(prev => ({ ...prev, offerNumber: e.target.value }))} className="mt-1 w-full bg-gray-200 p-2 rounded text-black" />
                </div>
                <div>
                    <label htmlFor="offer-date" className="block text-sm font-medium text-black">Datum</label>
                    <input id="offer-date" type="date" value={offer.date} onChange={e => setOffer(prev => ({ ...prev, date: e.target.value }))} className="mt-1 w-full bg-gray-200 p-2 rounded text-black" />
                </div>
                <div>
                    <label htmlFor="offer-validUntil" className="block text-sm font-medium text-black">Gültig bis</label>
                    <input id="offer-validUntil" type="date" value={offer.validUntil} onChange={e => setOffer(prev => ({ ...prev, validUntil: e.target.value }))} className="mt-1 w-full bg-gray-200 p-2 rounded text-black" />
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-black">Positionen</h3>
                <div className="space-y-2">
                    {offer.items.map((item, index) => (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragLeave={handleDragLeave}
                            className={`grid grid-cols-12 gap-2 items-center p-1 rounded transition-all duration-200 ${draggedItemIndex === index ? 'opacity-50' : ''} ${dragOverIndex === index ? 'bg-violet-100' : ''}`}
                        >
                            <div className="col-span-1 flex justify-center items-center cursor-move text-black" title="Position verschieben">
                                <Icon path={ICONS.dragHandle} className="w-5 h-5" />
                            </div>
                            <input type="text" value={item.description} onChange={e => handleUpdateItem(index, 'description', e.target.value)} placeholder="Beschreibung" className="col-span-4 bg-gray-200 p-2 rounded text-black" />
                            <input type="number" value={item.quantity} onChange={e => handleUpdateItem(index, 'quantity', parseFloat(e.target.value))} placeholder="Menge" className="col-span-2 bg-gray-200 p-2 rounded text-black" />
                            <input type="number" value={item.unitPrice} onChange={e => handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value))} placeholder="Preis" className="col-span-2 bg-gray-200 p-2 rounded text-black" />
                            <span className="col-span-2 text-right pr-2 text-black">{(item.quantity * item.unitPrice).toFixed(2)} {companyInfo.currency}</span>
                            <button onClick={() => handleRemoveItem(index)} className="col-span-1 text-red-500 hover:text-red-700 flex justify-center items-center">
                                <Icon path={ICONS.trash} className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-2">
                    <button onClick={() => handleAddItem({ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 })} className="px-4 py-2 bg-gray-200 text-black rounded shadow hover:bg-gray-300 flex items-center gap-2 text-sm">
                        <Icon path={ICONS.plus} className="w-5 h-5" />
                        Leere Position hinzufügen
                    </button>
                </div>
            </div>

            <div className="border-t pt-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold text-black">Aufgaben-Vorlagen</h3>
                    <div className="flex gap-2">
                        <button onClick={handleGenerateAIItems} disabled={isGenerating} className="px-4 py-2 bg-teal-500 text-white rounded shadow hover:bg-teal-600 flex items-center gap-2 disabled:bg-teal-300">
                            <Icon path={ICONS.sparkles} className="w-5 h-5" />
                            {isGenerating ? 'Generiere...' : 'KI Vorschläge'}
                        </button>
                        <button onClick={() => { setShowNewTemplateForm(true); setEditingTemplate(null); }} className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 flex items-center gap-2">
                            <Icon path={ICONS.plus} className="w-5 h-5" />
                            <span>Neue Vorlage</span>
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Fügen Sie Positionen aus Ihrer Vorlagen-Liste zum Angebot hinzu oder verwalten Sie die Liste.</p>
                {showNewTemplateForm && (
                    <TemplateForm
                        template={{ description: '', quantity: 1, unitPrice: 0 }}
                        onSave={handleSaveNewTemplate}
                        onCancel={() => setShowNewTemplateForm(false)}
                    />
                )}
                <div className="max-h-48 overflow-y-auto space-y-2 border p-2 rounded-md bg-gray-50">
                    {existingItems.length > 0 ? existingItems.map(item => (
                        <div key={item.id}>
                            {editingTemplate?.id === item.id ? (
                                <TemplateForm
                                    template={editingTemplate}
                                    onSave={handleUpdateTemplate}
                                    onCancel={() => setEditingTemplate(null)}
                                />
                            ) : (
                                <div className="flex justify-between items-center p-2 bg-white rounded shadow-sm gap-2">
                                    <span className="text-black flex-grow truncate" title={item.description}>{item.description} ({item.unitPrice.toFixed(2)}{companyInfo.currency})</span>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleAddItem(item)} className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">Hinzufügen</button>
                                        <button onClick={() => { setEditingTemplate(item); setShowNewTemplateForm(false); }} className="p-2 text-gray-600 hover:text-violet-600" title="Vorlage bearbeiten">
                                            <Icon path={ICONS.pencil} className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteTemplate(item.id)} className="p-2 text-gray-600 hover:text-red-600" title="Vorlage löschen">
                                            <Icon path={ICONS.trash} className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 p-4">Keine Vorlagen vorhanden. Erstellen Sie eine neue oder nutzen Sie KI-Vorschläge.</p>
                    )}
                </div>
            </div>


            <div className="mt-6 flex justify-end">
                <div className="w-full md:w-1/3 space-y-2 text-black">
                    <div className="flex justify-between"><span>Zwischensumme:</span><span>{subtotal.toFixed(2)} {companyInfo.currency}</span></div>
                    <label htmlFor="offer-taxRate" className="flex justify-between items-center">
                        <span>MwSt. (%):</span>
                        <input id="offer-taxRate" type="number" value={offer.taxRate} onChange={e => setOffer(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))} className="w-20 bg-gray-200 p-1 rounded text-right text-black" />
                    </label>
                    <div className="flex justify-between"><span>MwSt.-Betrag:</span><span>{tax.toFixed(2)} {companyInfo.currency}</span></div>
                    <div className="flex justify-between font-bold text-xl"><span >Gesamt:</span><span>{total.toFixed(2)} {companyInfo.currency}</span></div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-8 border-t pt-4">
                <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Schließen</button>
                <button onClick={() => setShowPreview(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Vorschau & PDF</button>
                <button onClick={() => onSave(offer)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Speichern</button>
            </div>
        </div>
    );
};

const getOfferStatusColor = (status: OfferStatus) => {
    switch (status) {
        case OfferStatus.Draft: return 'bg-gray-200 text-gray-800';
        case OfferStatus.Sent: return 'bg-blue-200 text-blue-800';
        case OfferStatus.Accepted: return 'bg-green-200 text-green-800';
        case OfferStatus.Rejected: return 'bg-red-200 text-red-800';
        default: return 'bg-gray-200 text-gray-800';
    }
};

const OffersSection: React.FC<OffersSectionProps> = ({ offers, setOffers, clients, companyInfo, items, setItems, onConvertToInvoice }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [selectedOfferForEmail, setSelectedOfferForEmail] = useState<Offer | null>(null);

    const handleSaveOffer = (offer: Offer) => {
        setOffers(prev => [...prev.filter(i => i.id !== offer.id), offer]);
        setIsCreating(false);
    };

    const handleStatusChange = (offerId: string, status: OfferStatus) => {
        setOffers(offers.map(o => o.id === offerId ? { ...o, status } : o));
    };

    const handleOpenEmailModal = (offer: Offer) => {
        setSelectedOfferForEmail(offer);
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = () => {
        if (selectedOfferForEmail) {
            handleStatusChange(selectedOfferForEmail.id, OfferStatus.Sent);
        }
        setIsEmailModalOpen(false);
        setSelectedOfferForEmail(null);
    };

    const getLastOfferNumber = () => {
        if (offers.length === 0) return 0;
        const numbers = offers.map(i => parseInt(i.offerNumber.replace(companyInfo.offerNumberPrefix, ''), 10)).filter(n => !isNaN(n));
        return Math.max(0, ...numbers);
    };

    const filteredOffers = useMemo(() => offers.filter(offer => {
        const client = clients.find(c => c.id === offer.clientId);
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
            offer.offerNumber.toLowerCase().includes(lowerSearchTerm) ||
            client?.name.toLowerCase().includes(lowerSearchTerm)
        );
    }), [offers, clients, searchTerm]);

    const selectedClientForEmail = clients.find(c => c.id === selectedOfferForEmail?.clientId);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {isEmailModalOpen && selectedOfferForEmail && selectedClientForEmail && (
                <EmailComposerModal
                    show={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    recipientEmail={selectedClientForEmail.email}
                    subject={`Angebot ${selectedOfferForEmail.offerNumber} von ${companyInfo.name}`}
                    body={`Sehr geehrte/r ${selectedClientForEmail.name},\n\nanbei erhalten Sie Ihr angefordertes Angebot ${selectedOfferForEmail.offerNumber}.\n\n(Die PDF wird bei einem echten E-Mail-Versand automatisch angehängt.)\n\n${companyInfo.emailSignature || ''}`}
                    onSend={handleSendEmail}
                />
            )}
            {!isCreating ? (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-black">Angebote</h1>
                        <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-black text-white rounded-md shadow hover:bg-gray-800 transition-colors flex items-center gap-2">
                            <Icon path={ICONS.plus} className="w-5 h-5" />
                            <span>Neues Angebot</span>
                        </button>
                    </div>

                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Angebote suchen (Nr. oder Kunde)..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-500 focus:ring-violet-500 focus:border-violet-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredOffers.sort((a, b) => parseInt(b.offerNumber.replace(companyInfo.offerNumberPrefix, '')) - parseInt(a.offerNumber.replace(companyInfo.offerNumberPrefix, ''))).map(offer => {
                            const client = clients.find(c => c.id === offer.clientId);
                            const total = offer.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0) * (1 + offer.taxRate / 100);
                            return (
                                <div key={offer.id} className="glass-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-purple-300 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                            <Icon path={ICONS.offers} className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">#{offer.offerNumber}</p>
                                            <p className="text-sm text-gray-500">{client?.name || 'Unbekannt'} • {new Date(offer.date).toLocaleDateString('de-DE')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <p className="font-bold text-xl text-gray-800">{total.toFixed(2)} {companyInfo.currency}</p>
                                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full inline-block mt-1 ${getOfferStatusColor(offer.status)}`}>
                                                {offer.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onConvertToInvoice(offer)}
                                                disabled={offer.status === OfferStatus.Accepted}
                                                className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="In Rechnung umwandeln">
                                                <Icon path={ICONS.convert} className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleOpenEmailModal(offer)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-full transition-colors" title="Per E-Mail senden">
                                                <Icon path={ICONS.email} className="w-5 h-5" />
                                            </button>
                                            <select
                                                value={offer.status}
                                                onChange={(e) => handleStatusChange(offer.id, e.target.value as OfferStatus)}
                                                className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2 outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {Object.values(OfferStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {offers.length === 0 && (
                            <div className="text-center py-12">
                                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                    <Icon path={ICONS.offers} className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Keine Angebote</h3>
                                <p className="text-gray-500 mt-1">Erstellen Sie Ihr erstes Angebot.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <OfferEditor
                    onClose={() => setIsCreating(false)}
                    onSave={handleSaveOffer}
                    clients={clients}
                    companyInfo={companyInfo}
                    existingItems={items}
                    setExistingItems={setItems}
                    lastOfferNumber={getLastOfferNumber()}
                />
            )}
        </div>
    );
};

export default OffersSection;