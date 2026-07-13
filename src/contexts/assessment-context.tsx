import { createContext, useContext } from 'react';
import { AssessmentData, ChatMessage } from '@/types/assessment';

export interface AssessmentContextType {
  assessmentData: AssessmentData;
  updateAssessment: (updates: Partial<AssessmentData>) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  analyzeChatForAssessment: (message: string) => void;
}

export const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
