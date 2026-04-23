"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(localStorage.getItem('preferred_voice_uri'));
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      if (!localStorage.getItem('preferred_voice_uri') && availableVoices.length > 0) {
        const defaultVoice = availableVoices.find(v => v.name.includes('Google') || v.name.includes('Female')) || availableVoices[0];
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
  }, []);

  const setVoice = (uri: string) => {
    setSelectedVoiceURI(uri);
    localStorage.setItem('preferred_voice_uri', uri);
  };

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if (!window.speechSynthesis) return;
    
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    const currentVoices = window.speechSynthesis.getVoices();
    const voice = currentVoices.find(v => v.voiceURI === selectedVoiceURI);
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  }, [selectedVoiceURI, stopSpeaking]);

  const listen = useCallback((onResult: (text: string) => void, lang: string = 'en-US') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    // Interrupt AI if it's speaking
    stopSpeaking();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      stopSpeaking(); // Double check interruption
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      // If we get any interim result that has content, stop the AI immediately
      if (event.results.length > 0) {
        stopSpeaking();
      }

      if (event.results[0].isFinal) {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [stopSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { 
    isListening, 
    isSpeaking, 
    voices, 
    selectedVoiceURI, 
    setVoice, 
    speak, 
    listen, 
    stopListening, 
    stopSpeaking 
  };
};