import { JSX } from 'react';

export enum SuggestionType {
  NEXT_LINES = 'Suggest Next Lines',
  RHYMES = 'Find Rhymes',
  REVIEW = 'Review Lyrics',

  CHECK_COMMON_PHRASES = 'Check Common Phrases',
  PROMPT_TO_LYRICS = 'Prompt to Lyrics',
  SENTIMENT_ANALYSIS = 'Sentiment Analysis',

  IMPROVE = 'Improve lyrics',
  STRUCTURE = 'Suggest Structure',
  CHORDS = 'Suggest Chords',
  GENERATE_BEAT = 'Suggest Beat',
  EXPORT_ZIP = 'Export Project as ZIP',
  GENERATE_CLIP = 'Generate Clip (30s)',

  STYLE_MIMIC = 'Change Style',
  TONE_SWITCHER = 'Tone Switcher',
  FIT_TO_STYLE = 'Fit to Your Style',
  MELODY = 'Suggest Melody',
  MELODY_HARMONIZATION = 'Melody Harmonization',
  ORIGINALITY_CHECK = 'Check Originality',
  VERSION_HISTORY = 'Version History',
  STEM_SPLITTER = 'Stem Splitter',
  GENERATE_TIKTOK_HOOK = 'Generate Hook for TikTok',

  GENERATE_SONG = 'Generate Song',
  RADIO_READY = 'Radio-Ready Polish',
  STUDIO_MODE = 'Studio Mode',
  EXPORT_DAW = 'Export Recordings to DAW Formats'
}

// FIX: Add ChatMessage type definition. This was missing, causing import errors.
export interface ChatMessage {
  sender: 'user' | 'companion' | 'greeting';
  content: string;
}

// FIX: Add Companion type definition. This was missing, causing import errors.
export interface Companion {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
  greeting: string;
  systemInstruction: string;
}

export interface AudioClip {
  id: string;
  name: string;
  timestamp: number;
  audioData: string; // base64 string
}

export interface AiSuggestionResult {
  text: string;
  groundingChunks?: any[];
}

export interface Project {
  id: string;
  title: string;
  lastModified: number;
  lyrics: string;
  suggestion: string;
  feedback: string;
  companion: Companion;
  messages: ChatMessage[];
  activeTab: 'editor' | 'chat' | 'recordings' | 'history';
  audioClips?: AudioClip[];
  isShared?: boolean;
  collaborators?: string[];
  uid: string;
}

export interface ProjectVersion {
  id: string;
  timestamp: number;
  lyrics: string;
  suggestion: string;
  feedback: string;
  audioClips: AudioClip[];
}
