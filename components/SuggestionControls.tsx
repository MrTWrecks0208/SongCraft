import React, { useState, useRef, useEffect } from 'react';
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
import { Sparkles as SparklesIcon, Video as VideoIcon, Music as MusicIcon, Radio as RadioIcon, Drum as DrumIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface SuggestionControlsProps {
  onSuggestionSelect: (type: SuggestionType) => void;
  isLoading: boolean;
  selectedType: SuggestionType | null;
}

const suggestionGroups = [
  {
    label: "Writing & Structure",
    options: [
      { type: SuggestionType.IMPROVE, icon: <MagicWandIcon className="w-4 h-4" /> },
      { type: SuggestionType.NEXT_LINES, icon: <NextLineIcon className="w-4 h-4" /> },
      { type: SuggestionType.RHYMES, icon: <RhymeIcon className="w-4 h-4" /> },
      { type: SuggestionType.STRUCTURE, icon: <StructureIcon className="w-4 h-4" /> },
      { type: SuggestionType.STYLE_MIMIC, icon: <SparklesIcon className="w-4 h-4" /> },
    ]
  },
  {
    label: "Music & Melody",
    options: [
      { type: SuggestionType.MELODY, icon: <MusicNoteIcon className="w-4 h-4" /> },
      { type: SuggestionType.CHORDS, icon: <ChordsIcon className="w-4 h-4" /> },
      { type: SuggestionType.GENERATE_BEAT, icon: <DrumIcon className="w-4 h-4" /> },
      { type: SuggestionType.GENERATE_SONG, icon: <MusicIcon className="w-4 h-4" /> },
    ]
  },
  {
    label: "Review & Polish",
    options: [
      { type: SuggestionType.REVIEW, icon: <ReviewIcon className="w-4 h-4" /> },
      { type: SuggestionType.ORIGINALITY_CHECK, icon: <ShieldCheckIcon className="w-4 h-4" /> },
      { type: SuggestionType.TIKTOK_HOOK, icon: <VideoIcon className="w-4 h-4" /> },
      { type: SuggestionType.RADIO_READY, icon: <RadioIcon className="w-4 h-4" /> },
    ]
  }
];

const allOptions = suggestionGroups.flatMap(g => g.options);

const SuggestionControls: React.FC<SuggestionControlsProps> = ({ onSuggestionSelect, isLoading, selectedType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<SuggestionType>(SuggestionType.IMPROVE);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeToolInfo = allOptions.find(o => o.type === activeTool) || allOptions[0];

  return (
    <div className="relative w-full" ref={menuRef}>
      <div className="flex gap-2">
        {/* Dropdown Button (Left, ~75% width) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`flex-[2] flex items-center justify-between px-4 py-2 rounded-xl font-bold transition-all border-2 ${
            isOpen 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3 truncate">
            <span className="text-accent-light shrink-0">{activeToolInfo.icon}</span>
            <span className="truncate">{activeToolInfo.type} </span>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 shrink-0 ml-2" /> : <ChevronDown className="w-5 h-5 shrink-0 ml-2" />}
        </button>

        {/* Action Button (Right, ~25% width) */}
        <button
          onClick={() => onSuggestionSelect(activeTool)}
          disabled={isLoading}
          className="flex-[2] flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-accent to-accent-light hover:brightness-110 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
        >
          <SparkleIcon className="w-5 h-5 shrink-0" />
          <span className="hidden sm:inline">Generate</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full sm:w-80 bg-main/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {suggestionGroups.map((group, idx) => (
              <div key={group.label} className={idx > 0 ? "mt-2 pt-2 border-t border-white/5" : ""}>
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {group.label}
                </div>
                {group.options.map(({ type, icon }) => (
                  <button
                    key={type}
                    onClick={() => {
                      setActiveTool(type);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      activeTool === type
                        ? 'bg-accent/20 text-accent-light'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={activeTool === type ? 'text-accent-light' : 'text-gray-400'}>
                      {icon}
                    </span>
                    {type}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionControls;