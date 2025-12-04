import React from 'react';
import { Section } from '../types';

interface BottomNavProps {
    activeSection: Section;
    setActiveSection: (section: Section) => void;
}

const MaterialIcon: React.FC<{ name: string; className?: string; filled?: boolean }> = ({ name, className = '', filled = true }) => (
    <span className={`material-symbols-rounded ${filled ? 'material-symbols-filled' : ''} ${className}`} style={{ fontVariationSettings: filled ? '"FILL" 1' : '"FILL" 0' }}>
        {name}
    </span>
);

const NavItem: React.FC<{
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all min-w-[60px] ${isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
        >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-100' : ''
                }`}>
                <MaterialIcon name={icon} className="text-2xl" filled={isActive} />
            </div>
            <span className={`text-[10px] font-medium transition-all ${isActive ? 'opacity-100' : 'opacity-70'
                }`}>{label}</span>
        </button>
    );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeSection, setActiveSection }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
            <div className="max-w-7xl mx-auto px-2 py-1.5">
                <div className="flex items-center justify-around">
                    <NavItem
                        label="Home"
                        icon="home"
                        isActive={activeSection === Section.Home}
                        onClick={() => setActiveSection(Section.Home)}
                    />
                    <NavItem
                        label="Dokumente"
                        icon="description"
                        isActive={activeSection === Section.Documents}
                        onClick={() => setActiveSection(Section.Documents)}
                    />
                    <NavItem
                        label="Finanzen"
                        icon="account_balance_wallet"
                        isActive={activeSection === Section.Finances}
                        onClick={() => setActiveSection(Section.Finances)}
                    />
                    <NavItem
                        label="Kunden"
                        icon="people"
                        isActive={activeSection === Section.Clients}
                        onClick={() => setActiveSection(Section.Clients)}
                    />
                    <NavItem
                        label="Firma"
                        icon="business"
                        isActive={activeSection === Section.Company}
                        onClick={() => setActiveSection(Section.Company)}
                    />
                </div>
            </div>
        </nav>
    );
};

export default BottomNav;