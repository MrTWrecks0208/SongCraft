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
import { Pencil as PencilIcon, Sparkles as SparklesIcon, Music as MusicIcon, Radio as RadioIcon, Drum as DrumIcon, ChevronDown, ChevronUp, Archive as ArchiveIcon, History as HistoryIcon, Scissors as ScissorsIcon, Mic as MicIcon, FileUp as FileUpIcon, User as UserIcon, Search as SearchIcon, Smile as SmileIcon, Sliders as SlidersIcon, Smartphone as SmartphoneIcon } from 'lucide-react';

interface SuggestionControlsProps {
  onSuggestionSelect: (type: SuggestionType) => void;
  isLoading: boolean;
  selectedType: SuggestionType | null;
}

const allOptions = [
  { type: SuggestionType.NEXT_LINES, icon: <NextLineIcon className="w-4 h-4" /> },
  { type: SuggestionType.RHYMES, icon: <RhymeIcon className="w-4 h-4" /> },
  { type: SuggestionType.REVIEW, icon: <ReviewIcon className="w-4 h-4" /> },
  { type: SuggestionType.CHECK_COMMON_PHRASES, icon: <SearchIcon className="w-4 h-4" /> },
  { type: SuggestionType.STRUCTURE, icon: <StructureIcon className="w-4 h-4" /> },
  { type: SuggestionType.SENTIMENT_ANALYSIS, icon: <SmileIcon className="w-4 h-4" /> },
  { type: SuggestionType.PROMPT_TO_LYRICS, icon: <PencilIcon className="w-4 h-4" /> },
  { type: SuggestionType.IMPROVE, icon: <MagicWandIcon className="w-4 h-4" /> },
  { type: SuggestionType.CHORDS, icon: <ChordsIcon className="w-4 h-4" /> },
  { type: SuggestionType.GENERATE_BEAT, icon: <DrumIcon className="w-4 h-4" /> },
  { type: SuggestionType.GENERATE_CLIP, icon: <MusicIcon className="w-4 h-4" /> },
  { type: SuggestionType.EXPORT_ZIP, icon: <ArchiveIcon className="w-4 h-4" /> },
  { type: SuggestionType.STYLE_MIMIC, icon: <SparklesIcon className="w-4 h-4" /> },
  { type: SuggestionType.TONE_SWITCHER, icon: <SlidersIcon className="w-4 h-4" /> },
  { type: SuggestionType.FIT_TO_STYLE, icon: <UserIcon className="w-4 h-4" /> },
  { type: SuggestionType.MELODY, icon: <MusicNoteIcon className="w-4 h-4" /> },
  { type: SuggestionType.MELODY_HARMONIZATION, icon: <MusicNoteIcon className="w-4 h-4" /> },
  { type: SuggestionType.ORIGINALITY_CHECK, icon: <ShieldCheckIcon className="w-4 h-4" /> },
  { type: SuggestionType.VERSION_HISTORY, icon: <HistoryIcon className="w-4 h-4" /> },
  { type: SuggestionType.STEM_SPLITTER, icon: <ScissorsIcon className="w-4 h-4" /> },
  { type: SuggestionType.GENERATE_TIKTOK_HOOK, icon: <SmartphoneIcon className="w-4 h-4" /> },
  { type: SuggestionType.GENERATE_SONG, icon: <MusicIcon className="w-4 h-4" /> },
  { type: SuggestionType.RADIO_READY, icon: <RadioIcon className="w-4 h-4" /> },
  { type: SuggestionType.STUDIO_MODE, icon: <MicIcon className="w-4 h-4" /> },
  { type: SuggestionType.EXPORT_DAW, icon: <FileUpIcon className="w-4 h-4" /> },
];

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

  const handleGenerateClick = () => {
    onSuggestionSelect(activeTool);
  };

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
            <span className="truncate">{activeToolInfo.type}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOpen ? <ChevronUp className="w-5 h-5 shrink-0 ml-1" /> : <ChevronDown className="w-5 h-5 shrink-0 ml-1" />}
          </div>
        </button>

        {/* Action Button (Right, ~25% width) */}
        <button
          onClick={handleGenerateClick}
          disabled={isLoading}
          className="flex-[2] flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-accent to-accent-light hover:brightness-110 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
        >
          <SparkleIcon className="w-5 h-5 shrink-0" />
          <span className="hidden sm:inline">Generate</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-full sm:w-80 bg-main/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            <div className="grid grid-cols-1 gap-1">
              {allOptions.map(({ type, icon }) => {
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setActiveTool(type);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      activeTool === type
                        ? 'bg-accent/20 text-accent-light'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className={`shrink-0 ${activeTool === type ? 'text-accent-light' : 'text-gray-400'}`}>
                        {icon}
                      </span>
                      <span>{type}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionControls;