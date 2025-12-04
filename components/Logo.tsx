import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Speed Lines */}
        <path d="M1 10h3" />
        <path d="M1 13h4" />
        <path d="M1 16h2" />
        {/* Wheels */}
        <circle cx="8" cy="18" r="2" />
        <circle cx="19" cy="18" r="2" />
        {/* Truck Cab */}
        <path d="M17 18h4v-7l-3-4h-5z" />
        {/* Document replacing truck bed */}
        <path d="M6 18V9a1 1 0 0 1 1-1h4l3 3v7" />
        <path d="M11 9v3h3" />
        {/* Dollar Sign */}
        <path d="M10.5 11H9.3a.5.5 0 1 1 0-1h2.4a.5.5 0 1 0 0-1H9.3a.5.5 0 1 1 0-1" />
        <path d="M10 8.5v4" />
    </svg>
);

export default Logo;