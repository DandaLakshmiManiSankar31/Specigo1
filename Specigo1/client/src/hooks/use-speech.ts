import { useState, useCallback, useRef, useEffect } from 'react';
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Language codes for speech recognition
const speechLangCodes: Record<string, string> = {
  en: 'en-US',
  te: 'te-IN',
  hi: 'hi-IN'
};

// Language codes for text-to-speech
const ttsLangCodes: Record<string, string> = {
  en: 'en-US',
  te: 'te-IN',
  hi: 'hi-IN'
};

export function useSpeech(language: string = 'en') {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentLang = useRef(language);
  const autoListenAfterSpeech = useRef(true);
  const speakingTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Update ref when language prop changes
  useEffect(() => {
    currentLang.current = language;
  }, [language]);

  // Helper to start listening with correct language
  const doStartListening = useCallback(() => {
    console.log("[STT] Starting listening for language:", currentLang.current);
    resetTranscript();
    const speechLang = speechLangCodes[currentLang.current] || 'en-US';
    console.log("[STT] Speech recognition language:", speechLang);
    
    // Use continuous mode to keep listening until user speaks
    SpeechRecognition.startListening({ 
      continuous: true,  // Keep listening until explicitly stopped
      language: speechLang
    }).then(() => {
      console.log("[STT] startListening promise resolved");
    }).catch((err: unknown) => {
      console.error("[STT] startListening error:", err);
    });
  }, [resetTranscript]);

  // Google Translate TTS fallback via backend proxy for languages without native browser voices
  const speakWithGoogleTTS = useCallback((text: string, lang: string, onFinish: () => void) => {
    console.log("[TTS] Using Google Translate TTS fallback for", lang);
    
    // Split text into chunks (Google TTS has a limit of ~200 chars)
    const maxLength = 180;
    const chunks: string[] = [];
    let remaining = text;
    
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      // Find a good break point
      let breakPoint = remaining.lastIndexOf('.', maxLength);
      if (breakPoint === -1 || breakPoint < maxLength / 2) {
        breakPoint = remaining.lastIndexOf(' ', maxLength);
      }
      if (breakPoint === -1) {
        breakPoint = maxLength;
      }
      chunks.push(remaining.substring(0, breakPoint + 1).trim());
      remaining = remaining.substring(breakPoint + 1).trim();
    }
    
    console.log("[TTS] Split into", chunks.length, "chunks");
    
    let currentChunk = 0;
    let audioElement: HTMLAudioElement | null = null;
    
    const playNextChunk = () => {
      if (currentChunk >= chunks.length) {
        console.log("[TTS] Google TTS finished all chunks");
        onFinish();
        return;
      }
      
      const chunk = chunks[currentChunk];
      console.log("[TTS] Playing chunk", currentChunk + 1, "of", chunks.length);
      
      // Use backend proxy to avoid CORS issues
      const audioUrl = `/api/tts?text=${encodeURIComponent(chunk)}&lang=${lang}`;
      
      audioElement = new Audio(audioUrl);
      
      audioElement.onended = () => {
        console.log("[TTS] Chunk", currentChunk + 1, "finished");
        currentChunk++;
        setTimeout(playNextChunk, 100); // Small delay between chunks
      };
      
      audioElement.onerror = (e) => {
        console.error("[TTS] Google TTS error on chunk", currentChunk + 1, ":", e);
        currentChunk++;
        playNextChunk(); // Try next chunk
      };
      
      audioElement.play().catch(err => {
        console.error("[TTS] Google TTS play error:", err);
        // If playback fails completely, finish
        onFinish();
      });
    };
    
    playNextChunk();
  }, []);

  // Text to Speech - accepts optional language override
  const speak = useCallback((text: string, onEndOrLang?: (() => void) | string, onEndCallback?: () => void) => {
    // Parse arguments - support both speak(text, onEnd) and speak(text, lang, onEnd)
    let langOverride: string | undefined;
    let onEnd: (() => void) | undefined;
    
    if (typeof onEndOrLang === 'string') {
      langOverride = onEndOrLang;
      onEnd = onEndCallback;
    } else {
      onEnd = onEndOrLang;
    }
    
    // Use override language if provided, otherwise use current language
    const effectiveLang = langOverride || currentLang.current;
    const ttsLang = ttsLangCodes[effectiveLang] || 'en-US';
    
    // Update the current language ref if override is provided (for auto-listen after speech)
    if (langOverride) {
      currentLang.current = langOverride;
    }
    
    console.log("[TTS] speak() called with text:", text.substring(0, 30) + "...");
    console.log("[TTS] Language:", ttsLang, "(override:", langOverride, ")");
    
    if (!('speechSynthesis' in window)) {
      console.error("[TTS] Not supported");
      if (onEnd) onEnd();
      return;
    }

    // Clear any existing timeout
    if (speakingTimeout.current) {
      clearTimeout(speakingTimeout.current);
      speakingTimeout.current = null;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    
    const finishSpeaking = () => {
      console.log("[TTS] Finished speaking, onEnd:", !!onEnd, "autoListen:", autoListenAfterSpeech.current);
      if (speakingTimeout.current) {
        clearTimeout(speakingTimeout.current);
        speakingTimeout.current = null;
      }
      setIsSpeaking(false);
      if (onEnd) {
        console.log("[TTS] Calling onEnd callback");
        onEnd();
      } else if (autoListenAfterSpeech.current) {
        console.log("[TTS] Will auto-start listening in 800ms");
        setTimeout(() => {
          console.log("[TTS] Auto-starting microphone");
          doStartListening();
        }, 800);
      }
    };
    
    // Get voices and speak
    const voices = window.speechSynthesis.getVoices();
    
    // Find matching voice
    let matchingVoice = voices.find(v => v.lang === ttsLang);
    if (!matchingVoice) {
      const langPrefix = ttsLang.split('-')[0];
      matchingVoice = voices.find(v => v.lang.startsWith(langPrefix));
    }
    if (!matchingVoice) {
      matchingVoice = voices.find(v => 
        v.name.toLowerCase().includes('google') && 
        v.lang.startsWith(ttsLang.split('-')[0])
      );
    }
    
    // If no matching voice found for Telugu/Hindi, use Google Translate TTS
    if (!matchingVoice && (effectiveLang === 'te' || effectiveLang === 'hi')) {
      console.log("[TTS] No native voice for", effectiveLang, "- using Google TTS fallback");
      speakWithGoogleTTS(text, effectiveLang, finishSpeaking);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsLang;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
      console.log("[TTS] Using voice:", matchingVoice.name);
    } else {
      console.log("[TTS] No matching voice for", ttsLang);
    }
    
    utterance.onstart = () => {
      console.log("[TTS] Started speaking");
    };
    
    utterance.onend = () => {
      console.log("[TTS] onend event fired");
      finishSpeaking();
    };
    
    utterance.onerror = (e) => {
      console.error("[TTS] Error:", e.error);
      // "interrupted" fires when we call cancel() to start a new utterance — ignore it,
      // the new speak() call manages its own lifecycle
      if (e.error === 'interrupted') return;
      finishSpeaking();
    };

    // Set a timeout fallback in case onend never fires
    const estimatedDuration = Math.max(3000, text.length * 100);
    speakingTimeout.current = setTimeout(() => {
      console.log("[TTS] Timeout reached, forcing finish");
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      finishSpeaking();
    }, estimatedDuration);

    // Try to speak
    window.speechSynthesis.speak(utterance);
    
    // Chrome bug workaround: resume if paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, [doStartListening, speakWithGoogleTTS]);

  const startListening = useCallback(() => {
    if (isSpeaking) return;
    doStartListening();
  }, [doStartListening, isSpeaking]);

  const stopListening = useCallback(() => {
    SpeechRecognition.stopListening();
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speakingTimeout.current) {
      clearTimeout(speakingTimeout.current);
      speakingTimeout.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Speak an array of sentences one after another, then auto-listen
  const speakSentences = useCallback((sentences: string[], lang?: string) => {
    if (!sentences || sentences.length === 0) return;

    const speakNext = (index: number) => {
      if (index >= sentences.length) return;
      const isLast = index === sentences.length - 1;
      if (isLast) {
        // Last sentence: let speak() handle auto-listen normally
        speak(sentences[index], lang || currentLang.current);
      } else {
        // Chain to next sentence on completion
        speak(sentences[index], lang || currentLang.current, () => {
          speakNext(index + 1);
        });
      }
    };

    speakNext(0);
  }, [speak]);

  const setAutoListen = useCallback((value: boolean) => {
    autoListenAfterSpeech.current = value;
  }, []);

  return {
    transcript,
    listening,
    isSpeaking,
    startListening,
    stopListening,
    resetTranscript,
    speak,
    speakSentences,
    stopSpeaking,
    setAutoListen,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  };
}
