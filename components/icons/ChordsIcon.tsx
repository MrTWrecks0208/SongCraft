import React from 'react';

export const ChordsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg id="Icons" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" stroke="currentColor" {...props}>
        <ellipse cx="24" cy="22" rx="4" ry="3" fill="none" strokeWidth="2" strokeLinejoin="round" strokeMiterlimit="10" />
        <ellipse cx="8" cy="25" rx="4" ry="3" fill="none" strokeWidth="2" strokeLinejoin="round" strokeMiterlimit="10" />
        <polyline points="12,25 12,7 28,4 28,22" fill="none" strokeWidth="2" strokeLinejoin="round" strokeMiterlimit="10" />
        <line x1="12" y1="12" x2="28" y2="9" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" />
    </svg>
);
