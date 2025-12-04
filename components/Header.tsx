import React from 'react';

const MaterialIcon: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
    <span className={`material-symbols-rounded ${className}`} style={{ fontVariationSettings: '"FILL" 1' }}>
        {name}
    </span>
);

const Header: React.FC = () => {
    return (
        <header className="bg-white border-b border-gray-200 px-4 py-3 md-surface">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                    <MaterialIcon name="receipt_long" className="text-white text-2xl" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Faktur-Fix</h1>
            </div>
        </header>
    );
};

export default Header;