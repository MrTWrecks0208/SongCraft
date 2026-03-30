import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { SaveIcon } from './icons/SaveIcon';

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
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
  const [isRecording, setIsRecording] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  useImperativeHandle(ref, () => ({
    toggleRecording,
    textareaRef,
  }));

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
                    <span className="text-xs text-purple-400 animate-pulse font-medium">Autosaving...</span>
                )}
            </div>
            <button 
                onClick={handleSaveClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                    justSaved 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white/10 hover:bg-white/20 text-gray-300'
                }`}
                disabled={justSaved || isSaving}
            >
                <SaveIcon className="w-4 h-4" />
                {justSaved ? 'Saved!' : 'Save Song'}
            </button>
       </div>
      <div className="relative flex-grow p-4 pt-2">
          <textarea
            id="lyrics"
            ref={textareaRef}
            value={value}
            onChange={onChange}
            placeholder="Start writing your lyrics or use the dictate button..."
            className={`${commonClasses} text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 pl-2 caret-purple-400 relative z-10 p-0`}
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
    </div>
  );
});

export default LyricEditor;
