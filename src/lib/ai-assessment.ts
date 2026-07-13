// AI Assessment Integration Service
import { GoogleGenerativeAI } from "@google/generative-ai";
import AIAssessmentEngine from "@/components/ai/AIAssessmentEngine";
import { AssessmentResult } from "@/types/assessment";
import { AdaptiveScore } from "@/types/dynamic-assessment";

class AIAssessmentService {
  private static instance: AIAssessmentService;
  private engine: AIAssessmentEngine;
  private isInitialized: boolean = false;

  private constructor() {
    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.VITE_GEMINI_FALLBACK_API_KEY;

    if (!apiKey) {
      console.warn(
        "No Gemini API key found. AI Assessment features will be limited."
      );
    }

    this.engine = new AIAssessmentEngine({
      apiKey: apiKey || "",
      initialQuestionCount: 5,
      maxQuestionsPerSession: 15,
      crisisDetectionEnabled: true,
      adaptationThreshold: 0.7,
    });

    this.isInitialized = !!apiKey;
  }

  public static getInstance(): AIAssessmentService {
    if (!AIAssessmentService.instance) {
      AIAssessmentService.instance = new AIAssessmentService();
    }
    return AIAssessmentService.instance;
  }

  public isAvailable(): boolean {
    return this.isInitialized;
  }

  public getEngine(): AIAssessmentEngine {
    if (!this.isInitialized) {
      throw new Error(
        "AI Assessment Service is not initialized. Please check your API configuration."
      );
    }
    return this.engine;
  }

  // Test connectivity to AI services
  public async testConnectivity(): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      const apiKey =
        import.meta.env.VITE_GEMINI_API_KEY ||
        import.meta.env.VITE_GEMINI_FALLBACK_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      await model.generateContent("Test connectivity");
      return true;
    } catch (error) {
      console.error("AI connectivity test failed:", error);
      return false;
    }
  }

  // Convert adaptive score to traditional assessment result format
  public convertToTraditionalResult(
    adaptiveScore: AdaptiveScore,
    _responses: unknown[]
  ): AssessmentResult {
    return {
      stress: adaptiveScore.overallScore,
      anxiety: adaptiveScore.categoryScores.emotional?.score || 50,
      sleep: 100 - (adaptiveScore.categoryScores.behavioral?.score || 50), // Invert for sleep quality
      stressLevel: this.getStressLevel(adaptiveScore.overallScore),
      totalScore: adaptiveScore.overallScore,
      activities: this.generateActivitiesFromInsights(adaptiveScore),
      games: this.generateGamesFromInsights(adaptiveScore),
      categoryScores: {
        academicPressure: adaptiveScore.categoryScores.academic?.score || 0,
        familyRelationships: adaptiveScore.categoryScores.social?.score || 0,
        peerSocial: adaptiveScore.categoryScores.social?.score || 0,
        futureUncertainty: adaptiveScore.categoryScores.cognitive?.score || 0,
        sleepWorries: adaptiveScore.categoryScores.behavioral?.score || 0,
        modernCoping: adaptiveScore.categoryScores.emotional?.score || 0,
      },
    };
  }

  private getStressLevel(score: number): string {
    if (score <= 25) return "Low";
    if (score <= 50) return "Mild";
    if (score <= 75) return "Moderate";
    return "High";
  }

  private generateActivitiesFromInsights(
    adaptiveScore: AdaptiveScore
  ): Array<{ name: string; duration: string }> {
    const activities = [];

    // Generate activities based on risk factors and insights
    if (adaptiveScore.riskFactors.some((rf) => rf.factor.includes("stress"))) {
      activities.push({ name: "Deep Breathing Exercise", duration: "10 min" });
    }

    if (adaptiveScore.riskFactors.some((rf) => rf.factor.includes("anxiety"))) {
      activities.push({
        name: "Progressive Muscle Relaxation",
        duration: "15 min",
      });
    }

    if (adaptiveScore.riskFactors.some((rf) => rf.factor.includes("sleep"))) {
      activities.push({ name: "Sleep Hygiene Routine", duration: "20 min" });
    }

    // Default activities if no specific risks identified
    if (activities.length === 0) {
      activities.push(
        { name: "Mindful Walking", duration: "10 min" },
        { name: "Gratitude Journaling", duration: "5 min" },
        { name: "Meditation", duration: "10 min" }
      );
    }

    return activities.slice(0, 3);
  }

  private generateGamesFromInsights(
    adaptiveScore: AdaptiveScore
  ): Array<{ name: string; duration: string }> {
    const games = [];

    // Generate games based on protective factors and insights
    if (
      adaptiveScore.protectiveFactors.some((pf) =>
        pf.factor.includes("mindfulness")
      )
    ) {
      games.push({ name: "Mindful Breathing Game", duration: "5 min" });
    }

    if (
      adaptiveScore.protectiveFactors.some((pf) =>
        pf.factor.includes("creativity")
      )
    ) {
      games.push({ name: "Creative Expression Activity", duration: "15 min" });
    }

    if (
      adaptiveScore.protectiveFactors.some((pf) => pf.factor.includes("social"))
    ) {
      games.push({ name: "Social Connection Challenge", duration: "20 min" });
    }

    // Default games if no specific protective factors identified
    if (games.length === 0) {
      games.push(
        { name: "Positive Affirmation Cards", duration: "10 min" },
        { name: "Relaxation Music Therapy", duration: "15 min" },
        { name: "Mindfulness Bingo", duration: "10 min" }
      );
    }

    return games.slice(0, 3);
  }

  // Get service statistics
  public getServiceStats() {
    return {
      initialized: this.isInitialized,
      apiKeyAvailable: !!(
        import.meta.env.VITE_GEMINI_API_KEY ||
        import.meta.env.VITE_GEMINI_FALLBACK_API_KEY
      ),
      activeSessions: this.engine.getActiveSessionsCount(),
      version: "1.0.0",
    };
  }
}

// Export singleton instance
export const aiAssessmentService = AIAssessmentService.getInstance();

// Export types for convenience
export type { AdaptiveScore } from "@/types/dynamic-assessment";
export type { AssessmentResult } from "@/types/assessment";

export default AIAssessmentService;
