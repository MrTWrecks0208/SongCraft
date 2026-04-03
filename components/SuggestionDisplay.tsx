import React from 'react';
import ReactMarkdown from 'react-markdown';
import { SuggestionType } from '../types';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { ClearIcon } from './icons/ClearIcon';

interface SuggestionDisplayProps {
  suggestion: string;
  isLoading: boolean;
  error: string | null;
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
  onRegenerate: () => void;
  selectedType?: SuggestionType | null;
  onSuggestionSelect?: (type: SuggestionType) => void;
  onClearSuggestion: () => void;
  groundingChunks?: any[];
}

const SuggestionDisplay: React.FC<SuggestionDisplayProps> = ({ 
  suggestion, 
  isLoading, 
  error,
  feedback,
  onFeedbackChange,
  onRegenerate,
  selectedType,
  onSuggestionSelect,
  onClearSuggestion,
  groundingChunks
}) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <img 
            src="https://i.postimg.cc/3RS1sFS5/ezgif-com-crop-(1).gif" 
            alt="Loading..." 
            className="w-24 h-24 object-contain"
            referrerPolicy="no-referrer"
          />
          <p className="mt-4 text-gray-400">Your AI partner is thinking...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      );
    }
    
    if (suggestion) {
        return (
            <div className="flex flex-col gap-6 relative">
                <button 
                    onClick={onClearSuggestion}
                    className="absolute -top-2 -right-2 p-1.5 bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white rounded-full transition-all shadow-lg border border-white/10"
                    title="Clear suggestion"
                >
                    <ClearIcon className="w-3.5 h-3.5" />
                </button>
                <div className="markdown-body prose prose-invert prose-p:text-gray-300 prose-p:mb-4 last:prose-p:mb-0 prose-strong:text-gray-100 prose-headings:text-transparent prose-headings:bg-clip-text prose-headings:bg-gradient-to-r prose-headings:from-purple-400 prose-headings:to-pink-500 prose-li:text-gray-300">
                    <ReactMarkdown>{suggestion}</ReactMarkdown>
                </div>

                {groundingChunks && groundingChunks.length > 0 && (
                    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            Sources & References
                        </h4>
                        <ul className="flex flex-wrap gap-2">
                            {groundingChunks.map((chunk, index) => (
                                chunk.web && (
                                    <li key={index}>
                                        <a 
                                            href={chunk.web.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                        >
                                            {chunk.web.title || 'Source'}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                        </a>
                                    </li>
                                )
                            ))}
                        </ul>
                    </div>
                )}

                {selectedType === SuggestionType.REVIEW && onSuggestionSelect && (
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={() => onSuggestionSelect(SuggestionType.IMPROVE)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-full shadow-lg transform transition hover:scale-105 active:scale-95"
                        >
                            Would you like some suggestions on improving these lyrics?
                        </button>
                    </div>
                )}
                
                <div className="border-t border-white/10 pt-4 mt-2">
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-400 mb-2">
                        Refine suggestions (e.g., "Make it more poetic", "Focus on the chorus")
                    </label>
                    <div className="relative">
                        <textarea
                            id="feedback"
                            value={feedback}
                            onChange={(e) => onFeedbackChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    onRegenerate();
                                }
                            }}
                            placeholder="Type your feedback here to guide the next suggestion..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pr-12 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none min-h-[80px]"
                        />
                        <button
                            onClick={onRegenerate}
                            disabled={!feedback.trim() || isLoading}
                            className="absolute bottom-3 right-3 p-2 bg-[#1d2951] hover:bg-[#151e3d] disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-all"
                            aria-label="Submit feedback"
                        >
                            <PaperAirplaneIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Press Ctrl+Enter to submit</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 text-gray-500">
            <LightbulbIcon className="w-12 h-12 mb-4"/>
            <h3 className="font-semibold text-lg text-gray-400">Suggestions will appear here</h3>
            <p className="text-sm">Write some lyrics and choose an option above to get started.</p>
        </div>
    );
  };
  
  return (
    <div className="bg-white/5 rounded-xl p-4 sm:p-6 shadow-lg min-h-[200px] transition-all duration-300 border border-white/5">
      {renderContent()}
    </div>
  );
};

export default SuggestionDisplay;
