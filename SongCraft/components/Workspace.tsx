import React, { useState, useCallback, useRef, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { SuggestionType, Companion, ChatMessage, Project, AudioClip } from '../types';
import { getAiSuggestion, getRhymes } from '../services/geminiService';
import { GoogleGenAI, Chat } from "@google/genai";
import LyricEditor from './LyricEditor';
import SuggestionControls from './SuggestionControls';
import SuggestionDisplay from './SuggestionDisplay';
import ChatView from './ChatView';
import CompanionSelector from './CompanionSelector';
import RhymeBox from './RhymeBox';
import AudioRecorder from './AudioRecorder';
import AudioClipList from './AudioClipList';
import { companions } from '../companions';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { PencilIcon } from './icons/PencilIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { UsersIcon } from './icons/UsersIcon';
import { RecordIcon } from './icons/RecordIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

import { handleFirestoreError, OperationType } from '../services/firestoreUtils';

interface WorkspaceProps {
    projectId: string;
    onBack: () => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ projectId, onBack }) => {
    // Project Metadata
    const [projectTitle, setProjectTitle] = useState('Untitled Song');

    // Core editor state
    const [lyrics, setLyrics] = useState<string>('');
    const [suggestion, setSuggestion] = useState<string>('');
    const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<string>('');
    const [isSuggestionLoading, setIsSuggestionLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [activeSuggestionType, setActiveSuggestionType] = useState<SuggestionType | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // View state
    const [activeTab, setActiveTab] = useState<'editor' | 'chat' | 'recordings'>('editor');
    
    // Companion and chat state
    const [companion, setCompanion] = useState<Companion>(companions[0]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
    const [isCompanionSelectorOpen, setIsCompanionSelectorOpen] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    
    // Audio clips state
    const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
    
    // Rhyme finder state
    const [rhymeState, setRhymeState] = useState({ isOpen: false, word: '', rhymes: [], isLoading: false, error: null as string | null });

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
                        setProjectTitle(typeof data.title === 'string' ? data.title : 'Untitled Song');
                        setLyrics(typeof data.lyrics === 'string' ? data.lyrics : '');
                        setSuggestion(typeof data.suggestion === 'string' ? data.suggestion : '');
                        setFeedback(typeof data.feedback === 'string' ? data.feedback : '');
                        setCompanion(data.companion || companions[0]);
                        setMessages(Array.isArray(data.messages) ? data.messages : [{ sender: 'greeting', content: (data.companion || companions[0]).greeting }]);
                        setAudioClips(Array.isArray(data.audioClips) ? data.audioClips : []);
                        setActiveTab((data.activeTab === 'editor' || data.activeTab === 'chat' || data.activeTab === 'recordings') ? data.activeTab : 'editor');
                        setIsLoaded(true);
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
    const saveData = useCallback(async () => {
        if (!isLoaded || !auth.currentUser) return;
        setIsSaving(true);
        const path = `users/${auth.currentUser.uid}/projects/${projectId}`;
        try {
            const projectRef = doc(db, 'users', auth.currentUser.uid, 'projects', projectId);
            await updateDoc(projectRef, {
                title: projectTitle,
                lyrics,
                suggestion,
                feedback,
                companion,
                messages,
                audioClips,
                activeTab,
                lastModified: Date.now()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
        } finally {
            setTimeout(() => setIsSaving(false), 1000);
        }
    }, [isLoaded, projectId, projectTitle, lyrics, suggestion, feedback, companion, messages, audioClips, activeTab]);

    // Auto-save on changes (debounced - 5 seconds pause)
    useEffect(() => {
        const timer = setTimeout(() => {
            saveData();
        }, 5000);
        return () => clearTimeout(timer);
    }, [saveData]);

    const handleBack = () => {
        saveData();
        onBack();
    };

    const handleSignOut = () => {
        signOut(auth);
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
    
    const handleSelectRhyme = (rhyme: string) => {
        setLyrics(prev => {
            const lastSpaceIndex = prev.trimEnd().lastIndexOf(' ');
            const newLyrics = lastSpaceIndex === -1 
                ? rhyme 
                : `${prev.substring(0, lastSpaceIndex)} ${rhyme}`;
            return newLyrics + ' ';
        });
    };

    const handleSuggestionRequest = useCallback(async (type: SuggestionType, isRefinement: boolean = false) => {
        setActiveSuggestionType(type);
        if (type === SuggestionType.RHYMES) {
            handleRhymeRequest();
            return;
        }
        if (!lyrics.trim()) {
            setSuggestionError('Please enter some lyrics or record your voice first.');
            return;
        }

        // Clear feedback if this is a fresh request from the main buttons
        if (!isRefinement) {
            setFeedback('');
        }

        setIsSuggestionLoading(true);
        setSuggestionError(null);
        setSuggestion('');
        setGroundingChunks([]);
        
        // Use the current feedback only if it's a refinement request
        const currentFeedback = isRefinement ? feedback : '';
        const result = await getAiSuggestion(lyrics, type, currentFeedback, companion.systemInstruction);
        
        if (result.text.toLowerCase().includes('error occurred')) {
            setSuggestionError(result.text);
        } else {
            setSuggestion(result.text);
            setGroundingChunks(result.groundingChunks || []);
        }
        setIsSuggestionLoading(false);
    }, [lyrics, feedback, companion.systemInstruction]);

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
                            onSave={saveData}
                            isSaving={isSaving}
                        />
                        <SuggestionControls 
                            onSuggestionSelect={handleSuggestionRequest} 
                            isLoading={isSuggestionLoading} 
                            selectedType={activeSuggestionType}
                        />
                        <SuggestionDisplay 
                            suggestion={suggestion} 
                            isLoading={isSuggestionLoading} 
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
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
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
            
            <header className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                         <button onClick={handleBack} className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0" aria-label="Go back">
                            <BackArrowIcon className="w-6 h-6 text-gray-300"/>
                        </button>
                        <input 
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            placeholder="Song Title"
                            className="bg-transparent text-xl md:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded px-2 w-full transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex justify-center">
                    <div className="bg-white/5 p-1 rounded-full flex items-center gap-1">
                        <TabButton icon={<PencilIcon className="w-5 h-5"/>} text="Editor" isActive={activeTab === 'editor'} onClick={() => setActiveTab('editor')} />
                        <TabButton icon={<ChatBubbleIcon className="w-5 h-5"/>} text="Chat" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
                        <TabButton icon={<RecordIcon className="w-5 h-5"/>} text="Recordings" isActive={activeTab === 'recordings'} onClick={() => setActiveTab('recordings')} />
                    </div>
                </div>
            </header>
            
            <main className="w-full flex flex-col gap-6">
                {renderTabContent()}
            </main>
        </div>
    );
};

const TabButton: React.FC<{icon: React.ReactNode, text: string, isActive: boolean, onClick: () => void}> = ({icon, text, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base font-semibold rounded-full flex items-center gap-2 transition-colors ${
            isActive ? 'bg-[#1d2951] text-white' : 'text-gray-300 hover:bg-white/10'
        }`}
    >
        {icon}
        <span className="inline">{text}</span>
    </button>
);


export default Workspace;