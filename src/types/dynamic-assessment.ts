import { AssessmentResult } from "./assessment";

// Core Dynamic Assessment Interfaces
export interface DynamicQuestion {
  id: string;
  text: string;
  category: string;
  subcategory?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  expectedInsights: string[];
  followUpTriggers: string[];
  adaptivePrompts: string[];
  contextualRelevance: number;
  generatedAt: string;
  aiConfidence: number;
}

export interface UserContext {
  userId: string;
  currentStressLevel: number;
  previousAnswers: AssessmentAnswer[];
  responsePatterns: ResponsePattern[];
  engagementMetrics: EngagementMetrics;
  detectedConcerns: string[];
  unexploredAreas: string[];
  preferredQuestionStyle: QuestionStyle;
  assessmentHistory: AssessmentResult[];
  chatHistory: ChatMessage[];
  currentSessionContext: SessionContext;
  demographicFactors?: DemographicFactors;
  environmentalFactors?: EnvironmentalFactors;
}

export interface AssessmentAnswer {
  questionId: string;
  value: number;
  text?: string;
  responseTime: number;
  confidence: number;
  contextualNotes?: string;
}

export interface ResponsePattern {
  averageResponseTime: number;
  consistencyScore: number;
  detailLevel: "brief" | "moderate" | "detailed";
  emotionalOpenness: number;
  truthfulnessIndicators: number;
  engagementTrend: "increasing" | "decreasing" | "stable";
}

export interface EngagementMetrics {
  averageEngagement: number;
  sessionLength: number;
  interactionFrequency: number;
  completionRate: number;
}

export interface SessionContext {
  questionsAsked: number;
  timeSpent: number;
  emotionalIndicators: string[];
  categoriesCovered: string[];
  difficultyProgression: number[];
}

export type QuestionStyle =
  | "direct"
  | "conversational"
  | "analytical"
  | "supportive";

export interface DemographicFactors {
  ageRange: string;
  educationLevel: string;
  culturalBackground?: string;
  primaryLanguage: string;
}

export interface EnvironmentalFactors {
  timeOfAssessment: string;
  deviceType: string;
  location?: string;
  currentLifeEvents?: string[];
}

// Dynamic Response Interface
export interface DynamicResponse {
  questionId: string;
  question: DynamicQuestion;
  answer: string;
  value: number;
  responseTime: number;
  confidence: number;
  text?: string;
  contextualNotes?: string;
  emotionalIndicators?: string[];
}

// Adaptive Scoring Interfaces
export interface AdaptiveScore {
  overallScore: number;
  categoryScores: CategoryScores;
  confidenceLevel: number;
  riskFactors: RiskFactor[];
  protectiveFactors: ProtectiveFactor[];
  trendAnalysis: TrendAnalysis;
  interventionPriority: InterventionPriority[];
  personalizedInsights: string[];
  recommendationStrength: number;
}

export interface CategoryScores {
  [category: string]: {
    score: number;
    confidence: number;
    trend: string;
  };
}

export interface RiskFactor {
  factor: string;
  severity: number;
  evidence: string;
  priority: number;
}

export interface ProtectiveFactor {
  factor: string;
  strength: number;
  evidence: string;
  reinforcement: string;
}

export interface TrendAnalysis {
  overallDirection: string;
  significantChanges: string[];
  stabilityScore: number;
  improvementAreas: string[];
  concerningPatterns: string[];
}

export interface InterventionPriority {
  area: string;
  urgency: number;
  rationale: string;
  suggestedActions: string[];
}

// Progress Tracking Interfaces
export interface ProgressMetrics {
  overallTrend: "improving" | "stable" | "declining" | "fluctuating";
  categoryTrends: Record<string, CategoryTrend>;
  milestoneAchievements: Milestone[];
  interventionEffectiveness: InterventionEffectiveness[];
  predictiveInsights: PredictiveInsight[];
  personalGrowthAreas: GrowthArea[];
  riskFactorEvolution: RiskFactorChange[];
}

export interface CategoryTrend {
  trend: string;
  changeRate: number;
  significance: number;
}

export interface Milestone {
  milestone: string;
  achievedDate: string;
  significance: number;
  celebrationMessage: string;
}

export interface InterventionEffectiveness {
  intervention: string;
  effectivenessScore: number;
  evidence: string[];
  recommendation: "continue" | "modify" | "discontinue" | "intensify";
}

export interface PredictiveInsight {
  timeframe: "30" | "60" | "90";
  prediction: string;
  confidence: number;
  recommendedActions: string[];
}

export interface GrowthArea {
  area: string;
  currentLevel: number;
  potential: number;
  developmentStrategy: string;
  timelineEstimate: string;
}

export interface RiskFactorChange {
  riskFactor: string;
  trend: "increasing" | "decreasing" | "stable";
  currentSeverity: number;
  projectedTrajectory: string;
  mitigationStrategies: string[];
}

// Chat and Context Interfaces
export interface ConversationContext {
  assessmentContext: AssessmentContext;
  userMentalState: MentalStateProfile;
  conversationHistory: ChatMessage[];
  contextVector: number[];
  activeTopics: string[];
  emotionalJourney: EmotionalStatePoint[];
  interventionOpportunities: InterventionOpportunity[];
}

export interface AssessmentContext {
  overallScore: number;
  primaryConcerns: string[];
  strengthAreas: string[];
  riskFactors: RiskFactor[];
  protectiveFactors: ProtectiveFactor[];
  interventionPriorities: InterventionPriority[];
}

export interface MentalStateProfile {
  communicationPreference: string;
  emotionalOpenness: number;
  previousChatPatterns: string;
  demographicContext: string;
}

export interface ChatMessage {
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  context?: {
    messageType?: string;
    suggestedTopics?: string[];
    supportLevel?: string;
  };
}

export interface EmotionalStatePoint {
  timestamp: Date;
  state: string;
  intensity: number;
  triggers?: string[];
}

export interface InterventionOpportunity {
  type: string;
  urgency: number;
  description: string;
  suggestedActions: string[];
}

// Chat Response Interface
export interface ChatResponse {
  message: string;
  suggestedActions: SuggestedAction[];
  interventionOpportunities: InterventionOpportunity[];
  emotionalSupport: string;
  followUpPrompts: string[];
}

export interface SuggestedAction {
  action: string;
  timeframe: string;
  benefit: string;
}

// Memory Management Interfaces
export interface UserMemoryProfile {
  userId: string;
  mentalHealthJourney: MentalHealthJourney;
  communicationPreferences: CommunicationPreferences;
  interventionHistory: InterventionRecord[];
  personalInsights: PersonalInsight[];
  contextualPatterns: ContextualPattern[];
  longTermGoals: Goal[];
  significantEvents: SignificantEvent[];
  adaptationPreferences: AdaptationPreference[];
}

export interface MentalHealthJourney {
  phases: JourneyPhase[];
  overallTrajectory: string;
  resilienceFactors: string[];
  vulnerabilityPoints: string[];
}

export interface JourneyPhase {
  period: string;
  characterization: string;
  keyEvents: string[];
  progressIndicators: string[];
  challenges: string[];
}

export interface CommunicationPreferences {
  languageStyle: "formal" | "casual" | "conversational" | "supportive";
  complexityPreference: number;
  emotionalOpenness: number;
  questionTypePreferences: string[];
  feedbackStyle: "direct" | "gentle" | "encouraging" | "analytical";
  culturalConsiderations: string[];
}

export interface InterventionRecord {
  intervention: string;
  effectivenessRating: number;
  contextFactors: string[];
  durationTested: string;
  userFeedback: string;
  recommendationStatus: "continue" | "modify" | "discontinue";
}

export interface PersonalInsight {
  insight: string;
  confidence: number;
  evidenceSources: string[];
  applicationAreas: string[];
}

export interface ContextualPattern {
  pattern: string;
  triggers: string[];
  consequences: string[];
  mitigation: string[];
}

export interface Goal {
  description: string;
  timeline: string;
  progress: number;
  milestones: string[];
}

export interface SignificantEvent {
  event: string;
  date: string;
  impact: string;
  lessons: string[];
}

export interface AdaptationPreference {
  changeTolerance: number;
  learningStyle: string[];
  challengeAcceptance: number;
  supportSeeking: "high" | "moderate" | "low";
  autonomyPreference: number;
}

// Crisis Detection Interfaces
export interface CrisisIndicator {
  type: string;
  severity: number;
  context: string;
  detectedAt: Date;
}

export interface CrisisResponse {
  message: string;
  immediateActions: string[];
  resources: EmergencyResource[];
  followUpPlan: string[];
  professionalReferral: boolean;
}

export interface EmergencyResource {
  name: string;
  type: "hotline" | "emergency" | "professional" | "online";
  contact: string;
  availability: string;
  description: string;
}

// Assessment Session Interfaces
export interface DynamicAssessmentSession {
  sessionId: string;
  userId: string;
  questions: DynamicQuestion[];
  responses: DynamicResponse[];
  context: UserContext;
  startTime: Date;
  endTime?: Date;
  status: "active" | "completed" | "paused" | "cancelled";
  adaptationEnabled: boolean;
  aiOrchestration: boolean;
}

export interface AssessmentState {
  session: DynamicAssessmentSession;
  nextQuestion?: DynamicQuestion;
  completionRecommended: boolean;
  interventionRequired: boolean;
  crisisDetected: boolean;
}

export interface AssessmentCompletion {
  score: AdaptiveScore;
  chatSession: ChatSession;
  recommendations: PersonalizedRecommendations;
  progressUpdate: ProgressUpdate;
  completionCelebration: CompletionCelebration;
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  context: ConversationContext;
  messages: ChatMessage[];
  sessionType: string;
  status: "active" | "completed" | "paused";
}

export interface PersonalizedRecommendations {
  immediateActions: RecommendationItem[];
  shortTermGoals: RecommendationItem[];
  longTermAspirations: RecommendationItem[];
  adaptiveStrategies: RecommendationItem[];
  socialConnection: RecommendationItem[];
  learningDevelopment: RecommendationItem[];
}

export interface RecommendationItem {
  title: string;
  description: string;
  actionSteps: string[];
  timeframe: string;
  difficulty: number;
  expectedBenefit: string;
  resources?: string[];
}

export interface ProgressUpdate {
  previousScore?: number;
  currentScore: number;
  improvement: number;
  keyChanges: string[];
  nextMilestone: string;
}

export interface CompletionCelebration {
  message: string;
  achievements: string[];
  encouragement: string;
  nextSteps: string[];
}

// Extended Assessment Result Interface
export interface ExtendedAssessmentResult extends AssessmentResult {
  adaptiveScore: AdaptiveScore;
  userContext: UserContext;
  sessionSummary: SessionSummary;
  aiInsights: AIInsights[];
  recommendedFollowUp: FollowUpRecommendation[];
}

export interface SessionSummary {
  questionsAnswered: number;
  totalTime: number;
  engagementLevel: number;
  adaptationsMade: number;
  categoriesExplored: string[];
}

export interface AIInsights {
  category: string;
  insight: string;
  confidence: number;
  actionable: boolean;
  priority: number;
}

export interface FollowUpRecommendation {
  type: "assessment" | "chat" | "professional" | "resource";
  description: string;
  timeframe: string;
  priority: number;
}

// Error Handling
export interface AssessmentError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}

export class AssessmentInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssessmentInitializationError";
  }
}

export class SystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SystemError";
  }
}
