import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

export function useVoiceInput(onTranscript) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("Microphone Active — Speak Now...");
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setIsListening(false);
        if (onTranscript && text) {
          onTranscript(text);
          toast.success("Voice Received!");
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        console.warn("Speech recognition error:", event.error);
        toast.error("Speech recognition error. Please try typing.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Browser speech recognition not supported. Please use text input.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Already started recognition:", err);
      }
    }
  };

  return { isListening, toggleListening };
}
