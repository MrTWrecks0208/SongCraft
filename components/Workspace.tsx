import React, { useState, useCallback, useRef, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getDoc, collection, addDoc, query, orderBy, deleteDoc, increment, getDocs } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { SuggestionType, Companion, ChatMessage, Project, AudioClip, ProjectVersion, SUGGESTION_COSTS, getEffectiveSuggestionCost } from '../types';
import { getAiSuggestion, getRhymes } from '../services/geminiService';
import { GoogleGenAI, Chat } from "@google/genai";
import { motion } from 'motion/react';
import LyricEditor from './LyricEditor';
import SuggestionControls from './SuggestionControls';
import SuggestionDisplay from './SuggestionDisplay';
import ChatView from './ChatView';
import CompanionSelector from './CompanionSelector';
import RhymeBox from './RhymeBox';
import AudioRecorder from './AudioRecorder';
import AudioClipList from './AudioClipList';
import VersionHistory from './VersionHistory';
import { companions } from '../companions';
import { POPULAR_ARTISTS, POPULAR_GENRES } from '../constants';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { PencilIcon } from './icons/PencilIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { RecordIcon } from './icons/RecordIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { UsersIcon } from './icons/UsersIcon';
import { History as HistoryIcon } from 'lucide-react';
import { Sparkles as SparklesIcon } from 'lucide-react';

import { handleFirestoreError, OperationType } from '../services/firestoreUtils';
import { useSubscription } from '../hooks/useSubscription';
import { useUserCredits } from '../hooks/useUserCredits';
import { Zap } from 'lucide-react';

interface WorkspaceProps {
    projectId: string;
    onBack: () => void;
    onGoToPricing: () => void;
}

let isStorageAvailable = true;

const Workspace: React.FC<WorkspaceProps> = ({ projectId, onBack, onGoToPricing }) => {
    const subscription = useSubscription();
    const { credits } = useUserCredits(auth.currentUser?.uid);
    // Project Metadata
    const [projectTitle, setProjectTitle] = useState('Untitled Song');

    // Core editor state
    const [lyrics, setLyrics] = useState<string>('');
    const [suggestion, setSuggestion] = useState<string>('');
    const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<string>('');
    const [isSuggestionLoading, setIsSuggestionLoading] = useState<boolean>(false);
    const [isSongGenerating, setIsSongGenerating] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [activeSuggestionType, setActiveSuggestionType] = useState<SuggestionType | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // View state
    const [activeTab, setActiveTab] = useState<'editor' | 'chat' | 'recordings' | 'history'>('editor');
    
    // Companion and chat state
    const [companion, setCompanion] = useState<Companion>(companions[0]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
    const [isCompanionSelectorOpen, setIsCompanionSelectorOpen] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    
    // Audio clips state
    const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
    
    // Version history state
    const [versions, setVersions] = useState<ProjectVersion[]>([]);
    const [isVersionsLoading, setIsVersionsLoading] = useState(false);
    
    // Save error state
    const [saveError, setSaveError] = useState<string | null>(null);
    
    // Rhyme finder state
    const [rhymeState, setRhymeState] = useState({ isOpen: false, word: '', rhymes: [], isLoading: false, error: null as string | null });
    const [songPromptModal, setSongPromptModal] = useState({ isOpen: false, prompt: '' });
    const [stemSplitterState, setStemSplitterState] = useState({ isOpen: false, selectedClipId: '', isLoading: false, progress: 0 });
    const [toneModal, setToneModal] = useState({ isOpen: false, tone: '', customTone: '' });
    const [selectedTone, setSelectedTone] = useState<string>('');
    const [musicianModal, setMusicianModal] = useState({ isOpen: false, name: '', customName: '', type: 'artist' as 'artist' | 'genre' });
    const [selectedMusician, setSelectedMusician] = useState<string>('');
    const [selectedStyleType, setSelectedStyleType] = useState<'artist' | 'genre'>('artist');

    // Refs to track state for comparison and initial load
    const stateRef = useRef({ projectTitle, lyrics, suggestion, feedback, companion, messages, audioClips, activeTab });
    const lastSavedDataRef = useRef<string>('');

    // Update stateRef whenever state changes
    useEffect(() => {
        stateRef.current = { projectTitle, lyrics, suggestion, feedback, companion, messages, audioClips, activeTab };
    }, [projectTitle, lyrics, suggestion, feedback, companion, messages, audioClips, activeTab]);

    // Load saved data for specific project from Firestore
    useEffect(() => {
        if (!auth.currentUser) return;

        const path = `users/${auth.currentUser.uid}/projects/${projectId}`;
        const projectRef = doc(db, 'users', auth.currentUser.uid, 'projects', projectId);
        
        const unsubscribe = onSnapshot(projectRef, (docSnap) => {
            try {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data) {
                        // Only update state if it's different from our current state to avoid loops
                        // and unnecessary re-renders
                        
                        if (data.title !== undefined && data.title !== stateRef.current.projectTitle) {
                            setProjectTitle(data.title);
                        }
                        
                        if (data.lyrics !== undefined && data.lyrics !== stateRef.current.lyrics) {
                            setLyrics(data.lyrics);
                        }
                        
                        if (data.suggestion !== undefined && data.suggestion !== stateRef.current.suggestion) {
                            setSuggestion(data.suggestion);
                        }
                        
                        if (data.feedback !== undefined && data.feedback !== stateRef.current.feedback) {
                            setFeedback(data.feedback);
                        }
                        
                        if (data.companion && JSON.stringify(data.companion) !== JSON.stringify(stateRef.current.companion)) {
                            setCompanion(data.companion);
                        }
                        
                        if (data.messages && JSON.stringify(data.messages) !== JSON.stringify(stateRef.current.messages)) {
                            setMessages(data.messages);
                        } else if (!data.messages && stateRef.current.messages.length === 0) {
                             setMessages([{ sender: 'greeting', content: (data.companion || companions[0]).greeting }]);
                        }
                        
                        if (data.audioClips && JSON.stringify(data.audioClips) !== JSON.stringify(stateRef.current.audioClips)) {
                            setAudioClips(data.audioClips);
                        }
                        
                        // We intentionally do not load activeTab from the database 
                        // so that opening a project always defaults to the 'editor' tab.

                        if (!isLoaded) {
                            // On initial load, set the lastSavedDataRef
                            lastSavedDataRef.current = JSON.stringify({
                                projectTitle: data.title || 'Untitled Song',
                                lyrics: data.lyrics || '',
                                suggestion: data.suggestion || '',
                                feedback: data.feedback || '',
                                companion: data.companion || companions[0],
                                messages: data.messages || [{ sender: 'greeting', content: (data.companion || companions[0]).greeting }],
                                audioClips: data.audioClips || [],
                                activeTab: data.activeTab || 'lyrics'
                            });
                            setIsLoaded(true);
                        }
                    }
                }
            } catch (err) {
                console.error("Error processing project snapshot:", err);
            }
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, path);
        });

        return () => unsubscribe();
    }, [projectId]);

    // Save data to Firestore for specific project
    const saveData = useCallback(async (isManualSave: boolean = false) => {
        if (!isLoaded || !auth.currentUser) return;
        setIsSaving(true);
        const path = `users/${auth.currentUser.uid}/projects/${projectId}`;
        try {
            // Check for base64 audio clips and upload them to Firebase Storage to avoid 1MB Firestore limit
            let updatedClips = [...audioClips];
            let clipsChanged = false;
            
            for (let i = 0; i < updatedClips.length; i++) {
                const clip = updatedClips[i];
                if (isStorageAvailable && storage && clip.audioData && clip.audioData.startsWith('data:')) {
                    try {
                        const storageRef = ref(storage, `users/${auth.currentUser.uid}/projects/${projectId}/audio/${clip.id}`);
                        await uploadString(storageRef, clip.audioData, 'data_url');
                        const downloadURL = await getDownloadURL(storageRef);
                        updatedClips[i] = { ...clip, audioData: downloadURL };
                        clipsChanged = true;
                    } catch (uploadError: any) {
                        if (uploadError?.code === 'storage/retry-limit-exceeded' || uploadError?.message?.includes('retry-limit-exceeded')) {
                            console.warn("Firebase Storage not configured or unreachable. Keeping base64 format.");
                            isStorageAvailable = false;
                        } else {
                            console.error("Failed to upload audio clip to storage:", uploadError);
                        }
                        // If storage fails, we might still hit the 1MB limit, but we tried.
                    }
                }
            }
            
            if (clipsChanged) {
                setAudioClips(updatedClips);
            }

            const projectRef = doc(db, 'users', auth.currentUser.uid, 'projects', projectId);
            await updateDoc(projectRef, {
                title: projectTitle || 'Untitled Song',
                lyrics,
                suggestion,
                feedback,
                companion,
                messages,
                audioClips: updatedClips,
                activeTab,
                lastModified: Date.now()
            });

            if (isManualSave) {
                // Create a version snapshot on manual save
                const versionRef = collection(db, 'users', auth.currentUser.uid, 'projects', projectId, 'versions');
                await addDoc(versionRef, {
                    timestamp: Date.now(),
                    lyrics,
                    suggestion,
                    feedback,
                    audioClips: updatedClips
                });
            }
            setSaveError(null); // Clear any previous errors on success
        } catch (error: any) {
            console.error("Save failed:", error);
            if (error.message?.includes('exceeds the maximum allowed size') || String(error).includes('exceeds the maximum allowed size')) {
                setSaveError("Save failed: Audio recordings are too large. Please enable Firebase Storage in your Firebase Console to save audio files.");
            } else {
                setSaveError("Failed to save project changes.");
            }
            handleFirestoreError(error, OperationType.UPDATE, path);
        } finally {
            setTimeout(() => setIsSaving(false), 1000);
        }
    }, [isLoaded, projectId, projectTitle, lyrics, suggestion, feedback, companion, messages, audioClips, activeTab]);

    // Auto-save feature has been removed as per user request.

    // Load versions when history tab is active
    useEffect(() => {
        if (activeTab !== 'history' || !auth.currentUser) return;
        
        setIsVersionsLoading(true);
        const versionsRef = collection(db, 'users', auth.currentUser.uid, 'projects', projectId, 'versions');
        const q = query(versionsRef, orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newVersions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ProjectVersion[];
            setVersions(newVersions);
            setIsVersionsLoading(false);
        }, (error) => {
            console.error("Error loading versions:", error);
            setIsVersionsLoading(false);
        });
        
        return () => unsubscribe();
    }, [activeTab, projectId]);

    const handleRestoreVersion = (version: ProjectVersion) => {
        // We cannot use window.confirm in an iframe, so we just proceed
        setLyrics(version.lyrics);
        setSuggestion(version.suggestion || '');
        setFeedback(version.feedback || '');
        setAudioClips(version.audioClips || []);
        setActiveTab('editor');
    };

    const handleDeleteVersion = async (versionId: string) => {
        if (!auth.currentUser) return;
        // We cannot use window.confirm in an iframe, so we just proceed
        try {
            const versionRef = doc(db, 'users', auth.currentUser.uid, 'projects', projectId, 'versions', versionId);
            await deleteDoc(versionRef);
        } catch (error) {
            console.error("Error deleting version:", error);
        }
    };

    const handleBack = () => {
        onBack();
    };

    // Initialize chat session when companion changes
    useEffect(() => {
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chatHistory = messages
            .filter(m => m.sender !== 'greeting')
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

        chatRef.current = ai.chats.create({
            model: 'gemini-3.1-pro-preview',
            config: { systemInstruction: companion.systemInstruction },
            history: chatHistory,
        });
    }, [companion, messages]);

    const handleRhymeRequest = async () => {
        const lastWord = lyrics.trim().split(/[\s\n]+/).pop()?.replace(/[.,!?]/g, '');
        if (!lastWord) {
            setSuggestionError('Write something to find rhymes for the last word.');
            return;
        }
        
        const successDeduction = await deductCredits(SuggestionType.RHYMES);
        if (!successDeduction) return;

        setRhymeState({ isOpen: true, word: lastWord, rhymes: [], isLoading: true, error: null });
        try {
            const rhymes = await getRhymes(lastWord);
            setRhymeState(prev => ({ ...prev, rhymes, isLoading: false }));
        } catch (e: any) {
            setRhymeState(prev => ({...prev, error: e.message, isLoading: false }));
        }
    };

    const deductCredits = async (type: SuggestionType): Promise<boolean> => {
        if (!auth.currentUser) return false;
        const cost = getEffectiveSuggestionCost(type, subscription.tier);
        if (cost === 0) return true; // It's free!

        // Grace buffer logic: Allow going slightly into negative
        if (credits !== null && credits - cost < -3) {
            setSuggestionError("You're on a roll! We've pushed past our creative limits for this session. Let's add some more sparks to keep the momentum going.");
            return false;
        }

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { credits: increment(-cost) });
            return true;
        } catch (e) {
            console.error("Failed to deduct credits:", e);
            setSuggestionError('Failed to deduct credits. Please try again.');
            return false;
        }
    };

    const handleGenerateSong = async (promptText: string, asText: boolean = false) => {
        if (!promptText.trim()) {
            setSuggestionError('Please enter a prompt.');
            return;
        }

        if (asText) {
            handleSuggestionRequest(SuggestionType.GENERATE_SONG, false, promptText, undefined);
            return;
        }

        setIsSongGenerating(true);
        setSuggestionError(null);
        setSuggestion('');
        setActiveSuggestionType(SuggestionType.GENERATE_SONG);

        // Check for API key selection for Lyria
        if (typeof (window as any).aistudio !== 'undefined') {
            try {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    await (window as any).aistudio.openSelectKey();
                    // Proceed after key selection
                }
            } catch (e) {
                console.error("Error checking/requesting API key:", e);
            }
        }

        const successDeduction = await deductCredits(SuggestionType.GENERATE_SONG);
        if (!successDeduction) {
            setIsSongGenerating(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const lyriaPrompt = `Generate a 30-second song with melody and music based on this prompt:
            
            ${promptText}
            
            ${lyrics.trim() ? `Incorporate these lyrics if possible:\n${lyrics}` : ''}`;

            const response = await ai.models.generateContentStream({
                model: "lyria-3-clip-preview",
                contents: lyriaPrompt,
                config: {
                    responseModalities: ["AUDIO"],
                }
            });

            let audioBase64 = "";
            let mimeType = "audio/wav";

            for await (const chunk of response) {
                const parts = chunk.candidates?.[0]?.content?.parts;
                if (!parts) continue;
                for (const part of parts) {
                    if (part.inlineData?.data) {
                        if (!audioBase64 && part.inlineData.mimeType) {
                            mimeType = part.inlineData.mimeType;
                        }
                        audioBase64 += part.inlineData.data;
                    }
                }
            }

            if (audioBase64) {
                const clipId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString();
                let audioDataUrl = `data:${mimeType};base64,${audioBase64}`;
                
                if (isStorageAvailable && storage) {
                    try {
                        const storageRef = ref(storage, `users/${auth.currentUser?.uid}/projects/${projectId}/audio/${clipId}`);
                        await uploadString(storageRef, audioDataUrl, 'data_url');
                        audioDataUrl = await getDownloadURL(storageRef);
                    } catch (uploadError: any) {
                        if (uploadError?.code === 'storage/retry-limit-exceeded' || uploadError?.message?.includes('retry-limit-exceeded')) {
                            console.warn("Firebase Storage not configured or unreachable. Falling back to base64.");
                            isStorageAvailable = false;
                        } else {
                            console.error("Failed to upload AI song to storage, falling back to base64:", uploadError);
                        }
                    }
                }

                const newClip: AudioClip = {
                    id: clipId,
                    name: `AI Song - ${projectTitle}`,
                    timestamp: Date.now(),
                    audioData: audioDataUrl,
                };
                setAudioClips(prev => [newClip, ...prev]);
                setSuggestion('AI Song generated successfully! You can find it in the Recordings tab.');
                setActiveTab('recordings');
            } else {
                setSuggestionError('Failed to generate audio. Please try again.');
            }
        } catch (error: any) {
            console.error("Error generating song:", error);
            setIsSongGenerating(false); // Set to false immediately so error shows
            if (error.message?.includes("Requested entity was not found")) {
                setSuggestionError("API Key error. Please re-select your API key.");
                if (typeof (window as any).aistudio !== 'undefined') {
                    // Don't await here, let it open asynchronously so we don't block
                    (window as any).aistudio.openSelectKey().catch(console.error);
                }
            } else {
                setSuggestionError(`Error generating song: ${error.message}`);
            }
        } finally {
            setIsSongGenerating(false);
        }
    };
    
    const handleSelectRhyme = (rhyme: string) => {
        setLyrics(prev => {
            const lastSpaceIndex = prev.trimEnd().lastIndexOf(' ');
            const newLyrics = lastSpaceIndex === -1 
                ? rhyme 
                : `${prev.substring(0, lastSpaceIndex)} ${rhyme}`;
            return newLyrics + ' ';
        });
    };

    const handleStemSplitSubmit = async () => {
        if (!stemSplitterState.selectedClipId) return;

        const sourceClip = audioClips.find(c => c.id === stemSplitterState.selectedClipId);
        if (!sourceClip) {
            setStemSplitterState(prev => ({ ...prev, isOpen: false }));
            setSuggestionError('Original audio clip not found.');
            return;
        }

        const successDeduction = await deductCredits(SuggestionType.STEM_SPLITTER);
        if (!successDeduction) {
            setStemSplitterState(prev => ({ ...prev, isOpen: false }));
            return;
        }

        setStemSplitterState(prev => ({ ...prev, isLoading: true, progress: 0 }));

        // Simulate a delay and progress
        for (let i = 1; i <= 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            setStemSplitterState(prev => ({ ...prev, progress: i * 10 }));
        }

        // Create 4 mock stems using the same audio clip
        const stems = ['Vocals', 'Drums', 'Bass', 'Other'];
        const newClips = stems.map(stem => ({
            id: `stem-${stem}-${Date.now()}-${Math.random()}`,
            name: `[${stem}] ${sourceClip.name}`,
            timestamp: Date.now(),
            audioData: sourceClip.audioData // Mocking actual split by reusing audio
        }));

        setAudioClips(prev => [...newClips, ...prev]);
        setStemSplitterState({ isOpen: false, selectedClipId: '', isLoading: false, progress: 0 });
        setActiveTab('recordings');
    };

    const handleSuggestionRequest = useCallback(async (type: SuggestionType, isRefinement: boolean = false, styleName?: string, styleType?: 'artist' | 'genre') => {
        if (type === SuggestionType.TONE_SWITCHER && !styleName && !isRefinement) {
            setToneModal({ isOpen: true, tone: selectedTone, customTone: '' });
            return;
        }

        if (type === SuggestionType.STYLE_MIMIC && !styleName && !isRefinement) {
            setMusicianModal({ isOpen: true, name: selectedMusician, customName: '', type: selectedStyleType });
            return;
        }

        if (type === SuggestionType.GENERATE_SONG && !isRefinement) {
            setSongPromptModal({ isOpen: true, prompt: '' });
            return;
        }

        if (
            type === SuggestionType.EXPORT_ZIP ||
            type === SuggestionType.VERSION_HISTORY ||
            type === SuggestionType.STUDIO_MODE ||
            type === SuggestionType.EXPORT_DAW
        ) {
            alert(`${type} is coming soon!`);
            return;
        }

        if (type === SuggestionType.STEM_SPLITTER) {
            setStemSplitterState(prev => ({ ...prev, isOpen: true, selectedClipId: '', isLoading: false, progress: 0 }));
            return;
        }

        let effectiveStyleName = styleName;
        if (type === SuggestionType.MAKE_IT_YOURS && !isRefinement) {
            // Fetch user's past projects to serve as style string
            if (auth.currentUser) {
                try {
                    const qDocs = query(collection(db, 'users', auth.currentUser.uid, 'projects'));
                    const snap = await getDocs(qDocs);
                    let pastLyrics = "";
                    snap.forEach(d => {
                        if (d.id !== projectId && d.data().lyrics) {
                            pastLyrics += d.data().lyrics + "\n\n";
                        }
                    });
                    if (pastLyrics.trim()) {
                        effectiveStyleName = pastLyrics.substring(0, 3000); // Send past lyrics
                    } else {
                        setSuggestionError("You don't have enough past projects to analyze your style yet!");
                        return;
                    }
                } catch (e) {
                    console.error("Failed to fetch past projects for style", e);
                }
            }
        }

        if (effectiveStyleName && type !== SuggestionType.MAKE_IT_YOURS) {
            if (type === SuggestionType.TONE_SWITCHER) {
                setSelectedTone(effectiveStyleName);
            } else {
                setSelectedMusician(effectiveStyleName);
            }
        }
        if (styleType) {
            setSelectedStyleType(styleType);
        }

        setActiveSuggestionType(type);
        if (type === SuggestionType.RHYMES) {
            handleRhymeRequest();
            return;
        }
        if (!lyrics.trim() && type !== SuggestionType.GENERATE_BEAT && type !== SuggestionType.GENERATE_SONG) {
            setSuggestionError('Please enter some lyrics or record your voice first.');
            return;
        }

        // Clear feedback if this is a fresh request from the main buttons
        if (!isRefinement) {
            setFeedback('');
        }

        setIsSuggestionLoading(true);
        setSuggestionError(null);
        if (!isRefinement) {
            setSuggestion('');
            setGroundingChunks([]);
        }
        
        // Use the current feedback only if it's a refinement request
        const currentFeedback = isRefinement ? feedback : '';
        const effectiveStyle = effectiveStyleName || (type === SuggestionType.STYLE_MIMIC ? selectedMusician : (type === SuggestionType.TONE_SWITCHER ? selectedTone : undefined));
        const effectiveStyleType = styleType || (type === SuggestionType.STYLE_MIMIC ? selectedStyleType : undefined);
        
        const successDeduction = await deductCredits(type);
        if (!successDeduction) {
            setIsSuggestionLoading(false);
            return;
        }

        const result = await getAiSuggestion(lyrics, type, currentFeedback, companion.systemInstruction, effectiveStyle, effectiveStyleType);
        
        if (result.text.toLowerCase().includes('error occurred')) {
            setSuggestionError(result.text);
        } else {
            setSuggestion(result.text);
            setGroundingChunks(result.groundingChunks || []);
        }
        setIsSuggestionLoading(false);
    }, [lyrics, feedback, companion.systemInstruction, selectedMusician, selectedStyleType, selectedTone, projectId]);

    const handleRegenerate = useCallback(() => {
        if (activeSuggestionType) {
            handleSuggestionRequest(activeSuggestionType, true);
        } else {
            handleSuggestionRequest(SuggestionType.IMPROVE, true);
        }
    }, [activeSuggestionType, handleSuggestionRequest]);

    const handleSendMessage = async (messageText: string) => {
        setIsChatLoading(true);
        const userMessage: ChatMessage = { sender: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);

        if (!chatRef.current) {
            console.error("Chat not initialized");
            setIsChatLoading(false);
            return;
        }

        try {
            const response = await chatRef.current.sendMessage({ message: messageText });
            const companionMessage: ChatMessage = { sender: 'companion', content: response.text };
            setMessages(prev => [...prev, companionMessage]);
        } catch (error) {
            console.error("Error sending chat message:", error);
            const errorMessage: ChatMessage = { sender: 'companion', content: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        }
        setIsChatLoading(false);
    };

    const handleCompanionSelect = (newCompanion: Companion) => {
        setCompanion(newCompanion);
        setMessages([{ sender: 'greeting', content: newCompanion.greeting }]);
    };
    
    const handleTranscriptUpdate = (transcript: string) => {
        setLyrics(prev => `${prev}${prev ? ' ' : ''}${transcript}`);
    };

    const handleRecordingComplete = async (blob: Blob) => {
        if (!auth.currentUser) return;
        
        try {
            const clipId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString();
            let downloadURL = "";
            
            if (isStorageAvailable && storage) {
                try {
                    const storageRef = ref(storage, `users/${auth.currentUser.uid}/projects/${projectId}/audio/${clipId}`);
                    await uploadBytes(storageRef, blob);
                    downloadURL = await getDownloadURL(storageRef);
                } catch (uploadError: any) {
                    if (uploadError?.code === 'storage/retry-limit-exceeded' || uploadError?.message?.includes('retry-limit-exceeded')) {
                        console.warn("Firebase Storage not configured or unreachable. Falling back to base64.");
                        isStorageAvailable = false;
                    } else {
                        console.error("Failed to upload recording to storage, falling back to base64:", uploadError);
                    }
                }
            }
            
            if (!downloadURL) {
                downloadURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => resolve(reader.result as string);
                });
            }
            
            const newClip: AudioClip = {
                id: clipId,
                name: `Recording ${audioClips.length + 1}`,
                timestamp: Date.now(),
                audioData: downloadURL,
            };
            setAudioClips(prev => [newClip, ...prev]);
        } catch (error) {
            console.error("Error uploading recording:", error);
            // Fallback to base64 if storage fails (though it might hit the 1MB limit)
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const newClip: AudioClip = {
                    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(),
                    name: `Recording ${audioClips.length + 1}`,
                    timestamp: Date.now(),
                    audioData: base64data,
                };
                setAudioClips(prev => [newClip, ...prev]);
            };
        }
    };

    const handleDeleteClip = (id: string) => {
        setAudioClips(prev => prev.filter(clip => clip.id !== id));
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'editor':
                return (
                    <>
                        <LyricEditor 
                            value={lyrics} 
                            onChange={(e) => setLyrics(e.target.value)}
                            onTranscriptUpdate={handleTranscriptUpdate}
                            onSave={() => saveData(true)}
                            isSaving={isSaving}
                        />
                        <SuggestionControls 
                            onSuggestionSelect={handleSuggestionRequest} 
                            isLoading={isSuggestionLoading || isSongGenerating} 
                            selectedType={activeSuggestionType}
                            onGoToPricing={onGoToPricing}
                        />
                        <SuggestionDisplay 
                            suggestion={suggestion} 
                            isLoading={isSuggestionLoading || isSongGenerating} 
                            error={suggestionError} 
                            feedback={feedback}
                            onFeedbackChange={setFeedback}
                            onRegenerate={handleRegenerate}
                            selectedType={activeSuggestionType}
                            onSuggestionSelect={handleSuggestionRequest}
                            onClearSuggestion={() => setSuggestion('')}
                            groundingChunks={groundingChunks}
                        />
                    </>
                );
            case 'chat':
                return (
                    <ChatView 
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isLoading={isChatLoading}
                        companionName={companion.name}
                    />
                );
            case 'recordings':
                return (
                    <div className="flex flex-col gap-6">
                        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-bold text-gray-300">Project Recordings</h2>
                            <AudioClipList clips={audioClips} onDelete={handleDeleteClip} />
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <VersionHistory 
                        versions={versions}
                        onRestore={handleRestoreVersion}
                        onDelete={handleDeleteVersion}
                        isLoading={isVersionsLoading}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24 flex flex-col gap-6 text-pink-500">
            {isCompanionSelectorOpen && (
                <CompanionSelector
                    companions={companions}
                    selectedCompanion={companion}
                    onSelect={handleCompanionSelect}
                    onClose={() => setIsCompanionSelectorOpen(false)}
                    onGoToPricing={onGoToPricing}
                />
            )}
            {rhymeState.isOpen && (
                <RhymeBox
                    {...rhymeState}
                    onSelectRhyme={handleSelectRhyme}
                    onClose={() => setRhymeState(prev => ({...prev, isOpen: false}))}
                />
            )}
            
            {toneModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1d2951] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl flex flex-col"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">Tone Switcher</h2>
                        <p className="text-sm text-gray-300 mb-6">Select a tone you want the song to have.</p>
                        
                        <div className="relative mb-6">
                            <select
                                value={toneModal.tone}
                                onChange={(e) => setToneModal(prev => ({ ...prev, tone: e.target.value, customTone: '' }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="bg-[#1d2951]">Select Tone</option>
                                <option value="Happy" className="bg-[#1d2951]">Happy</option>
                                <option value="Sad" className="bg-[#1d2951]">Sad</option>
                                <option value="Angry" className="bg-[#1d2951]">Angry</option>
                                <option value="Nostalgic" className="bg-[#1d2951]">Nostalgic</option>
                                <option value="Hopeful" className="bg-[#1d2951]">Hopeful</option>
                                <option value="Melancholic" className="bg-[#1d2951]">Melancholic</option>
                                <option value="Dark" className="bg-[#1d2951]">Dark</option>
                                <option value="Romantic" className="bg-[#1d2951]">Romantic</option>
                                <option value="Other" className="bg-[#1d2951]">Other...</option>
                            </select>
                            <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        
                        {toneModal.tone === 'Other' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                                <input
                                    type="text"
                                    placeholder="e.g. Dreamy, Energetic"
                                    value={toneModal.customTone}
                                    onChange={(e) => setToneModal(prev => ({ ...prev, customTone: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && toneModal.customTone.trim()) {
                                            handleSuggestionRequest(SuggestionType.TONE_SWITCHER, false, toneModal.customTone);
                                            setToneModal({ isOpen: false, tone: '', customTone: '' });
                                        }
                                    }}
                                />
                            </motion.div>
                        )}
                        
                        <div className="flex gap-3 mt-auto">
                            <button
                                onClick={() => setToneModal({ isOpen: false, tone: '', customTone: '' })}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl flex-1 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const finalTone = toneModal.tone === 'Other' ? toneModal.customTone : toneModal.tone;
                                    if (finalTone.trim()) {
                                        handleSuggestionRequest(SuggestionType.TONE_SWITCHER, false, finalTone);
                                        setToneModal({ isOpen: false, tone: '', customTone: '' });
                                    }
                                }}
                                disabled={toneModal.tone === 'Other' ? !toneModal.customTone.trim() : !toneModal.tone}
                                className="px-4 py-3 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-500 border-2 border-pink-500 hover:border-pink-600 text-white font-bold rounded-xl flex-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20"
                            >
                                Get Tips
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            
            {musicianModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1d2951] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Change Style</h2>
                        
                        <div className="flex mb-6">
                            <button
                                onClick={() => setMusicianModal(prev => ({ ...prev, type: 'artist', name: '' }))}
                                className={`flex-1 py-3 font-bold rounded-l-xl transition-all border-2 border-white/10 ${
                                    musicianModal.type === 'artist' 
                                        ? 'bg-pink-500 text-white' 
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                Artist
                            </button>
                            <button
                                onClick={() => setMusicianModal(prev => ({ ...prev, type: 'genre', name: '' }))}
                                className={`flex-1 py-3 font-bold border-2 border-white/10 rounded-r-xl transition-all ${
                                    musicianModal.type === 'genre' 
                                        ? 'bg-white text-pink-500' 
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                Genre
                            </button>
                        </div>

                        <div className="relative mb-6">
                            <select
                                value={musicianModal.name}
                                onChange={(e) => setMusicianModal(prev => ({ ...prev, name: e.target.value, customName: '' }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="bg-[#1d2951]">Select {musicianModal.type === 'artist' ? 'an Artist' : 'a Genre'}</option>
                                {musicianModal.type === 'artist' ? (
                                    POPULAR_ARTISTS.map(group => (
                                        Array.isArray(group.options) ? (
                                            <optgroup key={group.label} label={group.label} className="bg-[#1d2951] font-bold text-gray-400">
                                                {group.options.map(artist => (
                                                    <option key={artist} value={artist} className="bg-[#1d2951] text-white font-normal">{artist}</option>
                                                ))}
                                            </optgroup>
                                        ) : (
                                            <option key={group.label} value={group.options} className="bg-[#1d2951] text-white">{group.label}</option>
                                        )
                                    ))
                                ) : (
                                    POPULAR_GENRES.map(item => (
                                        <option key={item} value={item} className="bg-[#1d2951]">{item}</option>
                                    ))
                                )}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>

                        {musicianModal.name === 'Other' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                <input
                                    autoFocus
                                    type="text"
                                    value={musicianModal.customName}
                                    onChange={(e) => setMusicianModal(prev => ({ ...prev, customName: e.target.value }))}
                                    placeholder={`Enter custom ${musicianModal.type}...`}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && musicianModal.customName.trim()) {
                                            handleSuggestionRequest(SuggestionType.STYLE_MIMIC, false, musicianModal.customName, musicianModal.type);
                                            setMusicianModal({ isOpen: false, name: '', customName: '', type: 'artist' });
                                        }
                                    }}
                                />
                            </motion.div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setMusicianModal({ isOpen: false, name: '', customName: '', type: 'artist' })}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const finalName = musicianModal.name === 'Other' ? musicianModal.customName : musicianModal.name;
                                    if (finalName.trim()) {
                                        handleSuggestionRequest(SuggestionType.STYLE_MIMIC, false, finalName, musicianModal.type);
                                        setMusicianModal({ isOpen: false, name: '', customName: '', type: 'artist' });
                                    }
                                }}
                                disabled={musicianModal.name === 'Other' ? !musicianModal.customName.trim() : !musicianModal.name}
                                className="flex-1 px-4 py-3 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-500 border-2 border-pink-500 hover:border-pink-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20"
                            >
                                Get Tips
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            
            {songPromptModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1d2951] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl flex flex-col"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">Prompt to Song</h2>
                        <p className="text-sm text-gray-300 mb-6">Describe the song you want to make.</p>
                        
                        <textarea
                            value={songPromptModal.prompt}
                            onChange={(e) => setSongPromptModal(prev => ({ ...prev, prompt: e.target.value }))}
                            placeholder="e.g. A catchy pop song about a happy dog in the summer..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 h-32 resize-none mb-6"
                        />
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSongPromptModal({ isOpen: false, prompt: '' })}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl flex-1 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleGenerateSong(songPromptModal.prompt, true);
                                    setSongPromptModal({ isOpen: false, prompt: '' });
                                }}
                                disabled={!songPromptModal.prompt.trim()}
                                className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 font-bold rounded-xl flex-1 transition-all disabled:opacity-50"
                            >
                                Get Lyrics
                            </button>
                            <button
                                onClick={() => {
                                    handleGenerateSong(songPromptModal.prompt, false);
                                    setSongPromptModal({ isOpen: false, prompt: '' });
                                }}
                                disabled={!songPromptModal.prompt.trim()}
                                className="px-4 py-3 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-500 text-white font-bold rounded-xl flex-[1.5] transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20"
                            >
                                Generate Audio
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {stemSplitterState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1d2951] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl flex flex-col"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">Stem Splitter</h2>
                        <p className="text-sm text-gray-300 mb-6">Select an audio recording to separate vocals, drums, bass, and other instruments.</p>
                        
                        {stemSplitterState.isLoading ? (
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="text-pink-400 font-semibold text-center text-sm">Processing Audio...</div>
                                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/5">
                                    <div 
                                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-300"
                                        style={{ width: `${stemSplitterState.progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {audioClips.length > 0 ? audioClips.map(clip => (
                                    <button 
                                        key={clip.id}
                                        onClick={() => setStemSplitterState(prev => ({ ...prev, selectedClipId: clip.id }))}
                                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-colors ${
                                            stemSplitterState.selectedClipId === clip.id 
                                                ? 'border-pink-500 bg-pink-500/10' 
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="text-sm font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">{clip.name}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(clip.timestamp).toLocaleString()}</span>
                                    </button>
                                )) : (
                                    <div className="text-sm text-gray-400 text-center py-4 bg-white/5 rounded-xl border border-white/10">No recordings found. Go to the Recordings tab to add some.</div>
                                )}
                            </div>
                        )}
                        
                        <div className="flex gap-3 mt-auto">
                            <button
                                onClick={() => setStemSplitterState({ isOpen: false, selectedClipId: '', isLoading: false, progress: 0 })}
                                disabled={stemSplitterState.isLoading}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl flex-1 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStemSplitSubmit}
                                disabled={!stemSplitterState.selectedClipId || stemSplitterState.isLoading}
                                className="px-4 py-3 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-500 border-2 border-pink-500 hover:border-pink-600 text-white font-bold rounded-xl flex-[1.5] transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20"
                            >
                                {stemSplitterState.isLoading ? 'Processing...' : 'Split Audio'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            
            <header className="flex flex-col gap-4">
                {saveError && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-medium">{saveError}</span>
                        <button onClick={() => setSaveError(null)} className="text-red-300 hover:text-white ml-4">✕</button>
                    </div>
                )}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                         <button onClick={handleBack} className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0" aria-label="Go back">
                            <BackArrowIcon className="w-6 h-6 text-gray-300"/>
                        </button>
                        <img src="/logo.png" alt="GhostWriter Logo" className="w-8 h-8 object-contain mr-2 hidden sm:block" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <input 
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            placeholder="Song Title"
                            className="bg-transparent text-xl md:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded px-2 w-full transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 md:hidden">
                        {credits !== null && (
                            <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5 text-xs font-bold text-gray-300">
                                <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
                                <span>{credits}</span>
                                <span className="hidden sm:inline">Credits</span>
                            </div>
                        )}
                        {auth.currentUser?.isAnonymous && (
                            <div className="px-2 sm:px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-full flex items-center gap-2 flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0" />
                                <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider hidden sm:block">Guest Mode</span>
                                <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider sm:hidden">Guest</span>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsCompanionSelectorOpen(true)} className="p-0 transition-colors flex-shrink-0 text-yellow-500 hover:text-yellow-400 active:text-yellow-600 relative overflow-hidden w-6 h-6 flex items-center justify-center group" aria-label="Change companion" title="Change AI Companion">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot-message-square-icon lucide-bot-message-square"><path d="M12 6V2H8"/><path d="M15 11v2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/><path d="M9 11v2"/></svg>
                    </button>
                </div>
                
                <div className="flex justify-center">
                    <div className="bg-white/5 p-1 rounded-full flex items-center gap-1">
                        <TabButton icon={<PencilIcon className="w-5 h-5"/>} text="Editor" isActive={activeTab === 'editor'} onClick={() => setActiveTab('editor')} activeColorClass="text-sky-500" activeBorderClass="border-sky-500 border-2" inactiveColorClass="hover:text-sky-500" />
                        <TabButton icon={<ChatBubbleIcon className="w-5 h-5"/>} text="Chat" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} activeColorClass="text-yellow-500" activeBorderClass="border-yellow-500 border-2" inactiveColorClass="hover:text-yellow-500" />
                        <TabButton icon={<RecordIcon className="w-5 h-5"/>} text="Recordings" isActive={activeTab === 'recordings'} onClick={() => setActiveTab('recordings')} activeColorClass="text-red-500" activeBorderClass="border-red-500 border-2" inactiveColorClass="hover:text-red-500" />
                        <TabButton icon={<HistoryIcon className="w-5 h-5"/>} text="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} activeColorClass="text-emerald-500" activeBorderClass="border-emerald-500 border-2" inactiveColorClass="hover:text-emerald-500" />
                    </div>
                </div>
            </header>
            
            <main className="w-full flex flex-col gap-6">
                {renderTabContent()}
            </main>
        </div>
    );
};

const TabButton: React.FC<{
    icon: React.ReactNode, 
    text: string, 
    isActive: boolean, 
    onClick: () => void, 
    activeColorClass?: string,
    activeBorderClass?: string,
    inactiveColorClass?: string
}> = ({icon, text, isActive, onClick, activeColorClass = 'text-white', activeBorderClass = 'border-pink-600', inactiveColorClass = ''}) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base font-regular rounded-full flex items-center gap-1 sm:gap-2 transition-colors border ${
            isActive ? `bg-white/20 ${activeBorderClass} ${activeColorClass}` : `text-white border-transparent hover:bg-white/10 ${inactiveColorClass}`
        }`}
    >
        <span>{icon}</span>
        <span className="hidden sm:inline text-white">{text}</span>
    </button>
);


export default Workspace;