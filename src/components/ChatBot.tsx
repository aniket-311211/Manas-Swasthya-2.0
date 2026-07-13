import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Send, Sparkles, Heart, Loader2, Mic, MicOff, AlertCircle, Upload, FileAudio, X } from "lucide-react";
import { geminiService, ChatMessage } from "@/lib/gemini";
import { useTranslation } from "react-i18next";

// TypeScript interfaces for speech recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

const ChatBot = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: t('chat.intro'),
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Speech recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Audio file state
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const quickPrompts = (t('chat.quickPrompts', { returnObjects: true }) as string[]) || [];

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        setInputValue(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setSpeechError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setSpeechError(null);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Audio file handling functions
  const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        setAudioError('Please select a valid audio file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setAudioError('Audio file size must be less than 10MB');
        return;
      }

      setSelectedAudioFile(file);
      setAudioError(null);
    }
  };

  const removeSelectedAudio = () => {
    setSelectedAudioFile(null);
    setAudioError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processAudioFile = async () => {
    if (!selectedAudioFile) return;

    setIsProcessingAudio(true);
    setAudioError(null);

    try {
      // Convert audio file to base64
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:audio/...;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedAudioFile);
      });

      // Add user message indicating audio input
      const audioMessage = {
        id: messages.length + 1,
        type: 'user' as const,
        content: `🎵 Audio Assessment: ${selectedAudioFile.name}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, audioMessage]);

      // Process audio with Gemini using assessment-focused prompt
      setStreamingText("🔍 Analyzing your audio for mental health assessment...");
      await geminiService.sendMessageStream(
        `I've received an audio message from a student for mental health assessment. Please analyze this audio content and provide a comprehensive assessment response. 

The audio file is encoded in base64 format: ${base64Audio}

Please provide:
1. Emotional state assessment based on tone, pace, and content
2. Stress level indicators you can detect
3. Specific concerns or challenges mentioned
4. Recommended coping strategies
5. Whether professional help might be beneficial
6. Encouragement and support

Respond as Manas Svasthya, the compassionate AI mental health companion, with empathy and practical guidance.`,
        (chunk) => {
          setStreamingText((prev) => (prev === "🔍 Analyzing your audio for mental health assessment..." ? chunk : prev + chunk));
        },
        (fullText) => {
          const botResponse = {
            id: Date.now(),
            type: 'bot' as const,
            content: fullText,
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, botResponse]);
          setStreamingText("");
        },
        (err) => {
          console.error('Audio processing error:', err);
          const errorResponse = {
            id: Date.now(),
            type: 'bot' as const,
            content: 'I apologize, but I encountered an error processing your audio message. This could be due to audio quality, format, or technical issues. Please try recording again or use text input to share your thoughts with me.',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, errorResponse]);
          setStreamingText("");
        }
      );

      // Clear selected file after processing
      removeSelectedAudio();
    } catch (error) {
      console.error('Error processing audio:', error);
      setAudioError('Failed to process audio file. Please try again.');
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const newUserMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newUserMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Stream response
      setStreamingText("...");
      await geminiService.sendMessageStream(
        currentInput,
        (chunk) => {
          setStreamingText((prev) => (prev === "..." ? chunk : prev + chunk));
        },
        (fullText) => {
          const botResponse = {
            id: Date.now(),
            type: 'bot' as const,
            content: fullText,
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, botResponse]);
          setStreamingText("");
        },
        (err) => {
          console.error('Streaming error:', err);
          const errorResponse = {
            id: Date.now(),
            type: 'bot' as const,
            content: t('chat.error'),
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, errorResponse]);
          setStreamingText("");
        }
      );
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: t('chat.error'),
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorResponse]);
      setStreamingText("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen pt-20 pb-8 bg-gradient-calm">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Brain className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('chat.title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('chat.subtitle')}
          </p>
        </div>

        {/* Chat Interface */}
        <Card className="mindwell-card p-6 mb-6 animate-fade-in">
          <div ref={messagesContainerRef} className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm lg:max-w-md px-4 py-3 rounded-2xl ${message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-4'
                      : 'bg-secondary text-secondary-foreground mr-4'
                    }`}
                >
                  {message.type === 'bot' && (
                    <div className="flex items-center mb-2">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-xs font-medium text-primary">{t('chat.assistant')}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">{message.timestamp}</p>
                </div>
              </div>
            ))}
            {streamingText && (
              <div className="flex justify-start">
                <div
                  className={`max-w-sm lg:max-w-md px-4 py-3 rounded-2xl bg-secondary text-secondary-foreground mr-4`}
                >
                  <div className="flex items-center mb-2">
                    <Sparkles className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-xs font-medium text-primary">{t('chat.assistant')}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingText}</p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            {/* Error Displays */}
            {speechError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{speechError}</span>
              </div>
            )}

            {audioError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{audioError}</span>
              </div>
            )}

            {/* Speech Not Supported Message */}
            {!isSpeechSupported && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Speech input not supported in this browser</span>
              </div>
            )}

            {/* Selected Audio File Display */}
            {selectedAudioFile && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FileAudio className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 flex-1">{selectedAudioFile.name}</span>
                <Button
                  onClick={removeSelectedAudio}
                  size="sm"
                  variant="ghost"
                  className="p-1 h-auto text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t('chat.placeholder')}
                  className="pl-10 mindwell-input flex-1"
                  disabled={isProcessingAudio}
                />
              </div>

              {/* Audio Upload Button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="lg"
                className="px-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white"
                disabled={isLoading || isProcessingAudio}
              >
                <Upload className="w-4 h-4" />
              </Button>

              {/* Microphone Button */}
              {isSpeechSupported && (
                <Button
                  onClick={toggleRecording}
                  size="lg"
                  className={`px-4 rounded-xl ${isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                  disabled={isLoading || isProcessingAudio}
                >
                  {isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              )}

              <Button
                onClick={handleSendMessage}
                size="lg"
                className="px-4 rounded-xl"
                disabled={!inputValue.trim() || isLoading || isProcessingAudio}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Process Audio Button */}
            {selectedAudioFile && (
              <div className="flex justify-center">
                <Button
                  onClick={processAudioFile}
                  disabled={isProcessingAudio || isLoading}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                >
                  {isProcessingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Audio...
                    </>
                  ) : (
                    <>
                      <FileAudio className="w-4 h-4 mr-2" />
                      Analyze Audio
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 text-red-500 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Recording... Speak now</span>
              </div>
            )}
          </div>
        </Card>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleAudioFileSelect}
          className="hidden"
        />

        {/* Quick Prompts */}
        <Card className="mindwell-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-therapeutic-warm" />
            {t('chat.quick')}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleQuickPrompt(prompt)}
                className="text-left justify-start h-auto py-3 px-4 rounded-xl hover:bg-accent/50"
              >
                {prompt}
              </Button>
            ))}
          </div>
        </Card>

        {/* Disclaimer */}
        <div className="text-center mt-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p>{t('chat.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;