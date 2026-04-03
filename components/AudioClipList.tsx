import React from 'react';
import { AudioClip } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface AudioClipListProps {
  clips: AudioClip[];
  onDelete: (id: string) => void;
}

const AudioClipList: React.FC<AudioClipListProps> = ({ clips, onDelete }) => {
  if (clips.length === 0) {
    return (
      <div className="bg-white/5 p-8 rounded-xl border border-white/10 text-center">
        <p className="text-gray-500 text-sm italic">No recordings yet.</p>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {clips.map((clip) => (
        <div 
          key={clip.id} 
          className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-3 hover:bg-white/10 transition-colors"
        >
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-200">{clip.name}</span>
              <span className="text-[10px] text-gray-500">{formatDate(clip.timestamp)}</span>
            </div>
            <button
              onClick={() => onDelete(clip.id)}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
              aria-label="Delete recording"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
          
          <audio 
            controls 
            src={clip.audioData} 
            className="w-full h-8 filter invert opacity-80"
          />
        </div>
      ))}
    </div>
  );
};

export default AudioClipList;
