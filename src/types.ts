import { JSX } from 'react';

export enum SuggestionType {
  IMPROVE = 'Improve Lyrics',
  NEXT_LINES = 'Suggest Next Lines',
  MELODY = 'Suggest Melody',
  STRUCTURE = 'Suggest Structure',
  CHORDS = 'Suggest Chords',
  RHYMES = 'Find Rhymes',
  REVIEW = 'Review Lyrics',
  ORIGINALITY_CHECK = 'Check Originality',
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
  activeTab: 'editor' | 'chat';
  audioClips?: AudioClip[];
}