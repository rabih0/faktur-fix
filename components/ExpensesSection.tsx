import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import Icon from './Icon';
import { ICONS } from '../constants/icons';

interface ExpensesSectionProps {
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const ExpenseForm: React.FC<{
    expense: Expense | null;
    onSave: (expense: Expense) => void;
    onCancel: () => void;
}> = ({ expense, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
        date: expense?.date || new Date().toISOString().split('T')[0],
        description: expense?.description || '',
        amount: expense?.amount || 0,
        category: expense?.category || EXPENSE_CATEGORIES[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0) {
            alert("Betrag muss größer als 0 sein.");
            return;
        }
        onSave({
            ...formData,
            id: expense?.id || Date.now().toString(),
            amount: formData.amount
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-black mb-4">{expense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-black">Beschreibung</label>
                    <input id="description" name="description" value={formData.description} onChange={handleChange} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" required />
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-black">Betrag</label>
                    <input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" required />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-black">Datum</label>
                    <input id="date" name="date" type="date" value={formData.date} onChange={handleChange} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" required />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="category" className="block text-sm font-medium text-black">Kategorie</label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} className="mt-1 p-2 bg-gray-200 rounded w-full text-black" required>
                        {EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Abbrechen</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">Speichern</button>
            </div>
        </form>
    );
};

const ExpensesSection: React.FC<ExpensesSectionProps> = ({ expenses, setExpenses }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = (expense: Expense) => {
        if (expenses.some(e => e.id === expense.id)) {
            setExpenses(expenses.map(e => (e.id === expense.id ? expense : e)));
        } else {
            setExpenses([...expenses, expense]);
        }
        setShowForm(false);
        setEditingExpense(null);
    };

    const handleAddNew = () => {
        setEditingExpense(null);
        setShowForm(true);
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        setExpenses(expenses.filter(e => e.id !== id));
    };

    const filteredExpenses = useMemo(() =>
        expenses.filter(expense =>
            expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.category.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        , [expenses, searchTerm]);

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-black">Ausgaben</h1>
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
                        placeholder="Ausgaben suchen..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-500 focus:ring-violet-500 focus:border-violet-500"
                    />
                </div>
            )}

            {showForm && (
                <ExpenseForm
                    expense={editingExpense}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditingExpense(null); }}
                />
            )}

            <div className="space-y-4">
                {filteredExpenses.map(expense => (
                    <div key={expense.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-black">{expense.description}</p>
                            <p className="text-sm text-gray-600">{new Date(expense.date).toLocaleDateString('de-DE')} | {expense.category}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="font-bold text-lg text-red-600">-{expense.amount.toFixed(2)} €</p>
                            <button onClick={() => handleEdit(expense)} className="p-2 text-black hover:text-violet-600" title="Bearbeiten">
                                <Icon path={ICONS.pencil} className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDelete(expense.id)} className="p-2 text-black hover:text-red-600" title="Löschen">
                                <Icon path={ICONS.trash} className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpensesSection;
