import React from 'react';
import { SuggestionType } from '../types';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { StructureIcon } from './icons/StructureIcon';
import { NextLineIcon } from './icons/NextLineIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { ChordsIcon } from './icons/ChordsIcon';
import { RhymeIcon } from './icons/RhymeIcon';
import { ReviewIcon } from './icons/ReviewIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { User as UserIcon, Video as VideoIcon, Music as MusicIcon } from 'lucide-react';

interface SuggestionControlsProps {
  onSuggestionSelect: (type: SuggestionType) => void;
  isLoading: boolean;
  selectedType: SuggestionType | null;
}

const suggestionOptions = [
  { type: SuggestionType.NEXT_LINES, icon: <NextLineIcon className="w-5 h-5" /> },
  { type: SuggestionType.MELODY, icon: <MusicNoteIcon className="w-5 h-5" /> },
  { type: SuggestionType.CHORDS, icon: <ChordsIcon className="w-5 h-5" /> },
  { type: SuggestionType.STRUCTURE, icon: <StructureIcon className="w-5 h-5" /> },
  { type: SuggestionType.RHYMES, icon: <RhymeIcon className="w-5 h-5" /> },
  { type: SuggestionType.REVIEW, icon: <ReviewIcon className="w-5 h-5" /> },
  { type: SuggestionType.ORIGINALITY_CHECK, icon: <ShieldCheckIcon className="w-5 h-5" /> },
  { type: SuggestionType.STYLE_MIMIC, icon: <UserIcon className="w-5 h-5" /> },
  { type: SuggestionType.TIKTOK_HOOK, icon: <VideoIcon className="w-5 h-5" /> },
  { type: SuggestionType.GENERATE_SONG, icon: <MusicIcon className="w-5 h-5" /> },
];

const SuggestionButton = ({ type, icon, onClick, disabled, isActive = false }: {
  type: SuggestionType;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  isActive?: boolean;
  key?: any;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-left px-4 py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-3 shadow-md ${
      isActive
        ? 'bg-gradient-to-br from-purple-500 to-pink-500 hover:filter-brightness-125'
        : 'bg-white/10 hover:bg-white/20'
    }`}
  >
    {icon}
    <span>{type}</span>
  </button>
);

const SuggestionControls: React.FC<SuggestionControlsProps> = ({ onSuggestionSelect, isLoading, selectedType }) => {
  return (
    <div className="bg-white/5 rounded-xl p-4 shadow-lg">
        <h2 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
            <SparkleIcon className="w-6 h-6 text-purple-400"/>
            AI Suggestions
        </h2>
        <div className="grid grid-cols-2 gap-3">
            <SuggestionButton
                type={SuggestionType.IMPROVE}
                icon={<MagicWandIcon className="w-5 h-5" />}
                onClick={() => onSuggestionSelect(SuggestionType.IMPROVE)}
                disabled={isLoading}
                isActive={selectedType === SuggestionType.IMPROVE}
            />
            {suggestionOptions.map(({ type, icon }) => (
                <SuggestionButton
                    key={type}
                    type={type}
                    icon={icon}
                    onClick={() => onSuggestionSelect(type)}
                    disabled={isLoading}
                    isActive={selectedType === type}
                />
            ))}
        </div>
    </div>
  );
};

export default SuggestionControls;