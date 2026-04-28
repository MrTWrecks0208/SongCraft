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
import { Sparkles as SparklesIcon, Music as MusicIcon, Radio as RadioIcon, Drum as DrumIcon, ChevronDown, ChevronUp, Zap, Archive as ArchiveIcon, History as HistoryIcon, Scissors as ScissorsIcon, Mic as MicIcon, FileUp as FileUpIcon } from 'lucide-react';
import { useUserCredits } from '../hooks/useUserCredits';
import { useSubscription } from '../hooks/useSubscription';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { SUGGESTION_COSTS, getEffectiveSuggestionCost } from '../types';

interface SuggestionControlsProps {
  onSuggestionSelect: (type: SuggestionType) => void;
  isLoading: boolean;
  selectedType: SuggestionType | null;
  onGoToPricing?: () => void;
}

const suggestionGroups = [
  {
    label: "Open Mic",
    options: [
      { type: SuggestionType.NEXT_LINES, icon: <NextLineIcon className="w-4 h-4" /> },
      { type: SuggestionType.RHYMES, icon: <RhymeIcon className="w-4 h-4" /> },
      { type: SuggestionType.REVIEW, icon: <ReviewIcon className="w-4 h-4" /> },
    ]
  },
  {
    label: "Rising Artist",
    options: [
      { type: SuggestionType.IMPROVE, icon: <MagicWandIcon className="w-4 h-4" /> },
      { type: SuggestionType.STRUCTURE, icon: <StructureIcon className="w-4 h-4" /> },
      { type: SuggestionType.CHORDS, icon: <ChordsIcon className="w-4 h-4" /> },
      { type: SuggestionType.GENERATE_BEAT, icon: <DrumIcon className="w-4 h-4" /> },
      { type: SuggestionType.EXPORT_ZIP, icon: <ArchiveIcon className="w-4 h-4" /> },
    ]
  },
  {
    label: "Headliner",
    options: [
      { type: SuggestionType.STYLE_MIMIC, icon: <SparklesIcon className="w-4 h-4" /> },
      { type: SuggestionType.MELODY, icon: <MusicNoteIcon className="w-4 h-4" /> },
      { type: SuggestionType.ORIGINALITY_CHECK, icon: <ShieldCheckIcon className="w-4 h-4" /> },
      { type: SuggestionType.VERSION_HISTORY, icon: <HistoryIcon className="w-4 h-4" /> },
      { type: SuggestionType.STEM_SPLITTER, icon: <ScissorsIcon className="w-4 h-4" /> },
    ]
  },
  {
    label: "Legend",
    options: [
      { type: SuggestionType.GENERATE_SONG, icon: <MusicIcon className="w-4 h-4" /> },
      { type: SuggestionType.RADIO_READY, icon: <RadioIcon className="w-4 h-4" /> },
      { type: SuggestionType.STUDIO_MODE, icon: <MicIcon className="w-4 h-4" /> },
      { type: SuggestionType.EXPORT_DAW, icon: <FileUpIcon className="w-4 h-4" /> },
    ]
  }
];

const allOptions = suggestionGroups.flatMap(g => g.options);

const SuggestionControls: React.FC<SuggestionControlsProps> = ({ onSuggestionSelect, isLoading, selectedType, onGoToPricing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<SuggestionType>(SuggestionType.IMPROVE);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [userId, setUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setUserId(user?.uid));
    return unsub;
  }, []);

  const { credits } = useUserCredits(userId);
  const subscription = useSubscription();

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
  const effectiveCost = getEffectiveSuggestionCost(activeTool, subscription.tier);
  const hasEnoughCredits = (credits !== null && credits >= effectiveCost) || effectiveCost === 0;

  const handleGenerateClick = () => {
    if (!hasEnoughCredits) {
      if (onGoToPricing) {
        onGoToPricing();
      } else {
        alert('Not enough credits!');
      }
      return;
    }
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
            {effectiveCost > 0 ? (
              <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                 <Zap className="w-3 h-3 text-yellow-400" /> {effectiveCost}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                 Free
              </div>
            )}
            {isOpen ? <ChevronUp className="w-5 h-5 shrink-0 ml-1" /> : <ChevronDown className="w-5 h-5 shrink-0 ml-1" />}
          </div>
        </button>

        {/* Action Button (Right, ~25% width) */}
        <button
          onClick={handleGenerateClick}
          disabled={isLoading}
          className="flex-[2] flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-accent to-accent-light hover:brightness-110 text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
        >
          {hasEnoughCredits ? (
            <SparkleIcon className="w-5 h-5 shrink-0" />
          ) : (
            <Zap className="w-4 h-4 shrink-0 text-gray-300" />
          )}
          <span className="hidden sm:inline">{hasEnoughCredits ? 'Generate' : 'Get Credits'}</span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-full sm:w-80 bg-main/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {suggestionGroups.map((group, idx) => (
               <div key={group.label} className={idx > 0 ? "mt-2 pt-2 border-t border-white/5" : ""}>
                 <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                   {group.label}
                 </div>
                 {group.options.map(({ type, icon }) => {
                   const itemCost = getEffectiveSuggestionCost(type, subscription.tier);
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
                       <div className="flex items-center gap-3">
                         <span className={activeTool === type ? 'text-accent-light' : 'text-gray-400'}>
                           {icon}
                         </span>
                         {type}
                       </div>
                       <div className={`flex items-center gap-1 text-xs shrink-0 ${activeTool === type ? 'text-accent-light' : 'text-gray-400'}`}>
                         {itemCost > 0 ? (
                           <><Zap className="w-3 h-3" /> {itemCost}</>
                         ) : (
                           <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent">Free</span>
                         )}
                       </div>
                     </button>
                   );
                 })}
               </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionControls;