import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  lang?: string; // 'ar-DZ', 'ar-SA', 'fr-FR'
  className?: string;
  size?: 'sm' | 'default' | 'icon';
  title?: string;
}

export function VoiceDictationButton({
  onTranscript,
  lang = 'ar-DZ',
  className = '',
  size = 'icon',
  title = 'إملاء صوتي باللغة العربية (Voice Dictation)',
}: VoiceDictationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [lang, onTranscript]);

  const toggleListening = () => {
    if (!isSupported) {
      alert('متصفحك الحالي لا يدعم التعرف الصوتي المباشر. يُرجى استخدام متصفح حديث (Chrome أو Edge).');
      return;
    }

    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={isListening ? 'destructive' : 'ghost'}
      size={size}
      onClick={toggleListening}
      className={`relative transition-all ${
        isListening
          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-sm'
          : 'text-muted-foreground hover:text-navy-900 hover:bg-muted'
      } ${className}`}
      title={isListening ? 'إيقاف التسجيل الصوتي' : title}
      aria-label={isListening ? 'إيقاف التسجيل الصوتي' : title}
    >
      {isListening ? (
        <span className="flex items-center gap-1.5">
          <Mic className="w-4 h-4 animate-bounce" />
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        </span>
      ) : (
        <Mic className="w-4 h-4 text-emerald-600" />
      )}
    </Button>
  );
}
