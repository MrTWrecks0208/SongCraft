import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { SaveIcon } from './icons/SaveIcon';
import { Loader2, ChevronRight } from 'lucide-react';
import { recognizeHandwriting } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Camera } from './icons/CameraIcon';

// Add type definitions for the non-standard SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Check for SpeechRecognition API
const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const isSpeechRecognitionSupported = !!SpeechRecognition;

interface LyricEditorProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement> | { target: { value: string, id: string } }) => void;
  onTranscriptUpdate: (transcript: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export interface LyricEditorHandles {
  toggleRecording: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const LyricEditor = forwardRef<LyricEditorHandles, LyricEditorProps>(({ value, onChange, onTranscriptUpdate, onSave, isSaving }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const recognitionRef = useRef<any>(null);
  
  const tutorialSlides = [
    {
      title: "Snap a Photo",
      description: "Use your camera to take a clear, well-lit picture of your handwritten lyrics.",
      icon: <Camera className="w-12 h-12 text-pink-600 actice:text-white animate-pulse" />
    },
    {
      title: "AI Analysis",
      description: "Our advanced AI deciphers your handwriting and converts it into digital text in seconds.",
      icon: <Loader2 className="w-12 h-12 text-accent animate-spin" />
    },
    {
      title: "Instant Digitization",
      description: "Your lyrics will appear right here in the editor, ready for you to refine and enhance.",
      icon: <SaveIcon className="w-12 h-12 text-emerald-600 animate-bounce" />
    }
  ];

  const handleImportClick = () => {
    const hasSeenTutorial = localStorage.getItem('hasSeenImportTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      setCurrentSlide(0);
    } else {
      fileInputRef.current?.click();
    }
  };

  const completeTutorial = () => {
    localStorage.setItem('hasSeenImportTutorial', 'true');
    setShowTutorial(false);
    fileInputRef.current?.click();
  };
  
  useImperativeHandle(ref, () => ({
    toggleRecording,
    textareaRef,
  }));

  const handleImportLyrics = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64Image = await base64Promise;

      const digitizedLyrics = await recognizeHandwriting(base64Image, file.type);

      if (!digitizedLyrics.trim()) {
        alert("Could not find any lyrics in the image. Please try a clearer picture.");
        return;
      }

      // Update lyrics in the editor
      onChange({ target: { value: digitizedLyrics, id: 'lyrics' } });
      
    } catch (error) {
      console.error("Error importing lyrics:", error);
      alert(error instanceof Error ? error.message : "Failed to import lyrics.");
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      console.warn("SpeechRecognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscriptUpdate(finalTranscript);
      }
    };
    
    recognition.onerror = (event) => {
        console.error("SpeechRecognition error:", event.error);
        setIsRecording(false);
    }
    
    recognition.onend = () => {
        if (recognitionRef.current && (recognitionRef.current as any)._started) {
             try {
                recognition.start();
             } catch(e) {
                setIsRecording(false);
             }
        } else {
            setIsRecording(false);
        }
    }

    recognitionRef.current = recognition;

    return () => {
      if(recognitionRef.current) {
        (recognitionRef.current as any)._started = false;
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscriptUpdate]);

  const handleSaveClick = () => {
    onSave();
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
    }, 2000);
  }

  const toggleRecording = () => {
    if (!isSpeechRecognitionSupported) {
      alert("Sorry, your browser doesn't support speech recognition. Try Chrome or Edge.");
      return;
    }
    
    if (recognitionRef.current) {
        if (isRecording) {
          (recognitionRef.current as any)._started = false;
          recognitionRef.current.stop();
          setIsRecording(false);
        } else {
          try {
            (recognitionRef.current as any)._started = true;
            recognitionRef.current.start();
            setIsRecording(true);
          } catch (e) {
            console.error("Could not start recording:", e);
             setIsRecording(false);
          }
        }
    }
  };

  const commonClasses = "w-full flex-grow bg-transparent rounded-lg p-4 text-base leading-relaxed resize-none min-h-[300px] sm:min-h-[400px] font-sans whitespace-pre-wrap break-words transition duration-200";

  return (
    <div className="bg-white/5 rounded-xl shadow-lg h-full flex flex-col">
       <div className="flex justify-between items-center p-4 pt-4 pb-1">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-300">Lyrics</h2>
                {isSaving && (
                    <span className="text-xs text-accent-light animate-pulse font-medium">Autosaving...</span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleImportClick}
                    disabled={isOcrLoading}
                    className="group flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold active:text-white active:bg-pink-600 bg-white/10 hover:border-1 hover:border-pink-600 group-active:bg-pink-500 text-white transition-all duration-300 disabled:opacity-50"
                    title="Import handwritten lyrics"
                >
                    {isOcrLoading ? (
                        <Loader2 className="w-5 h-5 group-hover:animate-spin" />
                    ) : (
                        <Camera className="w-5 h-5 active:text-white group-hover:animate-pulse" />
                    )}
                    {isOcrLoading ? 'Importing...' : 'Import'}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportLyrics}
                    accept="image/*"
                    className="hidden"
                />
                <button 
                    onClick={handleSaveClick}
                    className={`group flex items-center hover:border-1 hover:border-emerald-600 active:bg-emerald-600 text-white gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                        justSaved 
                            ? 'bg-emerald-600' 
                            : 'bg-white/10'
                    }`}
                    disabled={justSaved || isSaving}
                >
                    <SaveIcon className={`w-5 h-5 group-active:text-white hover:animate-bounce ${justSaved ? 'text-white' : 'text-emerald-600'}`} />
                    <span className="text-white">{justSaved ? 'Saved!' : 'Save'}</span>
                </button>
            </div>
       </div>
      <div className="relative flex-grow p-4 pt-2">
          <textarea
            id="lyrics"
            ref={textareaRef}
            value={value}
            onChange={onChange}
            placeholder="Start writing your lyrics or use the dictate button..."
            className={`${commonClasses} text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent pl-2 caret-accent-light relative z-10 p-0`}
            spellCheck="true"
          />
          {isSpeechRecognitionSupported && (
            <div className="absolute bottom-6 right-6 flex flex-col items-end group">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-[10px] text-gray-300 bg-black/60 px-2 py-1 rounded backdrop-blur-sm mb-2 mr-4 whitespace-nowrap">
                Recording not saved as audio
              </span>
              <button
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 z-20 shadow-lg mr-4 mb-4 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/50 animate-pulse'
                    : 'bg-gray-700 hover:bg-gray-500 focus:ring-gray-500/50'
                }`}
                aria-label={isRecording ? 'Stop dictating' : 'Start dictating'}
              >
                {isRecording ? (
                  <>
                    <StopIcon className="w-5 h-5" />
                    <span className="text-sm font-bold">Stop Dictating</span>
                  </>
                ) : (
                  <>
                    <MicrophoneIcon className="w-5 h-5" />
                    <span className="text-sm font-bold">Speak Lyrics</span>
                  </>
                )}
              </button>
            </div>
          )}
      </div>

      {/* Onboarding Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-main border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 flex flex-col items-center text-center">
                <div className="mb-8 p-6 bg-white/5 rounded-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {tutorialSlides[currentSlide].icon}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-[120px]"
                  >
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {tutorialSlides[currentSlide].title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {tutorialSlides[currentSlide].description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex gap-2 mt-8 mb-8">
                  {tutorialSlides.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentSlide ? 'w-8 bg-accent' : 'w-2 bg-white/10'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex w-full gap-3">
                  {currentSlide === 0 && (
                    <>
                      <button
                        onClick={() => setShowTutorial(false)}
                        className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl transition-all"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => setCurrentSlide(1)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/20"
                      >
                        Next
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {currentSlide === 1 && (
                    <button
                      onClick={() => setCurrentSlide(2)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/20"
                    >
                      Next
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {currentSlide === 2 && (
                    <>
                      <button
                        onClick={() => setShowTutorial(false)}
                        className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={completeTutorial}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/20"
                      >
                        Next
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default LyricEditor;
