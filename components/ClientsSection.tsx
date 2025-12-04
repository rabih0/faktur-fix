import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import Icon from './Icon';
import { ICONS } from '../constants/icons';

interface ClientsSectionProps {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

const ClientForm: React.FC<{
    client: Client;
    onSave: (client: Client) => void;
    onCancel: () => void;
}> = ({ client, onSave, onCancel }) => {
    const [formData, setFormData] = useState(client);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-black mb-4">{client.id ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="p-2 bg-gray-200 rounded text-black" required />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="E-Mail" className="p-2 bg-gray-200 rounded text-black" />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Telefon" className="p-2 bg-gray-200 rounded text-black" />
                <input name="address" value={formData.address} onChange={handleChange} placeholder="Adresse" className="p-2 bg-gray-200 rounded text-black" />
                <input name="zip" value={formData.zip} onChange={handleChange} placeholder="PLZ" className="p-2 bg-gray-200 rounded text-black" />
                <input name="city" value={formData.city} onChange={handleChange} placeholder="Stadt" className="p-2 bg-gray-200 rounded text-black" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Abbrechen</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">Speichern</button>
            </div>
        </form>
    );
};

const ClientsSection: React.FC<ClientsSectionProps> = ({ clients, setClients }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = (client: Client) => {
        if (client.id) {
            setClients(clients.map(c => c.id === client.id ? client : c));
        } else {
            setClients([...clients, { ...client, id: Date.now().toString() }]);
        }
        setShowForm(false);
        setEditingClient(null);
    };

    const handleAddNew = () => {
        setEditingClient({ id: '', name: '', address: '', zip: '', city: '', phone: '', email: '' });
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        setClients(clients.filter(c => c.id !== id));
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredClients = useMemo(() =>
        clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.city.toLowerCase().includes(searchTerm.toLowerCase())
        ), [clients, searchTerm]);

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-black">Kunden</h1>
                {!showForm && (
                    <button onClick={handleAddNew} className="px-4 py-2 bg-black text-white rounded-md shadow hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <Icon path={ICONS.plus} className="w-5 h-5" />
                        <span>Neu</span>
                    </button>
                )}
            </div>

            {!showForm && (
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Kunden suchen..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-500 focus:ring-violet-500 focus:border-violet-500"
                    />
                </div>
            )}

            {showForm && editingClient && (
                <ClientForm
                    client={editingClient}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditingClient(null); }}
                />
            )}

            <div className="space-y-4">
                {filteredClients.map(client => (
                    <div key={client.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <button onClick={() => toggleExpand(client.id)} className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50">
                            <span className="font-semibold text-black">{client.name}</span>
                            <Icon path={expandedId === client.id ? ICONS.chevronUp : ICONS.chevronDown} className="w-5 h-5 text-black" />
                        </button>
                        {expandedId === client.id && (
                            <div className="p-4 border-t border-gray-200 animate-fade-in-down">
                                <p className="text-black">{client.address}</p>
                                <p className="text-black">{client.zip} {client.city}</p>
                                <p className="text-black"><strong>Email:</strong> {client.email}</p>
                                <p className="text-black"><strong>Telefon:</strong> {client.phone}</p>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => { setEditingClient(client); setShowForm(true); }} className="p-2 text-black hover:text-violet-600">
                                        <Icon path={ICONS.pencil} className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(client.id)} className="p-2 text-black hover:text-red-600">
                                        <Icon path={ICONS.trash} className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientsSection;