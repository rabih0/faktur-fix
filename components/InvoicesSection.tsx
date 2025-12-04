import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Invoice, Client, CompanyInfo, InvoiceItem, InvoiceStatus, RecurringInvoice } from '../types';
import InvoicePreview from './InvoicePreview';
import EmailComposerModal from './EmailComposerModal';
import { generateTasksForMovingAndCleaning } from '../services/geminiService';
import Icon from './Icon';
import { ICONS } from '../constants/icons';

// @ts-ignore
const jspdf = window.jspdf;
// @ts-ignore
const html2canvas = window.html2canvas;


interface InvoicesSectionProps {
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    recurringInvoices: RecurringInvoice[];
    setRecurringInvoices: React.Dispatch<React.SetStateAction<RecurringInvoice[]>>;
    clients: Client[];
    companyInfo: CompanyInfo;
    items: InvoiceItem[];
    setItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
}

const InvoiceEditor: React.FC<{
    onClose: () => void;
    onSave: (invoice: Invoice) => void;
    clients: Client[];
    companyInfo: CompanyInfo;
    existingItems: InvoiceItem[];
    setExistingItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
    lastInvoiceNumber: number;
}> = ({ onClose, onSave, clients, companyInfo, existingItems, setExistingItems, lastInvoiceNumber }) => {
    const [invoice, setInvoice] = useState<Invoice>({
        id: Date.now().toString(),
        invoiceNumber: `${companyInfo.invoiceNumberPrefix}${(lastInvoiceNumber + 1).toString()}`,
        clientId: clients[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
        items: [],
        taxRate: companyInfo.defaultTaxRate,
        status: InvoiceStatus.Draft,
    });
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<InvoiceItem | null>(null);

    const invoicePreviewRef = useRef<HTMLDivElement>(null);
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        if (navigator.share && navigator.canShare) {
            setCanShare(true);
        }
    }, []);

    const handleGeneratePDF = () => {
        const input = invoicePreviewRef.current;
        if (!input) return;

        html2canvas(input, {
            scale: 2,
            windowWidth: 1200
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Rechnung-${invoice.invoiceNumber}.pdf`);
        });
    };

    const handleSharePDF = async () => {
        const input = invoicePreviewRef.current;
        if (!input) return;

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const pdf = new jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const pdfBlob = pdf.output('blob');
            const pdfFile = new File([pdfBlob], `Rechnung-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    title: `Rechnung ${invoice.invoiceNumber}`,
                    text: `Anbei die Rechnung ${invoice.invoiceNumber}`,
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
        setInvoice(prev => ({ ...prev, items: [...prev.items, { ...item, id: Date.now().toString() }] }));
    };

    const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...invoice.items];
        (newItems[index] as any)[field] = value;
        setInvoice(prev => ({ ...prev, items: newItems }));
    };

    const handleRemoveItem = (index: number) => {
        setInvoice(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
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

        const newItems = [...invoice.items];
        const [draggedItem] = newItems.splice(draggedItemIndex, 1);
        newItems.splice(dropIndex, 0, draggedItem);

        setInvoice(prev => ({ ...prev, items: newItems }));
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


    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const tax = subtotal * (invoice.taxRate / 100);
    const total = subtotal + tax;

    if (showPreview) {
        const selectedClient = clients.find(c => c.id === invoice.clientId);
        return (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex flex-col p-4 items-center">
                <div className="w-full flex-1 overflow-auto mb-24 flex justify-center items-start pt-4">
                    {selectedClient && (
                        <InvoicePreview ref={invoicePreviewRef} invoice={invoice} client={selectedClient} companyInfo={companyInfo} />
                    )}
                </div>
                <div className="absolute bottom-[5rem] flex justify-center gap-2">
                    <button onClick={() => setShowPreview(false)} className="px-5 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-colors">Schließen</button>
                    {canShare &&
                        <button onClick={handleSharePDF} className="px-5 py-2 bg-fuchsia-600 text-white rounded-lg shadow-md hover:bg-fuchsia-700 transition-colors">Teilen</button>
                    }
                    <button onClick={handleGeneratePDF} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors">PDF</button>
                    <button onClick={() => { onSave(invoice); setShowPreview(false); }} className="px-5 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors">Speichern</button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-black">Neue Rechnung</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <label htmlFor="invoice-clientId" className="block text-sm font-medium text-black">Kunde</label>
                    <select id="invoice-clientId" value={invoice.clientId} onChange={e => setInvoice(prev => ({ ...prev, clientId: e.target.value }))} className="mt-1 w-full bg-gray-200 p-2 rounded text-black">
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="invoice-invoiceNumber" className="block text-sm font-medium text-black">Rechnungsnummer</label>
                    <input id="invoice-invoiceNumber" type="text" value={invoice.invoiceNumber} onChange={e => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))} className="mt-1 w-full bg-gray-200 p-2 rounded text-black" />
                </div>
                <div>
                    <label htmlFor="invoice-date" className="block text-sm font-medium text-black">Datum</label>
                    <input id="invoice-date" type="date" value={invoice.date} onChange={e => setInvoice(prev => ({ ...prev, date: e.target.value }))} className="mt-1 w-full bg-gray-200 p-2 rounded text-black" />
                </div>
                <div>
                    <label htmlFor="invoice-dueDate" className="block text-sm font-medium text-black">Fällig am</label>
                    <input id="invoice-dueDate" type="date" value={invoice.dueDate} onChange={e => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))} className="mt-1 w-full bg-gray-200 p-2 rounded text-black" />
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-black">Positionen</h3>
                <div className="space-y-2">
                    {invoice.items.map((item, index) => (
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
                <p className="text-sm text-gray-600 mb-4">Fügen Sie Positionen aus Ihrer Vorlagen-Liste zur Rechnung hinzu oder verwalten Sie die Liste.</p>
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
                    <label htmlFor="invoice-taxRate" className="flex justify-between items-center">
                        <span>MwSt. (%):</span>
                        <input id="invoice-taxRate" type="number" value={invoice.taxRate} onChange={e => setInvoice(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))} className="w-20 bg-gray-200 p-1 rounded text-right text-black" />
                    </label>
                    <div className="flex justify-between"><span>MwSt.-Betrag:</span><span>{tax.toFixed(2)} {companyInfo.currency}</span></div>
                    <div className="flex justify-between font-bold text-xl"><span >Gesamt:</span><span>{total.toFixed(2)} {companyInfo.currency}</span></div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-8 border-t pt-4">
                <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Schließen</button>
                <button onClick={() => setShowPreview(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Vorschau & PDF</button>
                <button onClick={() => onSave(invoice)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Speichern</button>
            </div>
        </div>
    );
};

const getInvoiceStatusColor = (status: InvoiceStatus) => {
    switch (status) {
        case InvoiceStatus.Draft: return 'bg-gray-200 text-gray-800';
        case InvoiceStatus.Sent: return 'bg-blue-200 text-blue-800';
        case InvoiceStatus.Paid: return 'bg-green-200 text-green-800';
        case InvoiceStatus.Overdue: return 'bg-red-200 text-red-800';
        default: return 'bg-gray-200 text-gray-800';
    }
};

const RecurringInvoicesManager: React.FC<{
    recurringInvoices: RecurringInvoice[],
    setRecurringInvoices: React.Dispatch<React.SetStateAction<RecurringInvoice[]>>,
    clients: Client[],
    companyInfo: CompanyInfo
}> = ({ recurringInvoices, setRecurringInvoices, clients, companyInfo }) => {
    // Basic component structure, can be expanded
    const [isCreating, setIsCreating] = useState(false);

    const handleSave = (recInvoice: RecurringInvoice) => {
        if (recInvoice.id) {
            setRecurringInvoices(prev => prev.map(r => r.id === recInvoice.id ? recInvoice : r));
        } else {
            setRecurringInvoices(prev => [...prev, { ...recInvoice, id: Date.now().toString() }]);
        }
        setIsCreating(false);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">Abo-Rechnungen</h2>
                <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-black text-white rounded-md shadow hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <Icon path={ICONS.plus} className="w-5 h-5" />
                    <span>Neues Abo</span>
                </button>
            </div>
            {/* Form for new/edit will go here */}

            <div className="space-y-4">
                {recurringInvoices.map(rec => {
                    const client = clients.find(c => c.id === rec.clientId);
                    return (
                        <div key={rec.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                            <div>
                                <p className="font-bold text-black">{rec.title}</p>
                                <p className="text-sm text-black">An: {client?.name}</p>
                                <p className="text-sm text-gray-600">Nächste Fälligkeit: {new Date(rec.nextDueDate).toLocaleDateString('de-DE')}</p>
                            </div>
                            <div>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${rec.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                    {rec.isActive ? 'Aktiv' : 'Pausiert'}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


const InvoicesSection: React.FC<InvoicesSectionProps> = ({ invoices, setInvoices, recurringInvoices, setRecurringInvoices, clients, companyInfo, items, setItems }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'invoices' | 'recurring'>('invoices');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null);
    const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
    const listInvoicePreviewRef = useRef<HTMLDivElement>(null);

    const handleSaveInvoice = (invoice: Invoice) => {
        setInvoices(prev => [...prev.filter(i => i.id !== invoice.id), invoice]);
        setIsCreating(false);
    };

    const handleStatusChange = (invoiceId: string, status: InvoiceStatus) => {
        setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, status } : inv));
    };

    const handleOpenEmailModal = (invoice: Invoice) => {
        setSelectedInvoiceForEmail(invoice);
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = () => {
        if (selectedInvoiceForEmail) {
            handleStatusChange(selectedInvoiceForEmail.id, InvoiceStatus.Sent);
        }
        setIsEmailModalOpen(false);
        setSelectedInvoiceForEmail(null);
    };

    const handleGenerateListPDF = () => {
        const input = listInvoicePreviewRef.current;
        if (!input || !previewInvoice) return;

        html2canvas(input, {
            scale: 2,
            windowWidth: 1200
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Rechnung-${previewInvoice.invoiceNumber}.pdf`);
        });
    };


    const getLastInvoiceNumber = () => {
        if (invoices.length === 0) return 0;
        const numbers = invoices
            .map(i => parseInt(i.invoiceNumber.replace(companyInfo.invoiceNumberPrefix, ''), 10))
            .filter(n => !isNaN(n));
        return Math.max(0, ...numbers);
    };

    const filteredInvoices = useMemo(() => invoices.filter(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
            invoice.invoiceNumber.toLowerCase().includes(lowerSearchTerm) ||
            client?.name.toLowerCase().includes(lowerSearchTerm)
        );
    }), [invoices, clients, searchTerm]);

    const TabButton: React.FC<{ tab: 'invoices' | 'recurring', label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab
                ? 'bg-white text-black border-b-2 border-violet-500'
                : 'text-gray-500 hover:text-black'
                }`}
        >
            {label}
        </button>
    )

    const selectedClientForEmail = clients.find(c => c.id === selectedInvoiceForEmail?.clientId);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {isEmailModalOpen && selectedInvoiceForEmail && selectedClientForEmail && (
                <EmailComposerModal
                    show={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    recipientEmail={selectedClientForEmail.email}
                    subject={`Rechnung ${selectedInvoiceForEmail.invoiceNumber} von ${companyInfo.name}`}
                    body={`Sehr geehrte/r ${selectedClientForEmail.name},\n\nanbei erhalten Sie Ihre Rechnung ${selectedInvoiceForEmail.invoiceNumber}.\n\n(Die PDF wird bei einem echten E-Mail-Versand automatisch angehängt.)\n\n${companyInfo.emailSignature || ''}`}
                    onSend={handleSendEmail}
                />
            )}
            {previewInvoice && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex flex-col p-4 items-center">
                    <div className="w-full flex-1 overflow-auto mb-24 flex justify-center items-start pt-4">
                        <InvoicePreview
                            ref={listInvoicePreviewRef}
                            invoice={previewInvoice}
                            client={clients.find(c => c.id === previewInvoice.clientId)!}
                            companyInfo={companyInfo}
                        />
                    </div>
                    <div className="absolute bottom-[5rem] flex justify-center gap-2">
                        <button onClick={() => setPreviewInvoice(null)} className="px-5 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-colors">Schließen</button>
                        <button onClick={handleGenerateListPDF} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors">PDF Drucken / Speichern</button>
                    </div>
                </div>
            )}
            {!isCreating ? (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-black">Rechnungen</h1>
                        <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-black text-white rounded-md shadow hover:bg-gray-800 transition-colors flex items-center gap-2">
                            <Icon path={ICONS.plus} className="w-5 h-5" />
                            <span>Neue Rechnung</span>
                        </button>
                    </div>

                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            <TabButton tab="invoices" label="Alle Rechnungen" />
                            <TabButton tab="recurring" label="Abo-Rechnungen" />
                        </nav>
                    </div>

                    {activeTab === 'invoices' && (
                        <div className="animate-fade-in">
                            <div className="mb-6">
                                <input
                                    type="text"
                                    placeholder="Rechnungen suchen (Nr. oder Kunde)..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-500 focus:ring-violet-500 focus:border-violet-500"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {filteredInvoices.sort((a, b) => parseInt(b.invoiceNumber.replace(companyInfo.invoiceNumberPrefix, '')) - parseInt(a.invoiceNumber.replace(companyInfo.invoiceNumberPrefix, ''))).map(invoice => {
                                    const client = clients.find(c => c.id === invoice.clientId);
                                    const total = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0) * (1 + invoice.taxRate / 100);

                                    let effectiveStatus = invoice.status;
                                    if (invoice.status === InvoiceStatus.Sent && new Date(invoice.dueDate) < new Date()) {
                                        effectiveStatus = InvoiceStatus.Overdue;
                                    }

                                    return (
                                        <div key={invoice.id} className="glass-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-blue-300 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <Icon path={ICONS.invoices} className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-lg">#{invoice.invoiceNumber}</p>
                                                    <p className="text-sm text-gray-500">{client?.name || 'Unbekannt'} • {new Date(invoice.date).toLocaleDateString('de-DE')}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-right">
                                                    <p className="font-bold text-xl text-gray-800">{total.toFixed(2)} {companyInfo.currency}</p>
                                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full inline-block mt-1 ${getInvoiceStatusColor(effectiveStatus)}`}>
                                                        {effectiveStatus}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setPreviewInvoice(invoice)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-full transition-colors" title="Vorschau & Drucken">
                                                        <Icon path={ICONS.upload} className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleOpenEmailModal(invoice)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-full transition-colors" title="Per E-Mail senden">
                                                        <Icon path={ICONS.email} className="w-5 h-5" />
                                                    </button>
                                                    <select
                                                        value={invoice.status}
                                                        onChange={(e) => handleStatusChange(invoice.id, e.target.value as InvoiceStatus)}
                                                        className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {invoices.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                            <Icon path={ICONS.invoices} className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Keine Rechnungen</h3>
                                        <p className="text-gray-500 mt-1">Erstellen Sie Ihre erste Rechnung, um loszulegen.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'recurring' && (
                        <div className="animate-fade-in">
                            <RecurringInvoicesManager
                                recurringInvoices={recurringInvoices}
                                setRecurringInvoices={setRecurringInvoices}
                                clients={clients}
                                companyInfo={companyInfo}
                            />
                        </div>
                    )}
                </>
            ) : (
                <InvoiceEditor
                    onClose={() => setIsCreating(false)}
                    onSave={handleSaveInvoice}
                    clients={clients}
                    companyInfo={companyInfo}
                    existingItems={items}
                    setExistingItems={setItems}
                    lastInvoiceNumber={getLastInvoiceNumber()}
                />
            )
            }
        </div >
    );
};

export default InvoicesSection;