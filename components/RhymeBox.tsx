import React from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface RhymeBoxProps {
  word: string;
  rhymes: string[];
  isLoading: boolean;
  error: string | null;
  onSelectRhyme: (rhyme: string) => void;
  onClose: () => void;
}

const RhymeBox: React.FC<RhymeBoxProps> = ({ word, rhymes, isLoading, error, onSelectRhyme, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1d2951] rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Rhymes for "{word}"
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        </div>
        
        {isLoading && (
            <div className="flex justify-center items-center h-48">
                <SpinnerIcon className="w-10 h-10 text-purple-400" />
            </div>
        )}

        {error && !isLoading &&(
            <div className="text-center text-yellow-400 h-48 flex items-center justify-center" role="alert">
                <p>{error}</p>
            </div>
        )}
        
        {!isLoading && !error && rhymes.length === 0 && (
             <div className="text-center text-gray-400 h-48 flex items-center justify-center" role="alert">
                <p>No rhymes found. Try another word!</p>
            </div>
        )}

        {!isLoading && !error && rhymes.length > 0 && (
            <div className="max-h-64 overflow-y-auto pr-2">
                <div className="flex flex-wrap gap-2">
                    {rhymes.map((rhyme, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                onSelectRhyme(rhyme);
                                onClose();
                            }}
                            className="px-3 py-1 bg-gray-700 hover:bg-[#1d2951] rounded-md transition duration-200 text-white font-medium"
                        >
                            {rhyme}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RhymeBox;
