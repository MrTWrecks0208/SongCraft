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
      <div className="bg-[#1d2951] rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Choose Your Companion
        </h2>
        <div className="space-y-3">
          {companions.map((companion) => (
            <button
              key={companion.id}
              onClick={() => {
                  onSelect(companion);
                  onClose();
              }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4 ${
                selectedCompanion.id === companion.id
                  ? 'bg-[#1d2951]/20 border-purple-500 ring-2 ring-purple-500'
                  : 'bg-white/5 border-gray-700 hover:border-purple-600 hover:bg-white/10'
              }`}
            >
              <div className="flex-shrink-0 w-3 h-3 rounded-full bg-[#1d2951]"></div>
              <div>
                <h3 className="font-semibold text-lg text-gray-100">{companion.name} <span className="text-sm font-normal text-gray-400">({companion.gender})</span></h3>
                <p className="text-sm text-gray-400">{companion.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanionSelector;
