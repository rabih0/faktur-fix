import React, { useMemo } from 'react';
import { Invoice, Client, CompanyInfo, InvoiceStatus, Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

interface ReportsSectionProps {
    invoices: Invoice[];
    expenses: Expense[];
    clients: Client[];
    companyInfo: CompanyInfo;
}

const BarChart: React.FC<{ data: { label: string; value: number }[], color: string, currency: string }> = ({ data, color, currency }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    const hasNegative = minValue < 0;

    const getBarHeight = (value: number) => {
        if (hasNegative) {
            if (value >= 0) return (value / (maxValue > 0 ? maxValue : 1)) * 50;
            return (Math.abs(value) / (minValue < 0 ? Math.abs(minValue) : 1)) * 50;
        }
        return (value / (maxValue > 0 ? maxValue : 1)) * 100
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className={`relative flex justify-between items-end h-72 border-l border-gray-200 pl-4 pb-4 ${hasNegative ? 'border-t' : 'border-b'}`}>
                {hasNegative && <div className="absolute top-1/2 left-2 right-0 border-t border-dashed border-red-400 w-full"></div>}
                {data.map((d, i) => (
                    <div key={i} className={`flex-1 flex flex-col items-center h-full px-2 group ${hasNegative ? 'justify-center' : 'justify-end'}`}>
                        <div className="text-sm font-bold text-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {d.value.toFixed(2)} {currency}
                        </div>
                        <div
                            className={`w-full rounded-md transition-all duration-300 ${d.value >= 0 ? 'self-end' : 'self-start'}`}
                            style={{
                                height: `${getBarHeight(d.value)}%`,
                                backgroundColor: d.value >= 0 ? color : '#ef4444' // red-500
                            }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TopList: React.FC<{ data: { label: string, value: number }[], title: string, currency: string }> = ({ data, title, currency }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-black mb-4">{title}</h3>
        <ul className="space-y-3">
            {data.map((item, index) => (
                <li key={index} className="flex justify-between items-center text-black">
                    <span className="truncate pr-4">{index + 1}. {item.label}</span>
                    <span className="font-semibold whitespace-nowrap">{item.value.toFixed(2)} {currency}</span>
                </li>
            ))}
            {data.length === 0 && <p className="text-gray-500">Nicht genügend Daten vorhanden.</p>}
        </ul>
    </div>
);

const ReportsSection: React.FC<ReportsSectionProps> = ({ invoices, expenses, clients, companyInfo }) => {

    const paidInvoices = useMemo(() => invoices.filter(inv => inv.status === InvoiceStatus.Paid), [invoices]);
    const monthNames = useMemo(() => ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"], []);

    const getMonthKey = (date: Date) => `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

    const lastSixMonthsKeys = useMemo(() => {
        const keys: string[] = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            keys.push(getMonthKey(date));
        }
        return keys;
    }, [monthNames]);

    const monthlyData = useMemo(() => {
        const data: { [key: string]: { revenue: number, expense: number } } = {};
        lastSixMonthsKeys.forEach(key => data[key] = { revenue: 0, expense: 0 });

        paidInvoices.forEach(inv => {
            const date = new Date(inv.date);
            const monthKey = getMonthKey(date);
            if (data[monthKey]) {
                const total = inv.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 + inv.taxRate / 100);
                data[monthKey].revenue += total;
            }
        });

        expenses.forEach(exp => {
            const date = new Date(exp.date);
            const monthKey = getMonthKey(date);
            if (data[monthKey]) {
                data[monthKey].expense += exp.amount;
            }
        });

        return lastSixMonthsKeys.map(key => ({
            label: key,
            revenue: data[key].revenue,
            expense: data[key].expense,
            profit: data[key].revenue - data[key].expense
        }));
    }, [paidInvoices, expenses, lastSixMonthsKeys]);


    const topClients = useMemo(() => {
        const clientRevenue: { [clientId: string]: number } = {};
        paidInvoices.forEach(inv => {
            const total = inv.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 + inv.taxRate / 100);
            clientRevenue[inv.clientId] = (clientRevenue[inv.clientId] || 0) + total;
        });

        return Object.entries(clientRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([clientId, value]) => {
                const client = clients.find(c => c.id === clientId);
                return { label: client?.name || 'Unbekannter Kunde', value };
            });
    }, [paidInvoices, clients]);

    const expenseByCategory = useMemo(() => {
        const categoryTotals: { [category: string]: number } = {};
        EXPENSE_CATEGORIES.forEach(cat => categoryTotals[cat] = 0);

        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        return Object.entries(categoryTotals)
            .filter(([, value]) => value > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value }));
    }, [expenses]);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-black mb-8">Berichte & Analysen</h1>

            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-bold text-black mb-4">Gewinn/Verlust (Letzte 6 Monate)</h2>
                    <BarChart data={monthlyData.map(d => ({ label: d.label, value: d.profit }))} color={companyInfo.primaryColor || '#3b82f6'} currency={companyInfo.currency} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TopList data={topClients} title="Top 5 Kunden (nach Umsatz)" currency={companyInfo.currency} />
                    <TopList data={expenseByCategory} title="Ausgaben nach Kategorie" currency={companyInfo.currency} />
                </div>
            </div>
        </div>
    );
};

export default ReportsSection;