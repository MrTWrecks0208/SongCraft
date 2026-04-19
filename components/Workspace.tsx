import React, { useState, useCallback, useRef, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getDoc, collection, addDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { SuggestionType, Companion, ChatMessage, Project, AudioClip, ProjectVersion } from '../types';
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

import { handleFirestoreError, OperationType } from '../services/firestoreUtils';

interface WorkspaceProps {
    projectId: string;
    onBack: () => void;
}

let isStorageAvailable = true;

const Workspace: React.FC<WorkspaceProps> = ({ projectId, onBack }) => {
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
        setRhymeState({ isOpen: true, word: lastWord, rhymes: [], isLoading: true, error: null });
        try {
            const rhymes = await getRhymes(lastWord);
            setRhymeState(prev => ({ ...prev, rhymes, isLoading: false }));
        } catch (e: any) {
            setRhymeState(prev => ({...prev, error: e.message, isLoading: false }));
        }
    };

    const handleGenerateSong = async () => {
        if (!lyrics.trim()) {
            setSuggestionError('Please enter some lyrics to generate a song.');
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

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate a 30-second song with melody and music based on these lyrics:
            
            ${lyrics}
            
            Style: Catchy and modern.`;

            const response = await ai.models.generateContentStream({
                model: "lyria-3-clip-preview",
                contents: prompt,
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

    const handleSuggestionRequest = useCallback(async (type: SuggestionType, isRefinement: boolean = false, styleName?: string, styleType?: 'artist' | 'genre') => {
        if (type === SuggestionType.STYLE_MIMIC && !styleName && !isRefinement) {
            setMusicianModal({ isOpen: true, name: selectedMusician, customName: '', type: selectedStyleType });
            return;
        }

        if (type === SuggestionType.GENERATE_SONG) {
            handleGenerateSong();
            return;
        }

        if (styleName) {
            setSelectedMusician(styleName);
        }
        if (styleType) {
            setSelectedStyleType(styleType);
        }

        setActiveSuggestionType(type);
        if (type === SuggestionType.RHYMES) {
            handleRhymeRequest();
            return;
        }
        if (!lyrics.trim() && type !== SuggestionType.GENERATE_BEAT) {
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
        const effectiveStyle = styleName || (type === SuggestionType.STYLE_MIMIC ? selectedMusician : undefined);
        const effectiveStyleType = styleType || (type === SuggestionType.STYLE_MIMIC ? selectedStyleType : undefined);
        const result = await getAiSuggestion(lyrics, type, currentFeedback, companion.systemInstruction, effectiveStyle, effectiveStyleType);
        
        if (result.text.toLowerCase().includes('error occurred')) {
            setSuggestionError(result.text);
        } else {
            setSuggestion(result.text);
            setGroundingChunks(result.groundingChunks || []);
        }
        setIsSuggestionLoading(false);
    }, [lyrics, feedback, companion.systemInstruction, selectedMusician, selectedStyleType]);

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
                />
            )}
            {rhymeState.isOpen && (
                <RhymeBox
                    {...rhymeState}
                    onSelectRhyme={handleSelectRhyme}
                    onClose={() => setRhymeState(prev => ({...prev, isOpen: false}))}
                />
            )}
            
            {musicianModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1d2951] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Generate Different Style</h2>
                        
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
                                {(musicianModal.type === 'artist' ? POPULAR_ARTISTS : POPULAR_GENRES).map(item => (
                                    <option key={item} value={item} className="bg-[#1d2951]">{item}</option>
                                ))}
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
                    {auth.currentUser?.isAnonymous && (
                        <div className="px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-full flex items-center gap-2 flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Guest Mode</span>
                        </div>
                    )}
                    <button onClick={() => setIsCompanionSelectorOpen(true)} className="p-0 transition-colors flex-shrink-0 text-gray-300 hover:text-yellow-500 active:text-yellow-600 relative overflow-hidden rounded-full w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10" aria-label="Change companion" title="Change AI Companion">
                         <img src="/logo.png" alt="Companion" className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>'; }} />
                    </button>
                </div>
                
                <div className="flex justify-center">
                    <div className="bg-white/5 p-1 rounded-full flex items-center gap-1">
                        <TabButton icon={<PencilIcon className="w-5 h-5"/>} text="Editor" isActive={activeTab === 'editor'} onClick={() => setActiveTab('editor')} inactiveColorClass="hover:text-sky-500" />
                        <TabButton icon={<ChatBubbleIcon className="w-5 h-5"/>} text="Chat" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} inactiveColorClass="hover:text-yellow-500" />
                        <TabButton icon={<RecordIcon className="w-5 h-5"/>} text="Recordings" isActive={activeTab === 'recordings'} onClick={() => setActiveTab('recordings')} inactiveColorClass="hover:text-red-600" />
                        <TabButton icon={<HistoryIcon className="w-5 h-5"/>} text="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} inactiveColorClass="hover:text-emerald-500" />
                    </div>
                </div>
            </header>
            
            <main className="w-full flex flex-col gap-6">
                {renderTabContent()}
            </main>
        </div>
    );
};

const TabButton: React.FC<{icon: React.ReactNode, text: string, isActive: boolean, onClick: () => void, inactiveColorClass?: string}> = ({icon, text, isActive, onClick, inactiveColorClass = ''}) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base font-regular rounded-full flex items-center gap-2 transition-colors border text-white ${
            isActive ? 'bg-white/20 border-pink-600' : `border-transparent hover:bg-white/10 ${inactiveColorClass}`
        }`}
    >
        <span className={isActive ? 'text-white' : ''}>{icon}</span>
        <span className="inline text-white">{text}</span>
    </button>
);


export default Workspace;