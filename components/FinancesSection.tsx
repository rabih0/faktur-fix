import React, { useState } from 'react';
import { Expense, Invoice, Client, CompanyInfo } from '../types';
import ExpensesSection from './ExpensesSection';
import ReportsSection from './ReportsSection';

interface FinancesSectionProps {
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    invoices: Invoice[];
    clients: Client[];
    companyInfo: CompanyInfo;
}

const FinancesSection: React.FC<FinancesSectionProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'expenses' | 'reports'>('expenses');

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-2 sticky top-0 z-10">
                <nav className="flex gap-2" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'expenses'
                                ? 'bg-rose-100 text-rose-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                            shopping_cart
                        </span>
                        Ausgaben
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'reports'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <span className="material-symbols-rounded text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                            bar_chart
                        </span>
                        Berichte & Statistik
                    </button>
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
                {activeTab === 'expenses' ? (
                    <ExpensesSection expenses={props.expenses} setExpenses={props.setExpenses} />
                ) : (
                    <ReportsSection
                        invoices={props.invoices}
                        expenses={props.expenses}
                        clients={props.clients}
                        companyInfo={props.companyInfo}
                    />
                )}
            </div>
        </div>
    );
};

export default FinancesSection;
