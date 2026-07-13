import { GoogleGenerativeAI } from "@google/generative-ai";
import { AssessmentResult } from "@/types/assessment";
import {
  DynamicQuestion,
  UserContext,
  QuestionStyle,
  ResponsePattern,
  AssessmentAnswer,
  EngagementMetrics,
  SessionContext,
} from "@/types/dynamic-assessment";

interface ResponsePatternAnalysis {
  averageResponseTime: number;
  consistencyScore: number;
  detailLevel: "brief" | "moderate" | "detailed";
  emotionalOpenness: number;
  truthfulnessIndicators: number;
  engagementTrend: "increasing" | "decreasing" | "stable";
}

interface CategoryQuestionConfig {
  name: string;
  subcategories: string[];
  maxQuestions: number;
  priorityLevel: number;
}

class DynamicQuestionGenerator {
  private aiService: GoogleGenerativeAI;
  private questionCache: Map<string, DynamicQuestion[]>;
  private userProfiles: Map<string, UserContext>;
  private categoryConfigs: CategoryQuestionConfig[];

  constructor(apiKey: string) {
    this.aiService = new GoogleGenerativeAI(apiKey);
    this.questionCache = new Map();
    this.userProfiles = new Map();
    this.initializeCategoryConfigs();
  }

  private initializeCategoryConfigs(): void {
    this.categoryConfigs = [
      {
        name: "academic",
        subcategories: [
          "examAnxiety",
          "performancePressure",
          "timeManagement",
          "procrastination",
          "careerUncertainty",
          "competitiveEnvironment",
        ],
        maxQuestions: 8,
        priorityLevel: 1,
      },
      {
        name: "social",
        subcategories: [
          "peerRelationships",
          "socialAnxiety",
          "bullying",
          "socialMedia",
          "belonging",
          "communication",
        ],
        maxQuestions: 6,
        priorityLevel: 2,
      },
      {
        name: "emotional",
        subcategories: [
          "moodRegulation",
          "stress",
          "anxiety",
          "depression",
          "anger",
          "emotionalAwareness",
        ],
        maxQuestions: 7,
        priorityLevel: 1,
      },
      {
        name: "behavioral",
        subcategories: [
          "sleepPatterns",
          "exerciseHabits",
          "substanceUse",
          "screenTime",
          "selfCare",
          "routines",
        ],
        maxQuestions: 5,
        priorityLevel: 3,
      },
      {
        name: "cognitive",
        subcategories: [
          "concentration",
          "memory",
          "decisionMaking",
          "problemSolving",
          "creativity",
          "mindfulness",
        ],
        maxQuestions: 4,
        priorityLevel: 2,
      },
      {
        name: "physical",
        subcategories: [
          "healthConcerns",
          "bodyImage",
          "energyLevels",
          "appetite",
          "physicalSymptoms",
        ],
        maxQuestions: 3,
        priorityLevel: 3,
      },
    ];
  }

  async generateNextQuestion(
    userContext: UserContext
  ): Promise<DynamicQuestion> {
    try {
      const prompt = this.buildQuestionGenerationPrompt(userContext);
      const model = this.aiService.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const question = this.parseQuestionResponse(response);
      await this.cacheQuestion(userContext.userId, question);

      return question;
    } catch (error) {
      console.error("Question generation failed:", error);
      return this.getFallbackQuestion(userContext);
    }
  }

  private buildQuestionGenerationPrompt(userContext: UserContext): string {
    const responsePatterns = this.analyzeResponsePatterns(
      userContext.previousAnswers
    );
    const trends = this.extractTrends(userContext.assessmentHistory);

    return `
    CONTEXT: Generate the next optimal mental health assessment question for this user.

    USER PROFILE:
    - Current stress indicators: ${JSON.stringify(userContext.detectedConcerns)}
    - Previous responses patterns: ${JSON.stringify(responsePatterns)}
    - Engagement level: ${userContext.engagementMetrics.averageEngagement}/10
    - Unexplored areas: ${userContext.unexploredAreas.join(", ")}
    - Response style preference: ${userContext.preferredQuestionStyle}
    - Assessment history trends: ${trends}

    CURRENT SESSION:
    - Questions asked so far: ${
      userContext.currentSessionContext.questionsAsked
    }
    - Time spent: ${userContext.currentSessionContext.timeSpent} minutes
    - Emotional state indicators: ${userContext.currentSessionContext.emotionalIndicators.join(
      ", "
    )}
    - Categories covered: ${userContext.currentSessionContext.categoriesCovered.join(
      ", "
    )}

    REQUIREMENTS:
    1. Generate a question that explores the highest-priority area based on user's responses
    2. Adapt language complexity to user's demonstrated comprehension level
    3. Use empathetic, non-clinical language that feels conversational
    4. Focus on actionable insights that can inform personalized recommendations
    5. Avoid repetitive themes from previous questions
    6. Consider cultural sensitivity and age-appropriate language

    OUTPUT FORMAT (JSON):
    {
      "text": "The actual question text (50-100 words)",
      "category": "Primary category (academic/social/emotional/behavioral/cognitive/physical)",
      "subcategory": "More specific classification",
      "difficulty": 1-5 (1=simple yes/no, 5=complex reflection),
      "expectedInsights": ["insight1", "insight2", "insight3"],
      "followUpTriggers": ["condition that would trigger follow-up questions"],
      "adaptivePrompts": ["alternative phrasings for different user types"],
      "contextualRelevance": 0-1 (relevance to current user state),
      "aiConfidence": 0-1 (confidence in question quality)
    }

    GENERATE THE MOST RELEVANT QUESTION NOW:
    `;
  }

  private analyzeResponsePatterns(
    answers: AssessmentAnswer[]
  ): ResponsePatternAnalysis {
    const patterns: ResponsePatternAnalysis = {
      averageResponseTime: 0,
      consistencyScore: 0,
      detailLevel: "brief",
      emotionalOpenness: 0,
      truthfulnessIndicators: 0,
      engagementTrend: "stable",
    };

    if (answers.length === 0) return patterns;

    // Calculate response time patterns
    const responseTimes = answers
      .map((a) => a.responseTime)
      .filter((t) => t > 0);
    if (responseTimes.length > 0) {
      patterns.averageResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    // Analyze consistency in response values
    const values = answers.map((a) => a.value);
    const variance = this.calculateVariance(values);
    patterns.consistencyScore = Math.max(0, 1 - variance / 4); // Normalized to 0-1

    // Determine detail level from response lengths
    const textResponses = answers.filter((a) => a.text);
    if (textResponses.length > 0) {
      const avgLength =
        textResponses.reduce((sum, a) => sum + (a.text?.length || 0), 0) /
        textResponses.length;
      patterns.detailLevel =
        avgLength < 20 ? "brief" : avgLength < 100 ? "moderate" : "detailed";
    }

    // Calculate emotional openness based on confidence and text content
    const confidenceScores = answers
      .map((a) => a.confidence)
      .filter((c) => c > 0);
    if (confidenceScores.length > 0) {
      patterns.emotionalOpenness =
        confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
    }

    return patterns;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private extractTrends(assessmentHistory: AssessmentResult[]): string {
    if (assessmentHistory.length === 0) return "No previous assessments";

    if (assessmentHistory.length === 1) return "First assessment";

    const recent = assessmentHistory.slice(-2);
    const scoreDiff = recent[1].totalScore - recent[0].totalScore;

    if (scoreDiff > 5) return "Increasing stress levels";
    if (scoreDiff < -5) return "Improving overall wellness";
    return "Stable mental health patterns";
  }

  async generateAdaptiveQuestionSet(
    userContext: UserContext,
    targetCount: number
  ): Promise<DynamicQuestion[]> {
    const questions: DynamicQuestion[] = [];
    let currentContext = { ...userContext };

    for (let i = 0; i < targetCount; i++) {
      const question = await this.generateNextQuestion(currentContext);
      questions.push(question);

      // Update context for next question generation
      currentContext = this.updateContextWithQuestion(currentContext, question);

      // Add delay to avoid API rate limits
      await this.delay(500);
    }

    return this.optimizeQuestionSequence(questions);
  }

  private updateContextWithQuestion(
    context: UserContext,
    question: DynamicQuestion
  ): UserContext {
    return {
      ...context,
      currentSessionContext: {
        ...context.currentSessionContext,
        questionsAsked: context.currentSessionContext.questionsAsked + 1,
        categoriesCovered: [
          ...new Set([
            ...context.currentSessionContext.categoriesCovered,
            question.category,
          ]),
        ],
        difficultyProgression: [
          ...context.currentSessionContext.difficultyProgression,
          question.difficulty,
        ],
      },
      unexploredAreas: context.unexploredAreas.filter(
        (area) => area !== question.category
      ),
    };
  }

  private optimizeQuestionSequence(
    questions: DynamicQuestion[]
  ): DynamicQuestion[] {
    // Sort by contextual relevance and difficulty progression
    return questions.sort((a, b) => {
      // Prioritize higher relevance
      const relevanceDiff = b.contextualRelevance - a.contextualRelevance;
      if (Math.abs(relevanceDiff) > 0.2) return relevanceDiff;

      // Then by AI confidence
      return b.aiConfidence - a.aiConfidence;
    });
  }

  private parseQuestionResponse(response: string): DynamicQuestion {
    try {
      // Try to parse JSON response
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanResponse);

      return {
        id: this.generateQuestionId(),
        text: parsed.text,
        category: parsed.category,
        subcategory: parsed.subcategory,
        difficulty: parsed.difficulty,
        expectedInsights: parsed.expectedInsights || [],
        followUpTriggers: parsed.followUpTriggers || [],
        adaptivePrompts: parsed.adaptivePrompts || [],
        contextualRelevance: parsed.contextualRelevance || 0.5,
        generatedAt: new Date().toISOString(),
        aiConfidence: parsed.aiConfidence || 0.5,
      };
    } catch (error) {
      console.error("Failed to parse AI question response:", error);
      return this.createFallbackQuestion();
    }
  }

  private generateQuestionId(): string {
    return (
      "dq_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    );
  }

  private createFallbackQuestion(): DynamicQuestion {
    return {
      id: this.generateQuestionId(),
      text: "How would you describe your overall stress level today on a scale from 1 to 10?",
      category: "emotional",
      subcategory: "stress",
      difficulty: 2,
      expectedInsights: ["current stress level", "self-awareness"],
      followUpTriggers: ["high stress response"],
      adaptivePrompts: ["feeling scale", "stress check"],
      contextualRelevance: 0.8,
      generatedAt: new Date().toISOString(),
      aiConfidence: 0.9,
    };
  }

  private getFallbackQuestion(userContext: UserContext): DynamicQuestion {
    // Determine the most relevant category based on user context
    const unexploredCategories = userContext.unexploredAreas;
    const priorityCategory =
      unexploredCategories.length > 0 ? unexploredCategories[0] : "emotional";

    const fallbackQuestions =
      this.getFallbackQuestionsByCategory(priorityCategory);
    const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);

    return fallbackQuestions[randomIndex];
  }

  private getFallbackQuestionsByCategory(category: string): DynamicQuestion[] {
    const fallbackSets: Record<string, DynamicQuestion[]> = {
      academic: [
        {
          id: this.generateQuestionId(),
          text: "How often do you feel overwhelmed by your academic workload?",
          category: "academic",
          subcategory: "performancePressure",
          difficulty: 2,
          expectedInsights: ["academic stress", "workload management"],
          followUpTriggers: ["high stress response"],
          adaptivePrompts: ["academic pressure", "school stress"],
          contextualRelevance: 0.7,
          generatedAt: new Date().toISOString(),
          aiConfidence: 0.8,
        },
      ],
      social: [
        {
          id: this.generateQuestionId(),
          text: "How comfortable do you feel when meeting new people or in social situations?",
          category: "social",
          subcategory: "socialAnxiety",
          difficulty: 3,
          expectedInsights: ["social comfort", "interpersonal skills"],
          followUpTriggers: ["social anxiety indicators"],
          adaptivePrompts: ["social comfort", "meeting people"],
          contextualRelevance: 0.7,
          generatedAt: new Date().toISOString(),
          aiConfidence: 0.8,
        },
      ],
      emotional: [
        {
          id: this.generateQuestionId(),
          text: "When you're feeling stressed or upset, how easy is it for you to identify what's causing those feelings?",
          category: "emotional",
          subcategory: "emotionalAwareness",
          difficulty: 3,
          expectedInsights: ["emotional awareness", "self-reflection"],
          followUpTriggers: ["low emotional awareness"],
          adaptivePrompts: ["emotion recognition", "feeling identification"],
          contextualRelevance: 0.8,
          generatedAt: new Date().toISOString(),
          aiConfidence: 0.8,
        },
      ],
    };

    return fallbackSets[category] || fallbackSets.emotional;
  }

  private async cacheQuestion(
    userId: string,
    question: DynamicQuestion
  ): Promise<void> {
    const userQuestions = this.questionCache.get(userId) || [];
    userQuestions.push(question);

    // Keep only last 50 questions per user
    if (userQuestions.length > 50) {
      userQuestions.splice(0, userQuestions.length - 50);
    }

    this.questionCache.set(userId, userQuestions);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Method to get user's question history
  getUserQuestionHistory(userId: string): DynamicQuestion[] {
    return this.questionCache.get(userId) || [];
  }

  // Method to clear user's question cache
  clearUserCache(userId: string): void {
    this.questionCache.delete(userId);
  }

  // Method to get cache statistics
  getCacheStatistics(): {
    totalUsers: number;
    totalQuestions: number;
    avgQuestionsPerUser: number;
  } {
    const totalUsers = this.questionCache.size;
    const totalQuestions = Array.from(this.questionCache.values()).reduce(
      (sum, questions) => sum + questions.length,
      0
    );
    const avgQuestionsPerUser =
      totalUsers > 0 ? totalQuestions / totalUsers : 0;

    return {
      totalUsers,
      totalQuestions,
      avgQuestionsPerUser: Math.round(avgQuestionsPerUser * 100) / 100,
    };
  }
}

export default DynamicQuestionGenerator;
