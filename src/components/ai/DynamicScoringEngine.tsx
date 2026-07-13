import { GoogleGenerativeAI } from "@google/generative-ai";
import { AssessmentResult } from "@/types/assessment";
import {
  AdaptiveScore,
  DynamicResponse,
  UserContext,
  CategoryScores,
  RiskFactor,
  ProtectiveFactor,
  TrendAnalysis,
  InterventionPriority,
  EmotionalStatePoint,
} from "@/types/dynamic-assessment";

interface ResponseAnalysis {
  timingAnalysis: TimingAnalysis;
  sentimentAnalysis: SentimentAnalysis;
  consistencyMetrics: ConsistencyMetrics;
  engagementDepth: EngagementDepth;
  authenticityIndicators: AuthenticityIndicators;
}

interface TimingAnalysis {
  averageTime: number;
  variability: number;
  rushingIndicators: number;
  deliberationIndicators: number;
}

interface SentimentAnalysis {
  overallSentiment: "positive" | "negative" | "neutral";
  emotionalIntensity: number;
  specificEmotions: string[];
  linguisticMarkers: string[];
  concerningLanguage: string[];
  positiveIndicators: string[];
}

interface ConsistencyMetrics {
  responsePatternScore: number;
  valueConsistency: number;
  temporalConsistency: number;
}

interface EngagementDepth {
  interactionQuality: number;
  thoughtfulnessScore: number;
  elaborationLevel: number;
}

interface AuthenticityIndicators {
  genuinenessScore: number;
  socialDesirabilityBias: number;
  candorLevel: number;
}

class DynamicScoringEngine {
  private aiService: GoogleGenerativeAI;
  private scoringHistory: Map<string, AdaptiveScore[]>;

  constructor(apiKey: string) {
    this.aiService = new GoogleGenerativeAI(apiKey);
    this.scoringHistory = new Map();
  }

  async calculateAdaptiveScore(
    responses: DynamicResponse[],
    userContext: UserContext
  ): Promise<AdaptiveScore> {
    try {
      // Multi-dimensional analysis
      const responseAnalysis = await this.analyzeResponses(responses);
      const contextualFactors = this.analyzeContextualFactors(userContext);
      const behavioralPatterns = this.analyzeBehavioralPatterns(
        responses,
        userContext
      );

      const scoringPrompt = this.buildScoringPrompt(
        responses,
        userContext,
        responseAnalysis
      );
      const model = this.aiService.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const result = await model.generateContent(scoringPrompt);
      const response = result.response.text();

      const aiAnalysis = this.parseAIAnalysis(response);
      const adaptiveScore = this.processAIAnalysis(
        aiAnalysis,
        responses,
        userContext
      );

      await this.storeScoreHistory(userContext.userId, adaptiveScore);

      return adaptiveScore;
    } catch (error) {
      console.error("Adaptive scoring failed:", error);
      return this.calculateFallbackScore(responses, userContext);
    }
  }

  private buildScoringPrompt(
    responses: DynamicResponse[],
    userContext: UserContext,
    responseAnalysis: ResponseAnalysis
  ): string {
    return `
    COMPREHENSIVE MENTAL HEALTH SCORING ANALYSIS

    RESPONSE DATA:
    ${responses
      .map(
        (r) => `
    Q: ${r.question.text}
    A: ${r.answer} (${r.value}/4)
    Category: ${r.question.category}
    Response Time: ${r.responseTime}ms
    Confidence: ${r.confidence}
    Context: ${r.contextualNotes || "None"}
    `
      )
      .join("\n")}

    BEHAVIORAL ANALYSIS:
    - Response timing patterns: ${JSON.stringify(
      responseAnalysis.timingAnalysis
    )}
    - Language sentiment analysis: ${JSON.stringify(
      responseAnalysis.sentimentAnalysis
    )}  
    - Consistency indicators: ${JSON.stringify(
      responseAnalysis.consistencyMetrics
    )}
    - Engagement depth: ${JSON.stringify(responseAnalysis.engagementDepth)}
    - Authenticity markers: ${JSON.stringify(
      responseAnalysis.authenticityIndicators
    )}

    USER CONTEXT:
    - Historical assessment trends: ${this.formatTrends(
      userContext.assessmentHistory
    )}
    - Chat interaction patterns: ${this.analyzeChatPatterns(
      userContext.chatHistory
    )}
    - Demographic factors: ${JSON.stringify(userContext.demographicFactors)}
    - Environmental factors: ${JSON.stringify(userContext.environmentalFactors)}
    - Current stress level: ${userContext.currentStressLevel}
    - Detected concerns: ${userContext.detectedConcerns.join(", ")}

    SCORING REQUIREMENTS:
    1. Calculate primary mental health score (0-100) considering:
       - Direct response values with weighted importance
       - Response authenticity and engagement
       - Temporal patterns and consistency
       - Context-specific risk/protective factors
    
    2. Identify category-specific scores with confidence intervals
    
    3. Detect risk factors requiring immediate attention
    
    4. Identify protective factors and strengths
    
    5. Provide trend analysis compared to previous assessments
    
    6. Generate intervention priorities ranked by urgency
    
    7. Create personalized insights based on unique user patterns

    OUTPUT COMPREHENSIVE SCORING ANALYSIS IN JSON FORMAT:
    {
      "overallScore": number (0-100),
      "confidenceLevel": number (0-1),
      "categoryScores": {
        "academic": {"score": number, "confidence": number, "trend": string},
        "social": {"score": number, "confidence": number, "trend": string},
        "emotional": {"score": number, "confidence": number, "trend": string},
        "behavioral": {"score": number, "confidence": number, "trend": string},
        "cognitive": {"score": number, "confidence": number, "trend": string},
        "physical": {"score": number, "confidence": number, "trend": string}
      },
      "riskFactors": [
        {"factor": string, "severity": number, "evidence": string, "priority": number}
      ],
      "protectiveFactors": [
        {"factor": string, "strength": number, "evidence": string, "reinforcement": string}
      ],
      "trendAnalysis": {
        "overallDirection": string,
        "significantChanges": string[],
        "stabilityScore": number,
        "improvementAreas": string[],
        "concerningPatterns": string[]
      },
      "interventionPriority": [
        {"area": string, "urgency": number, "rationale": string, "suggestedActions": string[]}
      ],
      "personalizedInsights": string[],
      "recommendationStrength": number (0-1)
    }
    `;
  }

  private async analyzeResponses(
    responses: DynamicResponse[]
  ): Promise<ResponseAnalysis> {
    return {
      timingAnalysis: this.analyzeResponseTiming(responses),
      sentimentAnalysis: await this.analyzeSentiment(responses),
      consistencyMetrics: this.calculateConsistency(responses),
      engagementDepth: this.measureEngagement(responses),
      authenticityIndicators: this.detectAuthenticity(responses),
    };
  }

  private analyzeResponseTiming(responses: DynamicResponse[]): TimingAnalysis {
    const times = responses.map((r) => r.responseTime).filter((t) => t > 0);

    if (times.length === 0) {
      return {
        averageTime: 5000,
        variability: 0,
        rushingIndicators: 0,
        deliberationIndicators: 0,
      };
    }

    const averageTime =
      times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) /
      times.length;
    const variability = Math.sqrt(variance);

    const rushingThreshold = 2000; // Less than 2 seconds
    const deliberationThreshold = 15000; // More than 15 seconds

    const rushingIndicators =
      times.filter((t) => t < rushingThreshold).length / times.length;
    const deliberationIndicators =
      times.filter((t) => t > deliberationThreshold).length / times.length;

    return {
      averageTime,
      variability,
      rushingIndicators,
      deliberationIndicators,
    };
  }

  private async analyzeSentiment(
    responses: DynamicResponse[]
  ): Promise<SentimentAnalysis> {
    const textResponses = responses
      .filter((r) => r.answer && r.answer.length > 0)
      .map((r) => r.answer);

    if (textResponses.length === 0) {
      return {
        overallSentiment: "neutral",
        emotionalIntensity: 0.5,
        specificEmotions: [],
        linguisticMarkers: [],
        concerningLanguage: [],
        positiveIndicators: [],
      };
    }

    try {
      const sentimentPrompt = `
        Analyze sentiment and emotional indicators in these mental health assessment responses:
        ${textResponses.join("\n")}
        
        Provide JSON analysis:
        {
          "overallSentiment": "positive|negative|neutral",
          "emotionalIntensity": number (0-1),
          "specificEmotions": string[],
          "linguisticMarkers": string[],
          "concerningLanguage": string[],
          "positiveIndicators": string[]
        }
      `;

      const model = this.aiService.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      const result = await model.generateContent(sentimentPrompt);
      const response = result.response.text();

      return JSON.parse(response.replace(/```json\n?|\n?```/g, "").trim());
    } catch (error) {
      console.error("Sentiment analysis failed:", error);
      return {
        overallSentiment: "neutral",
        emotionalIntensity: 0.5,
        specificEmotions: [],
        linguisticMarkers: [],
        concerningLanguage: [],
        positiveIndicators: [],
      };
    }
  }

  private calculateConsistency(
    responses: DynamicResponse[]
  ): ConsistencyMetrics {
    if (responses.length < 2) {
      return {
        responsePatternScore: 1.0,
        valueConsistency: 1.0,
        temporalConsistency: 1.0,
      };
    }

    // Analyze value consistency within similar categories
    const categoryGroups = responses.reduce((groups, response) => {
      const category = response.question.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(response.value);
      return groups;
    }, {} as Record<string, number[]>);

    let totalConsistency = 0;
    let categoryCount = 0;

    Object.values(categoryGroups).forEach((values) => {
      if (values.length > 1) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          values.length;
        const consistency = Math.max(0, 1 - variance / 4); // Normalize variance
        totalConsistency += consistency;
        categoryCount++;
      }
    });

    const valueConsistency =
      categoryCount > 0 ? totalConsistency / categoryCount : 1.0;

    // Analyze response time consistency
    const times = responses.map((r) => r.responseTime).filter((t) => t > 0);
    let temporalConsistency = 1.0;

    if (times.length > 1) {
      const meanTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const timeVariance =
        times.reduce((sum, time) => sum + Math.pow(time - meanTime, 2), 0) /
        times.length;
      temporalConsistency = Math.max(0, 1 - Math.sqrt(timeVariance) / meanTime);
    }

    return {
      responsePatternScore: (valueConsistency + temporalConsistency) / 2,
      valueConsistency,
      temporalConsistency,
    };
  }

  private measureEngagement(responses: DynamicResponse[]): EngagementDepth {
    // Quality based on confidence scores
    const confidences = responses.map((r) => r.confidence).filter((c) => c > 0);
    const averageConfidence =
      confidences.length > 0
        ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
        : 0.5;

    // Thoughtfulness based on response times
    const times = responses.map((r) => r.responseTime).filter((t) => t > 0);
    const thoughtfulnessScore =
      times.length > 0
        ? Math.min(
            1,
            times.reduce((sum, time) => sum + time, 0) / times.length / 10000
          ) // Normalize to 0-1
        : 0.5;

    // Elaboration level based on text responses
    const textResponses = responses.filter(
      (r) => r.answer && r.answer.length > 10
    );
    const elaborationLevel = textResponses.length / responses.length;

    return {
      interactionQuality: averageConfidence,
      thoughtfulnessScore,
      elaborationLevel,
    };
  }

  private detectAuthenticity(
    responses: DynamicResponse[]
  ): AuthenticityIndicators {
    // Simple heuristics for authenticity detection
    const varianceScore = this.calculateResponseVariance(responses);
    const extremeResponseRatio = this.calculateExtremeResponseRatio(responses);

    // Higher variance and fewer extreme responses suggest more authenticity
    const genuinenessScore = (varianceScore + (1 - extremeResponseRatio)) / 2;

    // Social desirability bias detection (too many "perfect" answers)
    const perfectAnswers = responses.filter(
      (r) => r.value === 0 || r.value === 4
    ).length;
    const socialDesirabilityBias = perfectAnswers / responses.length;

    const candorLevel = 1 - socialDesirabilityBias;

    return {
      genuinenessScore,
      socialDesirabilityBias,
      candorLevel,
    };
  }

  private calculateResponseVariance(responses: DynamicResponse[]): number {
    const values = responses.map((r) => r.value);
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;

    return Math.min(1, variance / 4); // Normalize to 0-1
  }

  private calculateExtremeResponseRatio(responses: DynamicResponse[]): number {
    const extremeResponses = responses.filter(
      (r) => r.value === 0 || r.value === 4
    ).length;
    return responses.length > 0 ? extremeResponses / responses.length : 0;
  }

  private analyzeContextualFactors(userContext: UserContext): any {
    return {
      demographicInfluence: userContext.demographicFactors ? 0.1 : 0,
      environmentalImpact: userContext.environmentalFactors ? 0.1 : 0,
      historicalContext: userContext.assessmentHistory.length * 0.05,
    };
  }

  private analyzeBehavioralPatterns(
    responses: DynamicResponse[],
    userContext: UserContext
  ): any {
    return {
      responseConsistency: this.calculateConsistency(responses),
      engagementLevel: this.measureEngagement(responses),
      adaptationToQuestions:
        userContext.currentSessionContext.questionsAsked > 0 ? 0.8 : 0.5,
    };
  }

  private formatTrends(assessmentHistory: AssessmentResult[]): string {
    if (assessmentHistory.length === 0) return "No historical data";
    if (assessmentHistory.length === 1) return "Single previous assessment";

    const recent = assessmentHistory.slice(-3);
    const scores = recent.map((a) => a.totalScore);
    const trend = scores[scores.length - 1] - scores[0];

    if (trend > 5) return "Increasing stress trend";
    if (trend < -5) return "Improving trend";
    return "Stable pattern";
  }

  private analyzeChatPatterns(chatHistory: any[]): string {
    if (chatHistory.length === 0) return "No chat history";
    return `${chatHistory.length} previous interactions`;
  }

  private parseAIAnalysis(response: string): any {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error("Failed to parse AI analysis:", error);
      return this.getDefaultAnalysis();
    }
  }

  private getDefaultAnalysis(): any {
    return {
      overallScore: 50,
      confidenceLevel: 0.5,
      categoryScores: {
        academic: { score: 50, confidence: 0.5, trend: "stable" },
        social: { score: 50, confidence: 0.5, trend: "stable" },
        emotional: { score: 50, confidence: 0.5, trend: "stable" },
        behavioral: { score: 50, confidence: 0.5, trend: "stable" },
        cognitive: { score: 50, confidence: 0.5, trend: "stable" },
        physical: { score: 50, confidence: 0.5, trend: "stable" },
      },
      riskFactors: [],
      protectiveFactors: [],
      trendAnalysis: {
        overallDirection: "stable",
        significantChanges: [],
        stabilityScore: 0.7,
        improvementAreas: [],
        concerningPatterns: [],
      },
      interventionPriority: [],
      personalizedInsights: ["Assessment completed successfully"],
      recommendationStrength: 0.5,
    };
  }

  private processAIAnalysis(
    aiAnalysis: any,
    responses: DynamicResponse[],
    userContext: UserContext
  ): AdaptiveScore {
    return {
      overallScore: aiAnalysis.overallScore || 50,
      categoryScores: aiAnalysis.categoryScores || {},
      confidenceLevel: aiAnalysis.confidenceLevel || 0.5,
      riskFactors: aiAnalysis.riskFactors || [],
      protectiveFactors: aiAnalysis.protectiveFactors || [],
      trendAnalysis: aiAnalysis.trendAnalysis || {
        overallDirection: "stable",
        significantChanges: [],
        stabilityScore: 0.7,
        improvementAreas: [],
        concerningPatterns: [],
      },
      interventionPriority: aiAnalysis.interventionPriority || [],
      personalizedInsights: aiAnalysis.personalizedInsights || [],
      recommendationStrength: aiAnalysis.recommendationStrength || 0.5,
    };
  }

  private async storeScoreHistory(
    userId: string,
    adaptiveScore: AdaptiveScore
  ): Promise<void> {
    const userHistory = this.scoringHistory.get(userId) || [];
    userHistory.push(adaptiveScore);

    // Keep only last 20 scores per user
    if (userHistory.length > 20) {
      userHistory.splice(0, userHistory.length - 20);
    }

    this.scoringHistory.set(userId, userHistory);
  }

  private calculateFallbackScore(
    responses: DynamicResponse[],
    userContext: UserContext
  ): AdaptiveScore {
    // Simple fallback scoring based on response values
    const totalValue = responses.reduce(
      (sum, response) => sum + response.value,
      0
    );
    const maxPossibleValue = responses.length * 4;
    const overallScore =
      maxPossibleValue > 0
        ? Math.round((totalValue / maxPossibleValue) * 100)
        : 50;

    return {
      overallScore,
      categoryScores: {},
      confidenceLevel: 0.3, // Low confidence for fallback
      riskFactors: [],
      protectiveFactors: [],
      trendAnalysis: {
        overallDirection: "stable",
        significantChanges: [],
        stabilityScore: 0.5,
        improvementAreas: [],
        concerningPatterns: [],
      },
      interventionPriority: [],
      personalizedInsights: ["Fallback scoring used due to technical issues"],
      recommendationStrength: 0.3,
    };
  }

  // Public method to get user's scoring history
  getUserScoringHistory(userId: string): AdaptiveScore[] {
    return this.scoringHistory.get(userId) || [];
  }

  // Public method to clear user's scoring history
  clearUserHistory(userId: string): void {
    this.scoringHistory.delete(userId);
  }
}

export default DynamicScoringEngine;
