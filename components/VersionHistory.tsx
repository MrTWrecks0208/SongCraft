import React from 'react';
import { ProjectVersion } from '../types';
import { History as HistoryIcon, RotateCcw } from 'lucide-react';
import { TrashIcon } from './icons/TrashIcon';
import { format } from 'date-fns';

interface VersionHistoryProps {
  versions: ProjectVersion[];
  onRestore: (version: ProjectVersion) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, onRestore, onDelete, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400">
        <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>No versions saved yet.</p>
        <p className="text-sm">Click "Save Song" to create a snapshot of your work.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-300 flex items-center gap-2">
        <HistoryIcon className="w-6 h-6 text-pink-500" />
        Version History
      </h2>
      <div className="space-y-3">
        {versions.map((version) => (
          <div key={version.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all">
            <div className="flex flex-col">
              <span className="text-white font-semibold">
                {format(version.timestamp, 'MMM d, yyyy HH:mm:ss')}
              </span>
              <span className="text-xs text-gray-400">
                {version.lyrics.length} characters • {version.audioClips?.length || 0} recordings
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onRestore(version)}
                className="mx-1 rounded-lg text-emerald-500 hover:text-emerald-400 active:text-emerald-600 transition-all"
                title="Restore this version"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(version.id)}
                className="mx-1 rounded-lg text-red-500 hover:text-red-400 font-light active:text-red-600 transition-all"
                title="Delete this version"
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionHistory;
