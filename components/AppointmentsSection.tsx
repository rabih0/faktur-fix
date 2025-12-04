import React, { useState } from 'react';
import { Appointment, Client } from '../types';
import Icon from './Icon';
import { ICONS } from '../constants/icons';

interface AppointmentsSectionProps {
    appointments: Appointment[];
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    clients: Client[];
}

const AppointmentForm: React.FC<{
    appointment: Appointment | null;
    clients: Client[];
    onSave: (appointment: Appointment) => void;
    onCancel: () => void;
}> = ({ appointment, clients, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Appointment>(
        appointment || {
            id: '',
            clientId: clients[0]?.id || '',
            title: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '10:00',
            notes: ''
        }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-black mb-4">{appointment?.id ? 'Termin bearbeiten' : 'Neuer Termin'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-black">Titel</label>
                    <input id="title" name="title" value={formData.title} onChange={handleChange} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" required />
                </div>
                <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-black">Kunde</label>
                    <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" required>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-black">Datum</label>
                    <input id="date" name="date" type="date" value={formData.date} onChange={handleChange} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" required />
                </div>
                 <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-black">Startzeit</label>
                    <input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleChange} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" required />
                </div>
                <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-black">Endzeit</label>
                    <input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleChange} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" required />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-black">Notizen (Optional)</label>
                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Abbrechen</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">Speichern</button>
            </div>
        </form>
    );
};

const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({ appointments, setAppointments, clients }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    
    const handleSave = (appointment: Appointment) => {
        if (appointment.id) {
            setAppointments(appointments.map(a => a.id === appointment.id ? appointment : a));
        } else {
            setAppointments([...appointments, { ...appointment, id: Date.now().toString() }]);
        }
        setShowForm(false);
        setEditingAppointment(null);
    };

    const handleAddNew = () => {
        setEditingAppointment(null); // So the form knows it's a new one
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        setAppointments(appointments.filter(a => a.id !== id));
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };
    
    const sortedAppointments = [...appointments].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
    });

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-black">Termine</h1>
                {!showForm && (
                     <button onClick={handleAddNew} className="px-4 py-2 bg-black text-white rounded-md shadow hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <Icon path={ICONS.plus} className="w-5 h-5"/>
                        <span>Neu</span>
                    </button>
                )}
            </div>

            {showForm && (
                <AppointmentForm 
                    appointment={editingAppointment}
                    clients={clients}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditingAppointment(null); }}
                />
            )}
            
            <div className="space-y-4">
                {sortedAppointments.map(appointment => {
                    const client = clients.find(c => c.id === appointment.clientId);
                    return (
                        <div key={appointment.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <button onClick={() => toggleExpand(appointment.id)} className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p className="font-semibold text-black">{appointment.title}</p>
                                    <p className="text-sm text-gray-600">{client?.name || 'Unbekannt'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-black">{new Date(appointment.date).toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                                    <p className="text-sm text-gray-600">{appointment.startTime} - {appointment.endTime}</p>
                                </div>
                            </button>
                            {expandedId === appointment.id && (
                                <div className="p-4 border-t border-gray-200 animate-fade-in-down">
                                    <h3 className="font-semibold text-black mb-2">Notizen:</h3>
                                    <p className="text-black whitespace-pre-wrap">{appointment.notes || 'Keine Notizen vorhanden.'}</p>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button onClick={() => { setEditingAppointment(appointment); setShowForm(true); }} className="p-2 text-black hover:text-violet-600" title="Bearbeiten">
                                            <Icon path={ICONS.pencil} className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(appointment.id)} className="p-2 text-black hover:text-red-600" title="Löschen">
                                            <Icon path={ICONS.trash} className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
                 {appointments.length === 0 && <p className="text-center text-black mt-8">Noch keine Termine erstellt.</p>}
            </div>
        </div>
    );
};

export default AppointmentsSection;