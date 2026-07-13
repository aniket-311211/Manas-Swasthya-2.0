import React, { useState, useEffect, ReactNode } from 'react';
import { AssessmentData, ChatMessage } from '@/types/assessment';
import { AssessmentContext } from './assessment-context';

const defaultAssessment: AssessmentData = {
  stress: 3,
  anxiety: 2,
  sleepQuality: 4,
  lastUpdated: new Date().toLocaleDateString(),
  chatHistory: []
};

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assessmentData, setAssessmentData] = useState<AssessmentData>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('assessmentData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultAssessment;
      }
    }
    return defaultAssessment;
  });

  // Save to localStorage whenever assessment data changes
  useEffect(() => {
    localStorage.setItem('assessmentData', JSON.stringify(assessmentData));
  }, [assessmentData]);

  const updateAssessment = (updates: Partial<AssessmentData>) => {
    setAssessmentData(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toLocaleDateString()
    }));
  };

  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString()
    };

    setAssessmentData(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, newMessage]
    }));
  };

  const analyzeChatForAssessment = (message: string) => {
    const lowerMessage = message.toLowerCase();
    const updates: Partial<AssessmentData> = {};

    // Simple keyword-based analysis for demonstration
    // In a real app, this would be more sophisticated
    
    // Stress indicators
    if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed') || 
        lowerMessage.includes('pressure') || lowerMessage.includes('deadline')) {
      updates.stress = Math.min(5, assessmentData.stress + 0.5);
    } else if (lowerMessage.includes('relaxed') || lowerMessage.includes('calm') || 
               lowerMessage.includes('better') || lowerMessage.includes('improved')) {
      updates.stress = Math.max(1, assessmentData.stress - 0.3);
    }

    // Anxiety indicators
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || 
        lowerMessage.includes('nervous') || lowerMessage.includes('panic')) {
      updates.anxiety = Math.min(5, assessmentData.anxiety + 0.5);
    } else if (lowerMessage.includes('confident') || lowerMessage.includes('secure') || 
               lowerMessage.includes('peaceful')) {
      updates.anxiety = Math.max(1, assessmentData.anxiety - 0.3);
    }

    // Sleep quality indicators
    if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || 
        lowerMessage.includes('insomnia') || lowerMessage.includes('can\'t sleep')) {
      updates.sleepQuality = Math.max(1, assessmentData.sleepQuality - 0.5);
    } else if (lowerMessage.includes('rested') || lowerMessage.includes('slept well') || 
               lowerMessage.includes('good sleep')) {
      updates.sleepQuality = Math.min(5, assessmentData.sleepQuality + 0.3);
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      updateAssessment(updates);
    }
  };

  return (
    <AssessmentContext.Provider value={{
      assessmentData,
      updateAssessment,
      addChatMessage,
      analyzeChatForAssessment
    }}>
      {children}
    </AssessmentContext.Provider>
  );
};
