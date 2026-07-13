import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Send, Sparkles, Heart, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { mentalHealthAI } from "@/lib/gemini";
import { useAssessment } from "@/contexts/assessment-context";
import { useTranslation } from "react-i18next";

type Message = {
  id: number;
  type: 'bot' | 'user';
  content: string;
  timestamp: string;
};

const Chat = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: t('chat.intro'),
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const { addChatMessage, analyzeChatForAssessment } = useAssessment();

  const quickPrompts = t('chat.quickPrompts', { returnObjects: true }) as string[];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message immediately
    const newUserMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    addChatMessage(newUserMessage);

    // Analyze message for assessment updates
    analyzeChatForAssessment(userMessage);

    try {
      // Get AI response using the new MentalHealthAI
      console.log('Sending to AI:', userMessage);
      const response = await mentalHealthAI.chat(userMessage);
      console.log('AI response:', response);

      const botResponse: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botResponse]);
      addChatMessage(botResponse);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: t('chat.error') || "I'm having trouble responding. Please try again.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen pt-20 pb-8 bg-gradient-calm">
      <div className="container mx-auto px-6 max-w-4xl py-6 pb-24 lg:pb-6">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="text-center animate-fade-in">
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
        </div>

        {/* Chat Interface */}
        <Card className="mindwell-card p-6 mb-6 animate-fade-in">
          <div ref={messagesContainerRef} className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message) => {
              const isCrisisResponse = message.type === 'bot' && message.content.includes('🚨 EMERGENCY NUMBERS');

              return (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-sm lg:max-w-md px-4 py-3 rounded-2xl ${message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-4'
                      : isCrisisResponse
                        ? 'bg-red-50 border-2 border-red-200 text-red-900 mr-4 animate-pulse'
                        : 'bg-secondary text-secondary-foreground mr-4'
                      }`}
                  >
                    {message.type === 'bot' && (
                      <div className="flex items-center mb-2">
                        {isCrisisResponse ? (
                          <Heart className="w-4 h-4 mr-2 text-red-600" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2 text-primary" />
                        )}
                        <span className={`text-xs font-medium ${isCrisisResponse ? 'text-red-600' : 'text-primary'}`}>
                          {isCrisisResponse ? '🚨 Crisis Support' : t('chat.assistant')}
                        </span>
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed ${isCrisisResponse ? 'font-medium' : ''}`}>
                      {message.content}
                    </p>
                    <p className="text-xs opacity-70 mt-2">{message.timestamp}</p>
                  </div>
                </div>
              );
            })}
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-sm lg:max-w-md px-4 py-3 rounded-2xl bg-secondary text-secondary-foreground mr-4">
                  <div className="flex items-center mb-2">
                    <Sparkles className="w-4 h-4 mr-2 text-primary animate-pulse" />
                    <span className="text-xs font-medium text-primary">{t('chat.assistant')}</span>
                  </div>
                  <p className="text-sm leading-relaxed flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Thinking...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t('chat.placeholder')}
                className="mindwell-input flex-1"
              />
              <Button
                onClick={handleSendMessage}
                size="lg"
                className="px-4 rounded-xl"
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

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
          <p>
            {t('chat.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
