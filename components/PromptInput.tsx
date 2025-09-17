
import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, MicrophoneIcon, UndoIcon } from './icons';

// Fix: Add type definitions for the Web Speech API to resolve TypeScript errors.
// These experimental APIs are not included in the default TypeScript DOM library.
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly item: (index: number) => SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onUndo: () => void;
  hasContent: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onSubmit, isLoading, onUndo, hasContent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    return () => {
      recognition.stop();
    };
  }, [isSpeechRecognitionSupported, setPrompt]);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setPrompt(''); // Clear prompt before starting new recording
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isRecording ? "Listening..." : "a fairy cottage made of candy..."}
        aria-label="Describe your dream mini house"
        aria-describedby="prompt-heading"
        className="w-full h-24 sm:h-14 p-4 text-lg bg-sky-900 text-white placeholder-sky-400 border-2 border-sky-700 rounded-xl focus:ring-4 focus:ring-yellow-300 focus:border-yellow-500 transition-all duration-300 resize-none"
        disabled={isLoading}
      />
      {isSpeechRecognitionSupported && (
        <button
          onClick={handleToggleRecording}
          disabled={isLoading}
          aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
          className={`flex-shrink-0 w-16 h-16 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl shadow-md transform hover:scale-105 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-100 ${
            isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-sky-600 text-white hover:bg-sky-700'
          }`}
        >
          <MicrophoneIcon className="w-7 h-7" aria-hidden="true" />
        </button>
      )}
      {hasContent && !isLoading && (
          <button
            onClick={onUndo}
            disabled={isLoading}
            aria-label="Undo and start over"
            className="flex-shrink-0 w-16 h-16 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl shadow-md transform hover:scale-105 transition-all duration-300 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <UndoIcon className="w-7 h-7" aria-hidden="true" />
          </button>
      )}
      <button
        onClick={onSubmit}
        disabled={isLoading || !prompt.trim()}
        aria-label="Create house design"
        className="w-full sm:w-auto flex-shrink-0 bg-yellow-400 text-sky-900 font-bold text-lg px-8 py-4 rounded-xl shadow-md hover:bg-yellow-500 transform hover:scale-105 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-sky-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Building...
          </span>
        ) : (
          <>
            <SparklesIcon className="w-6 h-6" aria-hidden="true" />
            Create!
          </>
        )}
      </button>
    </div>
  );
};
