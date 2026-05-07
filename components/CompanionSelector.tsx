import React from 'react';
import { Companion } from '../types';

interface CompanionSelectorProps {
  companions: Companion[];
  selectedCompanion: Companion;
  onSelect: (companion: Companion) => void;
  onClose: () => void;
}

const CompanionSelector: React.FC<CompanionSelectorProps> = ({ companions, selectedCompanion, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-main rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 border border-white/10" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-br from-accent-light to-accent">
          Choose Your Companion
        </h2>
        <div className="space-y-3">
          {companions.map((companion) => {
            return (
              <button
                key={companion.id}
                onClick={() => {
                    onSelect(companion);
                    onClose();
                }}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between gap-4 ${
                  selectedCompanion.id === companion.id
                    ? 'bg-[#1a1c4a]/50 border-accent ring-2 ring-accent/50'
                    : 'bg-white/5 border-gray-700 hover:border-accent hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full bg-accent`}></div>
                  <div>
                    <h3 className={`font-semibold text-lg text-gray-100`}>
                      {companion.name} <span className="text-sm font-normal text-gray-500">({companion.gender})</span>
                    </h3>
                    <p className={`text-sm text-gray-400`}>{companion.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompanionSelector;
