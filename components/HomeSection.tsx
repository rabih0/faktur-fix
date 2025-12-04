import React from 'react';
import { Appointment, Client, Invoice, Offer, CompanyInfo, InvoiceStatus, OfferStatus, Section } from '../types';

interface HomeSectionProps {
    appointments: Appointment[];
    clients: Client[];
    invoices: Invoice[];
    offers: Offer[];
    companyInfo: CompanyInfo;
    setActiveSection: (section: Section) => void;
}

// Material Symbol Icon Component
const MaterialIcon: React.FC<{ name: string; className?: string; filled?: boolean }> = ({ name, className = '', filled = true }) => (
    <span className={`material-symbols-rounded ${filled ? 'material-symbols-filled' : ''} ${className}`} style={{ fontVariationSettings: filled ? '"FILL" 1' : '"FILL" 0' }}>
        {name}
    </span>
);

const MetricCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                <MaterialIcon name={icon} className="text-white text-2xl" />
            </div>
        </div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
);

const QuickActionButton: React.FC<{ label: string; icon: string; color: string; onClick?: () => void }> = ({ label, icon, color, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all active:scale-95"
    >
        <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center`}>
            <MaterialIcon name={icon} className="text-white text-2xl" />
        </div>
        <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
    </button>
);

const ActivityItem: React.FC<{
    title: string;
    subtitle: string;
    icon: string;
    iconColor: string;
    badge?: string;
    badgeColor?: string;
}> = ({ title, subtitle, icon, iconColor, badge, badgeColor }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
        <div className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0`}>
            <MaterialIcon name={icon} className="text-white text-xl" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        </div>
        {badge && (
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badgeColor}`}>
                {badge}
            </span>
        )}
    </div>
);

const HomeSection: React.FC<HomeSectionProps> = ({ appointments, clients, invoices, offers, companyInfo, setActiveSection }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const revenueThisMonth = invoices
        .filter(inv => inv.status === InvoiceStatus.Paid && new Date(inv.date) >= startOfMonth)
        .reduce((sum, inv) => {
            const total = inv.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0) * (1 + inv.taxRate / 100);
            return sum + total;
        }, 0);

    const outstandingTotal = invoices
        .filter(inv => inv.status === InvoiceStatus.Sent || inv.status === InvoiceStatus.Overdue)
        .reduce((sum, inv) => {
            const total = inv.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0) * (1 + inv.taxRate / 100);
            return sum + total;
        }, 0);

    const openOffersCount = offers.filter(o => o.status === OfferStatus.Draft || o.status === OfferStatus.Sent).length;

    const upcomingAppointments = appointments
        .filter(apt => new Date(apt.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 4);

    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const getInvoiceStatusBadge = (status: InvoiceStatus) => {
        switch (status) {
            case InvoiceStatus.Draft: return { text: 'Entwurf', color: 'bg-gray-100 text-gray-700' };
            case InvoiceStatus.Sent: return { text: 'Gesendet', color: 'bg-blue-100 text-blue-700' };
            case InvoiceStatus.Paid: return { text: 'Bezahlt', color: 'bg-green-100 text-green-700' };
            case InvoiceStatus.Overdue: return { text: 'Überfällig', color: 'bg-red-100 text-red-700' };
            default: return { text: status, color: 'bg-gray-100 text-gray-700' };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 pt-6 pb-8 rounded-b-3xl shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold mb-1">Operations Center</h1>
                            <p className="text-blue-100 text-sm">Hallo Rabih!</p>
                        </div>
                        <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                            <MaterialIcon name="notifications" className="text-white text-xl" />
                        </button>
                    </div>

                    {/* Metrics Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <MetricCard
                            title="Umsatz"
                            value={`${revenueThisMonth.toFixed(0)}€`}
                            icon="payments"
                            color="bg-green-500"
                        />
                        <MetricCard
                            title="Ausstehend"
                            value={`${outstandingTotal.toFixed(0)}€`}
                            icon="schedule"
                            color="bg-amber-500"
                        />
                        <MetricCard
                            title="Angebote"
                            value={openOffersCount}
                            icon="description"
                            color="bg-purple-500"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-4">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MaterialIcon name="bolt" className="text-blue-600 text-xl" />
                        Schnellaktionen
                    </h2>
                    <div className="grid grid-cols-4 gap-3">
                        <QuickActionButton
                            label="Rechnung"
                            icon="receipt_long"
                            color="bg-blue-500"
                            onClick={() => setActiveSection(Section.Documents)}
                        />
                        <QuickActionButton
                            label="Angebot"
                            icon="description"
                            color="bg-purple-500"
                            onClick={() => setActiveSection(Section.Documents)}
                        />
                        <QuickActionButton
                            label="Kunde"
                            icon="person_add"
                            color="bg-green-500"
                            onClick={() => setActiveSection(Section.Clients)}
                        />
                        <QuickActionButton
                            label="Ausgabe"
                            icon="shopping_cart"
                            color="bg-orange-500"
                            onClick={() => setActiveSection(Section.Finances)}
                        />
                    </div>
                </div>

                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MaterialIcon name="event" className="text-blue-600 text-xl" />
                            Anstehende Termine
                        </h2>
                        <div className="space-y-1">
                            {upcomingAppointments.map(apt => {
                                const client = clients.find(c => c.id === apt.clientId);
                                return (
                                    <ActivityItem
                                        key={apt.id}
                                        title={apt.title}
                                        subtitle={`${client?.name || 'Unbekannt'} • ${new Date(apt.date).toLocaleDateString('de-DE')} ${apt.startTime}`}
                                        icon="event"
                                        iconColor="bg-blue-500"
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Recent Invoices */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MaterialIcon name="receipt_long" className="text-blue-600 text-xl" />
                        Letzte Aktivitäten
                    </h2>
                    <div className="space-y-1">
                        {recentInvoices.length > 0 ? (
                            recentInvoices.map(inv => {
                                const client = clients.find(c => c.id === inv.clientId);
                                const badge = getInvoiceStatusBadge(inv.status);
                                return (
                                    <ActivityItem
                                        key={inv.id}
                                        title={`Rechnung #${inv.invoiceNumber}`}
                                        subtitle={client?.name || 'Unbekannt'}
                                        icon="receipt_long"
                                        iconColor="bg-indigo-500"
                                        badge={badge.text}
                                        badgeColor={badge.color}
                                    />
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-8">Keine Aktivitäten</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeSection;
