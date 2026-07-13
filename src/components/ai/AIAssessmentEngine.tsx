import { GoogleGenerativeAI } from "@google/generative-ai";
import DynamicQuestionGenerator from "./DynamicQuestionGenerator";
import DynamicScoringEngine from "./DynamicScoringEngine";
import { AssessmentResult } from "@/types/assessment";
import {
  DynamicAssessmentSession,
  UserContext,
  DynamicQuestion,
  DynamicResponse,
  AssessmentState,
  AssessmentCompletion,
  AdaptiveScore,
  CrisisIndicator,
  CrisisResponse,
  AssessmentInitializationError,
  PersonalizedRecommendations,
  ChatSession,
  ConversationContext,
  ProgressUpdate,
  CompletionCelebration,
} from "@/types/dynamic-assessment";

interface AIEngineConfig {
  apiKey: string;
  initialQuestionCount: number;
  maxQuestionsPerSession: number;
  crisisDetectionEnabled: boolean;
  adaptationThreshold: number;
}

interface UserResponse {
  sessionId: string;
  questionId: string;
  answer: string;
  value: number;
  responseTime: number;
  confidence: number;
  additionalNotes?: string;
}

class AIAssessmentEngine {
  private questionGenerator: DynamicQuestionGenerator;
  private scoringEngine: DynamicScoringEngine;
  private aiService: GoogleGenerativeAI;
  private sessions: Map<string, DynamicAssessmentSession>;
  private config: AIEngineConfig;

  constructor(config: AIEngineConfig) {
    this.config = config;
    this.aiService = new GoogleGenerativeAI(config.apiKey);
    this.questionGenerator = new DynamicQuestionGenerator(config.apiKey);
    this.scoringEngine = new DynamicScoringEngine(config.apiKey);
    this.sessions = new Map();
  }

  async startDynamicAssessment(
    userId: string
  ): Promise<DynamicAssessmentSession> {
    try {
      // Initialize user context
      const userContext = await this.buildUserContext(userId);

      // Generate initial question set
      const initialQuestions =
        await this.questionGenerator.generateAdaptiveQuestionSet(
          userContext,
          this.config.initialQuestionCount
        );

      // Create assessment session
      const session: DynamicAssessmentSession = {
        sessionId: this.generateSessionId(),
        userId,
        questions: initialQuestions,
        responses: [],
        context: userContext,
        startTime: new Date(),
        status: "active",
        adaptationEnabled: true,
        aiOrchestration: true,
      };

      await this.storeSession(session);
      return session;
    } catch (error) {
      console.error("Failed to start dynamic assessment:", error);
      throw new AssessmentInitializationError(error.message);
    }
  }

  async processUserResponse(
    sessionId: string,
    response: UserResponse
  ): Promise<AssessmentState> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Find the question being answered
    const question = session.questions.find(
      (q) => q.id === response.questionId
    );
    if (!question) {
      throw new Error("Question not found in session");
    }

    // Create dynamic response
    const dynamicResponse: DynamicResponse = {
      questionId: response.questionId,
      question,
      answer: response.answer,
      value: response.value,
      responseTime: response.responseTime,
      confidence: response.confidence,
      text: response.additionalNotes,
      contextualNotes: response.additionalNotes,
    };

    // Analyze response for immediate adaptation
    const responseAnalysis = await this.analyzeResponse(
      dynamicResponse,
      session.context
    );

    // Check for crisis indicators
    const crisisDetected = this.detectCrisisIndicators(dynamicResponse);
    if (crisisDetected.length > 0) {
      await this.handleCrisisDetection(session.userId, crisisDetected);
      return {
        session,
        completionRecommended: true,
        interventionRequired: true,
        crisisDetected: true,
      };
    }

    // Update user context with new insights
    session.context = await this.updateContextFromResponse(
      session.context,
      responseAnalysis
    );

    // Add response to session
    session.responses.push(dynamicResponse);

    // Determine next question dynamically
    const nextQuestion = await this.determineNextQuestion(session);

    if (nextQuestion) {
      session.questions.push(nextQuestion);
    }

    // Check for completion or intervention needs
    const assessmentState = await this.evaluateAssessmentState(session);

    await this.updateSession(session);
    return assessmentState;
  }

  async completeAssessment(sessionId: string): Promise<AssessmentCompletion> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Mark session as completed
    session.status = "completed";
    session.endTime = new Date();

    // Generate comprehensive score
    const adaptiveScore = await this.scoringEngine.calculateAdaptiveScore(
      session.responses,
      session.context
    );

    // Initialize contextual chat
    const chatSession = await this.initializePostAssessmentChat(
      session.userId,
      adaptiveScore
    );

    // Generate personalized recommendations
    const recommendations = await this.generateRecommendations(
      session.userId,
      adaptiveScore
    );

    // Generate progress update
    const progressUpdate = await this.generateProgressUpdate(
      session.userId,
      adaptiveScore
    );

    // Generate completion celebration
    const completionCelebration = await this.generateCompletionCelebration(
      adaptiveScore
    );

    await this.updateSession(session);

    return {
      score: adaptiveScore,
      chatSession,
      recommendations,
      progressUpdate,
      completionCelebration,
    };
  }

  private async buildUserContext(userId: string): Promise<UserContext> {
    // In a real implementation, this would fetch from user database
    // For now, we'll create a basic context
    return {
      userId,
      currentStressLevel: 5, // Default moderate stress
      previousAnswers: [],
      responsePatterns: [],
      engagementMetrics: {
        averageEngagement: 7,
        sessionLength: 0,
        interactionFrequency: 1,
        completionRate: 0.8,
      },
      detectedConcerns: [],
      unexploredAreas: [
        "academic",
        "social",
        "emotional",
        "behavioral",
        "cognitive",
        "physical",
      ],
      preferredQuestionStyle: "conversational",
      assessmentHistory: [],
      chatHistory: [],
      currentSessionContext: {
        questionsAsked: 0,
        timeSpent: 0,
        emotionalIndicators: [],
        categoriesCovered: [],
        difficultyProgression: [],
      },
    };
  }

  private async analyzeResponse(
    response: DynamicResponse,
    context: UserContext
  ): Promise<any> {
    // Analyze response for insights and patterns
    return {
      emotionalState: this.extractEmotionalState(response),
      concernLevel: this.assessConcernLevel(response),
      engagementLevel: this.measureResponseEngagement(response),
      adaptationNeeded: this.assessAdaptationNeed(response, context),
    };
  }

  private extractEmotionalState(response: DynamicResponse): string {
    // Simple heuristic based on response value and category
    if (response.question.category === "emotional") {
      if (response.value >= 3) return "elevated_concern";
      if (response.value <= 1) return "positive_state";
    }
    return "neutral";
  }

  private assessConcernLevel(response: DynamicResponse): number {
    // Convert response value to concern level (0-1)
    return response.value / 4;
  }

  private measureResponseEngagement(response: DynamicResponse): number {
    // Based on response time and confidence
    const timeScore = Math.min(1, response.responseTime / 10000); // Normalize time
    const confidenceScore = response.confidence;
    return (timeScore + confidenceScore) / 2;
  }

  private assessAdaptationNeed(
    response: DynamicResponse,
    context: UserContext
  ): boolean {
    // Determine if we need to adapt the next question based on this response
    return response.value >= 3 || response.confidence < 0.5;
  }

  private detectCrisisIndicators(response: DynamicResponse): CrisisIndicator[] {
    const indicators: CrisisIndicator[] = [];

    // Check for crisis language patterns
    if (
      response.answer &&
      response.answer.toLowerCase().includes("hurt myself")
    ) {
      indicators.push({
        type: "self_harm",
        severity: 0.9,
        context: response.answer,
        detectedAt: new Date(),
      });
    }

    // Check for extreme values in critical categories
    if (response.question.category === "emotional" && response.value === 4) {
      indicators.push({
        type: "emotional_crisis",
        severity: 0.7,
        context: `Extreme ${response.question.category} response`,
        detectedAt: new Date(),
      });
    }

    return indicators;
  }

  private async updateContextFromResponse(
    context: UserContext,
    analysis: any
  ): Promise<UserContext> {
    const updatedContext = { ...context };

    // Update stress level based on response
    if (analysis.concernLevel > 0.7) {
      updatedContext.currentStressLevel = Math.min(
        10,
        updatedContext.currentStressLevel + 1
      );
    } else if (analysis.concernLevel < 0.3) {
      updatedContext.currentStressLevel = Math.max(
        1,
        updatedContext.currentStressLevel - 0.5
      );
    }

    // Add detected concerns
    if (analysis.emotionalState === "elevated_concern") {
      updatedContext.detectedConcerns.push("emotional_distress");
    }

    return updatedContext;
  }

  private async determineNextQuestion(
    session: DynamicAssessmentSession
  ): Promise<DynamicQuestion | null> {
    // Check if assessment should continue
    if (await this.isAssessmentComplete(session)) {
      return null;
    }

    // Check if we've reached max questions
    if (session.questions.length >= this.config.maxQuestionsPerSession) {
      return null;
    }

    // Generate next question based on current context
    return await this.questionGenerator.generateNextQuestion(session.context);
  }

  private async isAssessmentComplete(
    session: DynamicAssessmentSession
  ): Promise<boolean> {
    // Assessment is complete if:
    // 1. All major categories have been explored
    // 2. Sufficient confidence in scoring
    // 3. User context indicates readiness for completion

    const categoriesCovered = new Set(
      session.responses.map((r) => r.question.category)
    );
    const minCategories = 3;
    const minQuestions = 5;

    return (
      categoriesCovered.size >= minCategories &&
      session.responses.length >= minQuestions
    );
  }

  private async evaluateAssessmentState(
    session: DynamicAssessmentSession
  ): Promise<AssessmentState> {
    const completionRecommended = await this.isAssessmentComplete(session);
    const interventionRequired = session.context.currentStressLevel > 8;
    const crisisDetected = session.responses.some(
      (r) => this.detectCrisisIndicators(r).length > 0
    );

    return {
      session,
      completionRecommended,
      interventionRequired,
      crisisDetected,
    };
  }

  async handleCrisisDetection(
    userId: string,
    crisisIndicators: CrisisIndicator[]
  ): Promise<CrisisResponse> {
    const crisisPrompt = `
    CRISIS INTERVENTION RESPONSE
    
    User ID: ${userId}
    Crisis indicators detected: ${crisisIndicators
      .map((c) => c.type)
      .join(", ")}
    Severity levels: ${crisisIndicators.map((c) => c.severity).join(", ")}
    Context: ${JSON.stringify(crisisIndicators.map((c) => c.context))}
    
    IMMEDIATE RESPONSE REQUIREMENTS:
    1. Provide immediate emotional support and validation
    2. Assess immediate safety needs
    3. Provide crisis resources (hotlines, emergency contacts)
    4. Offer immediate coping strategies
    5. Create safety plan if needed
    6. Determine if professional intervention is needed
    7. Establish follow-up contact plan
    
    Generate crisis response with:
    - Immediate supportive message
    - Safety assessment questions
    - Crisis resources (location-appropriate)
    - Immediate coping strategies
    - Professional referral recommendations
    - Follow-up schedule
    `;

    try {
      const model = this.aiService.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      const crisisResponse = await model.generateContent(crisisPrompt);
      const response = JSON.parse(crisisResponse.response.text());

      // Log crisis detection for monitoring
      await this.logCrisisEvent(userId, crisisIndicators, response);

      return response;
    } catch (error) {
      console.error("Crisis response generation failed:", error);
      return this.getDefaultCrisisResponse();
    }
  }

  private getDefaultCrisisResponse(): CrisisResponse {
    return {
      message:
        "I'm concerned about what you've shared. Your wellbeing is important, and help is available.",
      immediateActions: [
        "Take slow, deep breaths",
        "Find a safe, comfortable space",
        "Reach out to someone you trust",
      ],
      resources: [
        {
          name: "National Suicide Prevention Lifeline",
          type: "hotline",
          contact: "988",
          availability: "24/7",
          description: "Free and confidential emotional support",
        },
        {
          name: "Crisis Text Line",
          type: "hotline",
          contact: "Text HOME to 741741",
          availability: "24/7",
          description: "Free crisis support via text message",
        },
      ],
      followUpPlan: [
        "Contact campus counseling services",
        "Schedule appointment with mental health professional",
        "Create safety plan with trusted person",
      ],
      professionalReferral: true,
    };
  }

  private async initializePostAssessmentChat(
    userId: string,
    adaptiveScore: AdaptiveScore
  ): Promise<ChatSession> {
    // Create a basic chat session context
    const conversationContext: ConversationContext = {
      assessmentContext: {
        overallScore: adaptiveScore.overallScore,
        primaryConcerns: adaptiveScore.riskFactors.map((rf) => rf.factor),
        strengthAreas: adaptiveScore.protectiveFactors.map((pf) => pf.factor),
        riskFactors: adaptiveScore.riskFactors,
        protectiveFactors: adaptiveScore.protectiveFactors,
        interventionPriorities: adaptiveScore.interventionPriority,
      },
      userMentalState: {
        communicationPreference: "supportive",
        emotionalOpenness: 7,
        previousChatPatterns: "engaging",
        demographicContext: "college_student",
      },
      conversationHistory: [],
      contextVector: [adaptiveScore.overallScore / 100],
      activeTopics: [],
      emotionalJourney: [],
      interventionOpportunities: [],
    };

    return {
      sessionId: this.generateSessionId(),
      userId,
      context: conversationContext,
      messages: [],
      sessionType: "post-assessment-support",
      status: "active",
    };
  }

  private async generateRecommendations(
    userId: string,
    adaptiveScore: AdaptiveScore
  ): Promise<PersonalizedRecommendations> {
    // Generate basic recommendations based on score
    return {
      immediateActions: [
        {
          title: "Practice Deep Breathing",
          description:
            "Try the 4-7-8 breathing technique for immediate stress relief",
          actionSteps: [
            "Inhale for 4 counts",
            "Hold for 7 counts",
            "Exhale for 8 counts",
          ],
          timeframe: "Next 10 minutes",
          difficulty: 1,
          expectedBenefit: "Reduced anxiety and improved focus",
        },
      ],
      shortTermGoals: [
        {
          title: "Establish Daily Mindfulness",
          description:
            "Incorporate 10 minutes of mindfulness practice into your daily routine",
          actionSteps: [
            "Choose a consistent time",
            "Find a quiet space",
            "Use guided meditation app",
          ],
          timeframe: "Next 7 days",
          difficulty: 2,
          expectedBenefit: "Better emotional regulation and stress management",
        },
      ],
      longTermAspirations: [
        {
          title: "Build Resilience Skills",
          description:
            "Develop comprehensive coping strategies for long-term mental wellness",
          actionSteps: [
            "Join support group",
            "Practice regular exercise",
            "Maintain social connections",
          ],
          timeframe: "Next 3 months",
          difficulty: 3,
          expectedBenefit:
            "Improved overall mental health and life satisfaction",
        },
      ],
      adaptiveStrategies: [],
      socialConnection: [],
      learningDevelopment: [],
    };
  }

  private async generateProgressUpdate(
    userId: string,
    adaptiveScore: AdaptiveScore
  ): Promise<ProgressUpdate> {
    return {
      currentScore: adaptiveScore.overallScore,
      improvement: 0, // Would calculate from previous assessments
      keyChanges: ["Completed comprehensive dynamic assessment"],
      nextMilestone: "Follow-up assessment in 2 weeks",
    };
  }

  private async generateCompletionCelebration(
    adaptiveScore: AdaptiveScore
  ): Promise<CompletionCelebration> {
    return {
      message:
        "Congratulations on completing your comprehensive mental health assessment! 🎉",
      achievements: [
        "Thoughtfully answered all questions",
        "Provided valuable insights about your mental health",
        "Demonstrated commitment to self-care",
      ],
      encouragement:
        "Your awareness and willingness to understand your mental health is a significant step forward.",
      nextSteps: [
        "Review your personalized recommendations",
        "Start with one immediate action",
        "Schedule follow-up in 2 weeks",
      ],
    };
  }

  // Helper methods
  private generateSessionId(): string {
    return (
      "session_" +
      Date.now().toString(36) +
      Math.random().toString(36).substr(2, 9)
    );
  }

  private async storeSession(session: DynamicAssessmentSession): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  private async getSession(
    sessionId: string
  ): Promise<DynamicAssessmentSession | undefined> {
    return this.sessions.get(sessionId);
  }

  private async updateSession(
    session: DynamicAssessmentSession
  ): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  private async logCrisisEvent(
    userId: string,
    indicators: CrisisIndicator[],
    response: any
  ): Promise<void> {
    // In production, this would log to a secure database
    console.warn("CRISIS EVENT LOGGED:", {
      userId,
      timestamp: new Date(),
      indicators: indicators.length,
      responseGenerated: !!response,
    });
  }

  // Public utility methods
  public getActiveSessionsCount(): number {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === "active"
    ).length;
  }

  public async terminateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "cancelled";
      session.endTime = new Date();
      this.sessions.set(sessionId, session);
    }
  }
}

export default AIAssessmentEngine;
