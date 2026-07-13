import { geminiService } from './gemini';

// Assessment data interface for AI analysis
export interface AssessmentData {
  stress: number;
  anxiety: number;
  sleep: number;
  responses: string[];
  timestamp: Date;
}

// Resource recommendation interface
export interface ResourceRecommendation {
  id: number;
  title: string;
  type: string;
  category: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

// Booking advisor recommendation
export interface BookingRecommendation {
  consultantId: number;
  consultantName: string;
  specialty: string;
  reason: string;
  urgency: 'urgent' | 'recommended' | 'optional';
  confidence: number;
}

// Personalized questions for different contexts
export interface PersonalizedQuestion {
  id: string;
  text: string;
  context: 'resource' | 'booking' | 'followup' | 'wellness';
  category: string;
  priority: number;
}

export interface BaseResource {
  id: number;
  title: string;
  type: string;
  category: string;
  tags: string[];
  [key: string]: unknown;
}

export interface BaseConsultant {
  id: number;
  name: string;
  specialty: string;
  location?: string;
  languages?: string[];
  [key: string]: unknown;
}

export class AIAdvisoryService {
  // Analyze assessment data and provide comprehensive insights
  async analyzeAssessmentData(assessmentData: AssessmentData): Promise<{
    insights: string;
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
    nextSteps: string[];
  }> {
    const prompt = `As a mental health AI advisor, analyze this assessment data and provide comprehensive insights:

Assessment Scores:
- Stress Level: ${assessmentData.stress}/10
- Anxiety Level: ${assessmentData.anxiety}/10
- Sleep Quality: ${assessmentData.sleep}/10

User Responses:
${assessmentData.responses.map((response, index) => `${index + 1}. ${response}`).join('\n')}

Provide a detailed analysis in this JSON format:
{
  "insights": "Comprehensive analysis of the user's mental health state based on scores and responses",
  "recommendations": ["Specific actionable recommendations", "Tailored advice based on scores"],
  "riskLevel": "low/medium/high based on assessment",
  "nextSteps": ["Immediate actions to take", "Follow-up recommendations"]
}

Consider:
- Individual score patterns and combinations
- Response content and emotional indicators
- Personalized advice for college students
- Practical, actionable suggestions
- When to seek professional help`;

    try {
      const response = await geminiService.sendMessage(prompt);
      const cleanResponse = this.cleanJSONResponse(response);
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error analyzing assessment data:', error);
      return {
        insights: "Your assessment shows areas where focused attention could be beneficial for your well-being.",
        recommendations: [
          "Consider practicing regular stress management techniques",
          "Establish a consistent sleep routine",
          "Connect with campus mental health resources"
        ],
        riskLevel: assessmentData.stress > 7 || assessmentData.anxiety > 7 ? 'high' : 'medium',
        nextSteps: [
          "Schedule time for self-care activities",
          "Consider speaking with a counselor if symptoms persist"
        ]
      };
    }
  }

  // Generate personalized resource recommendations based on user data
  async generateResourceRecommendations(
    assessmentData: AssessmentData,
    availableResources: BaseResource[]
  ): Promise<ResourceRecommendation[]> {
    const prompt = `As a mental health resource advisor, analyze the user's assessment data and recommend the most suitable resources:

User Assessment:
- Stress: ${assessmentData.stress}/10
- Anxiety: ${assessmentData.anxiety}/10  
- Sleep: ${assessmentData.sleep}/10

Recent Responses: ${assessmentData.responses.slice(-3).join(', ')}

Available Resources:
${availableResources.map(resource => 
  `ID: ${resource.id}, Title: "${resource.title}", Type: ${resource.type}, Category: ${resource.category}, Tags: ${resource.tags.join(', ')}`
).join('\n')}

Recommend 3-5 most suitable resources in JSON format:
[
  {
    "id": resource_id,
    "title": "resource_title",
    "type": "resource_type", 
    "category": "resource_category",
    "reason": "Specific explanation why this resource is recommended for this user",
    "priority": "high/medium/low",
    "confidence": confidence_score_0_to_100
  }
]

Prioritize resources that:
- Address the user's highest concern areas
- Match their stress/anxiety/sleep patterns
- Are appropriate for college students
- Provide immediate practical benefit`;

    try {
      const response = await geminiService.sendMessage(prompt);
      const cleanResponse = this.cleanJSONResponse(response);
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error generating resource recommendations:', error);
      return this.generateFallbackResourceRecommendations(assessmentData, availableResources);
    }
  }

  // Generate personalized booking recommendations
  async generateBookingRecommendations(
    assessmentData: AssessmentData,
    availableConsultants: BaseConsultant[]
  ): Promise<BookingRecommendation[]> {
    const prompt = `As a mental health consultant advisor, analyze the user's assessment and recommend the most suitable consultants:

User Assessment:
- Stress: ${assessmentData.stress}/10
- Anxiety: ${assessmentData.anxiety}/10
- Sleep: ${assessmentData.sleep}/10

Recent User Responses: ${assessmentData.responses.slice(-3).join(', ')}

Available Consultants:
${availableConsultants.map(consultant => 
  `ID: ${consultant.id}, Name: "${consultant.name}", Specialty: ${consultant.specialty}, Location: ${consultant.location}, Languages: ${consultant.languages.join(', ')}`
).join('\n')}

Recommend 2-3 most suitable consultants in JSON format:
[
  {
    "consultantId": consultant_id,
    "consultantName": "consultant_name",
    "specialty": "consultant_specialty",
    "reason": "Detailed explanation why this consultant is recommended for this user's specific needs",
    "urgency": "urgent/recommended/optional",
    "confidence": confidence_score_0_to_100
  }
]

Consider:
- User's primary concerns (stress/anxiety/sleep)
- Severity of symptoms
- Consultant expertise alignment
- Language preferences if indicated`;

    try {
      const response = await geminiService.sendMessage(prompt);
      const cleanResponse = this.cleanJSONResponse(response);
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error generating booking recommendations:', error);
      return this.generateFallbackBookingRecommendations(assessmentData, availableConsultants);
    }
  }

  // Generate personalized questions for different contexts
  async generatePersonalizedQuestions(
    context: 'resource' | 'booking' | 'followup' | 'wellness',
    assessmentData?: AssessmentData,
    additionalContext?: string
  ): Promise<PersonalizedQuestion[]> {
    const contextPrompts = {
      resource: "Generate thoughtful questions to help users discover the most suitable mental health resources",
      booking: "Generate questions to help users identify their consultation needs and match with appropriate consultants",
      followup: "Generate follow-up questions based on previous assessment to track progress and adjust recommendations",
      wellness: "Generate general wellness check-in questions for ongoing mental health monitoring"
    };

    const prompt = `${contextPrompts[context]}

${assessmentData ? `
Previous Assessment Data:
- Stress: ${assessmentData.stress}/10
- Anxiety: ${assessmentData.anxiety}/10
- Sleep: ${assessmentData.sleep}/10
Recent responses: ${assessmentData.responses.slice(-2).join(', ')}
` : ''}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate 3-5 personalized questions in JSON format:
[
  {
    "id": "unique_question_id",
    "text": "Thoughtful, specific question text",
    "context": "${context}",
    "category": "specific_category_like_stress_anxiety_sleep",
    "priority": priority_number_1_to_5
  }
]

Questions should be:
- Personally relevant based on assessment data
- Open-ended to encourage reflection
- Culturally sensitive for college students
- Actionable and insightful`;

    try {
      const response = await geminiService.sendMessage(prompt);
      const cleanResponse = this.cleanJSONResponse(response);
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error generating personalized questions:', error);
      return this.generateFallbackQuestions(context);
    }
  }

  // Generate contextual advice for specific user situations
  async generateContextualAdvice(
    situation: string,
    assessmentData?: AssessmentData,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{
    advice: string;
    actions: string[];
    resources: string[];
    followUp: string;
  }> {
    const prompt = `As a compassionate mental health advisor, provide specific advice for this situation:

Situation: ${situation}

${assessmentData ? `
User's Mental Health Context:
- Stress Level: ${assessmentData.stress}/10
- Anxiety Level: ${assessmentData.anxiety}/10
- Sleep Quality: ${assessmentData.sleep}/10
` : ''}

Urgency Level: ${urgency}

Provide comprehensive advice in JSON format:
{
  "advice": "Compassionate, specific advice addressing the situation",
  "actions": ["Immediate actionable steps", "Practical recommendations"],
  "resources": ["Specific resource suggestions", "Support options"],
  "followUp": "Guidance on next steps and when to check in again"
}

Ensure advice is:
- Immediately actionable
- Appropriate for college students
- Sensitive to mental health concerns
- Encouraging and hopeful`;

    try {
      const response = await geminiService.sendMessage(prompt);
      const cleanResponse = this.cleanJSONResponse(response);
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error generating contextual advice:', error);
      return {
        advice: "Thank you for sharing this with me. It's important that you're reaching out for support.",
        actions: [
          "Take a moment to breathe deeply and ground yourself",
          "Consider talking to someone you trust about how you're feeling"
        ],
        resources: [
          "Campus counseling center",
          "Mental health hotlines available 24/7"
        ],
        followUp: "Check in with yourself in a day or two, and don't hesitate to reach out for professional support if needed."
      };
    }
  }

  // Analyze user patterns and provide insights
  async analyzeUserPatterns(
    assessmentHistory: AssessmentData[],
    interactionHistory: unknown[]
  ): Promise<{
    trends: string[];
    improvements: string[];
    concerns: string[];
    recommendations: string[];
  }> {
    if (assessmentHistory.length === 0) {
      return {
        trends: ["Starting mental health journey"],
        improvements: [],
        concerns: [],
        recommendations: ["Continue regular check-ins to track progress"]
      };
    }

    const prompt = `Analyze this user's mental health patterns over time:

Assessment History (chronological):
${assessmentHistory.map((assessment, index) => 
  `Assessment ${index + 1}: Stress: ${assessment.stress}, Anxiety: ${assessment.anxiety}, Sleep: ${assessment.sleep}`
).join('\n')}

Recent Interactions:
${interactionHistory.slice(-5).map(interaction => JSON.stringify(interaction)).join('\n')}

Provide pattern analysis in JSON format:
{
  "trends": ["Observable patterns in mental health metrics"],
  "improvements": ["Areas showing positive changes"],
  "concerns": ["Areas needing attention or showing decline"],
  "recommendations": ["Specific actions based on patterns observed"]
}

Focus on:
- Changes over time in each metric
- Overall trajectory
- Correlation between different measures
- Actionable insights for continued progress`;

    try {
      const response = await geminiService.sendMessage(prompt);
      const cleanResponse = this.cleanJSONResponse(response);
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error analyzing user patterns:', error);
      return {
        trends: ["Regular engagement with mental health resources"],
        improvements: ["Continued self-awareness and monitoring"],
        concerns: [],
        recommendations: ["Continue current wellness practices", "Regular check-ins"]
      };
    }
  }

  // Helper method to clean JSON responses from AI
  private cleanJSONResponse(response: string): string {
    let cleaned = response.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any text before the first { or [
    const jsonStart = Math.min(
      cleaned.indexOf('{') !== -1 ? cleaned.indexOf('{') : Infinity,
      cleaned.indexOf('[') !== -1 ? cleaned.indexOf('[') : Infinity
    );
    
    if (jsonStart !== Infinity && jsonStart > 0) {
      cleaned = cleaned.substring(jsonStart);
    }
    
    // Remove any text after the last } or ]
    const jsonEnd = Math.max(
      cleaned.lastIndexOf('}'),
      cleaned.lastIndexOf(']')
    );
    
    if (jsonEnd !== -1 && jsonEnd < cleaned.length - 1) {
      cleaned = cleaned.substring(0, jsonEnd + 1);
    }
    
    return cleaned;
  }

  // Fallback methods for when AI calls fail
  private generateFallbackResourceRecommendations(
    assessmentData: AssessmentData,
    availableResources: BaseResource[]
  ): ResourceRecommendation[] {
    const recommendations: ResourceRecommendation[] = [];
    
    // High stress recommendations
    if (assessmentData.stress > 6) {
      const stressResources = availableResources.filter(r => 
        r.tags.includes('stress relief') || r.tags.includes('relaxation')
      );
      stressResources.slice(0, 2).forEach(resource => {
        recommendations.push({
          id: resource.id,
          title: resource.title,
          type: resource.type,
          category: resource.category,
          reason: "Recommended for stress management and relaxation",
          priority: 'high',
          confidence: 85
        });
      });
    }
    
    // Anxiety recommendations
    if (assessmentData.anxiety > 6) {
      const anxietyResources = availableResources.filter(r => 
        r.tags.includes('anxiety') || r.tags.includes('mindfulness')
      );
      anxietyResources.slice(0, 2).forEach(resource => {
        recommendations.push({
          id: resource.id,
          title: resource.title,
          type: resource.type,
          category: resource.category,
          reason: "Helpful for managing anxiety and building coping skills",
          priority: 'high',
          confidence: 80
        });
      });
    }
    
    return recommendations.slice(0, 4);
  }

  private generateFallbackBookingRecommendations(
    assessmentData: AssessmentData,
    availableConsultants: BaseConsultant[]
  ): BookingRecommendation[] {
    const recommendations: BookingRecommendation[] = [];
    
    // High severity cases
    if (assessmentData.stress > 7 || assessmentData.anxiety > 7) {
      const specialist = availableConsultants.find(c => 
        c.specialty.includes('Clinical Psychology') || c.specialty.includes('Psychiatrist')
      );
      if (specialist) {
        recommendations.push({
          consultantId: specialist.id,
          consultantName: specialist.name,
          specialty: specialist.specialty,
          reason: "Recommended for comprehensive mental health support with high stress/anxiety levels",
          urgency: 'urgent',
          confidence: 90
        });
      }
    }
    
    return recommendations;
  }

  private generateFallbackQuestions(context: string): PersonalizedQuestion[] {
    const fallbackQuestions = {
      resource: [
        {
          id: 'resource_1',
          text: 'What type of activities typically help you feel more relaxed and centered?',
          context: 'resource' as const,
          category: 'preferences',
          priority: 3
        },
        {
          id: 'resource_2', 
          text: 'Are you looking for immediate stress relief or long-term mental health support?',
          context: 'resource' as const,
          category: 'goals',
          priority: 4
        }
      ],
      booking: [
        {
          id: 'booking_1',
          text: 'What specific concerns would you like to discuss with a mental health professional?',
          context: 'booking' as const,
          category: 'concerns',
          priority: 5
        }
      ],
      followup: [
        {
          id: 'followup_1',
          text: 'How have you been feeling since your last assessment?',
          context: 'followup' as const,
          category: 'progress',
          priority: 4
        }
      ],
      wellness: [
        {
          id: 'wellness_1',
          text: 'What aspect of your mental wellness would you like to focus on today?',
          context: 'wellness' as const,
          category: 'general',
          priority: 3
        }
      ]
    };
    
    return fallbackQuestions[context] || fallbackQuestions.wellness;
  }
}

export const aiAdvisoryService = new AIAdvisoryService();