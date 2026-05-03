import { JSX } from 'react';

export enum SuggestionType {
  NEXT_LINES = 'Suggest Next Lines',
  RHYMES = 'Find Rhymes',
  REVIEW = 'Review Lyrics',

  CHECK_COMMON_PHRASES = 'Check Common Phrases',
  SENTIMENT_ANALYSIS = 'Sentiment Analysis',

  IMPROVE = 'Improve lyrics',
  STRUCTURE = 'Suggest Structure',
  CHORDS = 'Suggest Chords',
  GENERATE_BEAT = 'Suggest Beat',
  EXPORT_ZIP = 'Export Project as ZIP',

  STYLE_MIMIC = 'Change Style',
  TONE_SWITCHER = 'Tone Switcher',
  MAKE_IT_YOURS = 'Make It Yours',
  MELODY = 'Suggest Melody',
  ORIGINALITY_CHECK = 'Check Originality',
  VERSION_HISTORY = 'Version History',
  STEM_SPLITTER = 'Stem Splitter',

  GENERATE_SONG = 'Generate Song',
  RADIO_READY = 'Radio-Ready Polish',
  STUDIO_MODE = 'Studio Mode',
  EXPORT_DAW = 'Export Recordings to DAW Formats'
}

export const SUGGESTION_COSTS: Record<SuggestionType, number> = {
  [SuggestionType.NEXT_LINES]: 1,
  [SuggestionType.RHYMES]: 1,
  [SuggestionType.REVIEW]: 1,

  [SuggestionType.CHECK_COMMON_PHRASES]: 3,
  [SuggestionType.SENTIMENT_ANALYSIS]: 3,

  [SuggestionType.IMPROVE]: 3,
  [SuggestionType.STRUCTURE]: 3,
  [SuggestionType.CHORDS]: 3,
  [SuggestionType.GENERATE_BEAT]: 3,
  [SuggestionType.EXPORT_ZIP]: 3,

  [SuggestionType.STYLE_MIMIC]: 5,
  [SuggestionType.TONE_SWITCHER]: 5,
  [SuggestionType.MAKE_IT_YOURS]: 5,
  [SuggestionType.MELODY]: 5,
  [SuggestionType.ORIGINALITY_CHECK]: 5,
  [SuggestionType.VERSION_HISTORY]: 5,
  [SuggestionType.STEM_SPLITTER]: 5,

  [SuggestionType.GENERATE_SONG]: 10,
  [SuggestionType.RADIO_READY]: 10,
  [SuggestionType.STUDIO_MODE]: 10,
  [SuggestionType.EXPORT_DAW]: 10,
};

export enum SubscriptionTier {
  OPEN_MIC = 'Open Mic',
  RISING_ARTIST = 'Rising Artist',
  HEADLINER = 'Headliner',
  LEGEND = 'Legend'
}

export const TIER_FEATURES: Record<SubscriptionTier, SuggestionType[]> = {
  [SubscriptionTier.OPEN_MIC]: [
    SuggestionType.NEXT_LINES,
    SuggestionType.RHYMES,
    SuggestionType.REVIEW,
  ],
  [SubscriptionTier.RISING_ARTIST]: [
    SuggestionType.NEXT_LINES,
    SuggestionType.RHYMES,
    SuggestionType.REVIEW,
    SuggestionType.CHECK_COMMON_PHRASES,
    SuggestionType.SENTIMENT_ANALYSIS,
    SuggestionType.IMPROVE,
    SuggestionType.STRUCTURE,
    SuggestionType.CHORDS,
    SuggestionType.GENERATE_BEAT,
    SuggestionType.EXPORT_ZIP,
  ],
  [SubscriptionTier.HEADLINER]: [
    SuggestionType.NEXT_LINES,
    SuggestionType.RHYMES,
    SuggestionType.REVIEW,
    SuggestionType.CHECK_COMMON_PHRASES,
    SuggestionType.SENTIMENT_ANALYSIS,
    SuggestionType.IMPROVE,
    SuggestionType.STRUCTURE,
    SuggestionType.CHORDS,
    SuggestionType.GENERATE_BEAT,
    SuggestionType.EXPORT_ZIP,
    SuggestionType.STYLE_MIMIC,
    SuggestionType.TONE_SWITCHER,
    SuggestionType.MAKE_IT_YOURS,
    SuggestionType.MELODY,
    SuggestionType.ORIGINALITY_CHECK,
    SuggestionType.VERSION_HISTORY,
    SuggestionType.STEM_SPLITTER,
  ],
  [SubscriptionTier.LEGEND]: [
    SuggestionType.NEXT_LINES,
    SuggestionType.RHYMES,
    SuggestionType.REVIEW,
    SuggestionType.CHECK_COMMON_PHRASES,
    SuggestionType.SENTIMENT_ANALYSIS,
    SuggestionType.IMPROVE,
    SuggestionType.STRUCTURE,
    SuggestionType.CHORDS,
    SuggestionType.GENERATE_BEAT,
    SuggestionType.EXPORT_ZIP,
    SuggestionType.STYLE_MIMIC,
    SuggestionType.TONE_SWITCHER,
    SuggestionType.MAKE_IT_YOURS,
    SuggestionType.MELODY,
    SuggestionType.ORIGINALITY_CHECK,
    SuggestionType.VERSION_HISTORY,
    SuggestionType.STEM_SPLITTER,
    SuggestionType.GENERATE_SONG,
    SuggestionType.RADIO_READY,
    SuggestionType.STUDIO_MODE,
    SuggestionType.EXPORT_DAW,
  ]
};

export const getEffectiveSuggestionCost = (type: SuggestionType, userTier: string): number => {
  let normalizedTier = SubscriptionTier.OPEN_MIC;
  if (userTier === 'Rising Artist') normalizedTier = SubscriptionTier.RISING_ARTIST;
  else if (userTier === 'Headliner') normalizedTier = SubscriptionTier.HEADLINER;
  else if (userTier === 'Legend') normalizedTier = SubscriptionTier.LEGEND;
  else if (userTier === 'Free' || !userTier || userTier === 'Open Mic') normalizedTier = SubscriptionTier.OPEN_MIC;

  if (TIER_FEATURES[normalizedTier].includes(type)) {
    return 0;
  }

  return SUGGESTION_COSTS[type] || 1;
};

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

export interface ProjectVersion {
  id: string;
  timestamp: number;
  lyrics: string;
  suggestion: string;
  feedback: string;
  audioClips: AudioClip[];
}
