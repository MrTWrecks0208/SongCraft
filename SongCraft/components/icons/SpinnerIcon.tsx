
import React from 'react';

export const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <style>
        {`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}
    </style>
    <path
      className="opacity-25"
      d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"
      fill="currentColor"
    />
    <path
      style={{ animation: 'spin 1s linear infinite' }}
      className="opacity-75"
      d="M20.47 13.53a.75.75 0 00-1.06-1.06l-1.06 1.06a8 8 0 01-11.72 0l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06a10 10 0 0014.84 0l1.06-1.06z"
      fill="currentColor"
    />
  </svg>
);
