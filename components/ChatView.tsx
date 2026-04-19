import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  companionName: string;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

const ChatView: React.FC<ChatViewProps> = ({ messages, onSendMessage, isLoading, companionName }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const baseTextForTranscriptRef = useRef('');


  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
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
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInput(baseTextForTranscriptRef.current + transcript);
    };
    
    recognition.onerror = (event) => {
        console.error("SpeechRecognition error:", event.error);
        setIsRecording(false);
    }
    
    recognition.onend = () => {
        setIsRecording(false);
    }

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (input.trim() && !isLoading) {
      if (isRecording) {
        recognitionRef.current?.stop();
      }
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event as any);
    }
  };

  const toggleRecording = () => {
    if (!isSpeechRecognitionSupported) {
      alert("Sorry, your browser doesn't support speech recognition. Try Chrome or Edge.");
      return;
    }
    
    if (recognitionRef.current) {
        if (isRecording) {
          recognitionRef.current.stop();
        } else {
          baseTextForTranscriptRef.current = input ? `${input.trim()} ` : '';
          setInput(baseTextForTranscriptRef.current);
          try {
            recognitionRef.current.start();
            setIsRecording(true);
          } catch (e) {
            console.error("Could not start recording:", e);
          }
        }
    }
  };


  return (
    <div className="bg-white/5 rounded-xl shadow-lg flex flex-col h-[75vh]">
      <div ref={scrollContainerRef} className="flex-grow p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 ${
                  msg.sender === 'user'
                    ? 'bg-main text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-200 rounded-bl-none'
              }`}>
                 <div className="markdown-body prose prose-invert prose-p:text-gray-300 prose-p:mb-4 last:prose-p:mb-0 prose-strong:text-gray-100 prose-headings:text-transparent prose-headings:bg-clip-text prose-headings:bg-gradient-to-r prose-headings:from-accent-light prose-headings:to-accent prose-li:text-gray-300">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
               <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3 bg-gray-700 text-gray-200 rounded-bl-none">
                <div className="flex items-center gap-2">
                    <SpinnerIcon className="w-5 h-5"/>
                    <span>{companionName} is typing...</span>
                </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Listening...' : `Ask ${companionName} for ideas...`}
            className="w-full bg-gray-900/50 border-pink-600 rounded-lg p-3 text-gray-200 focus:border-pink-500 transition duration-200 resize-none"
            rows={1}
            disabled={isLoading}
          />
          {isSpeechRecognitionSupported && (
            <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-full text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                    isRecording 
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                        : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                }`}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
                {isRecording ? <StopIcon className="w-6 h-6"/> : <MicrophoneIcon className="w-6 h-6"/>}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-main rounded-full text-white hover:bg-main-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-6 h-6"/>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
