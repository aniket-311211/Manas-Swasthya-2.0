import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageCircle,
  TrendingUp,
  Shield,
  Lightbulb,
} from "lucide-react";
import AIAssessmentEngine from "./ai/AIAssessmentEngine";
import { AssessmentResult } from "@/types/assessment";
import {
  DynamicAssessmentSession,
  DynamicQuestion,
  AssessmentState,
  AssessmentCompletion,
  AdaptiveScore,
} from "@/types/dynamic-assessment";

interface DynamicAssessmentProps {
  onClose: () => void;
  onComplete: (
    result: AssessmentResult & { adaptiveScore: AdaptiveScore }
  ) => void;
}

interface QuestionResponse {
  answer: string;
  value: number;
  responseTime: number;
  confidence: number;
  additionalNotes?: string;
}

const DynamicAssessment: React.FC<DynamicAssessmentProps> = ({
  onClose,
  onComplete,
}) => {
  const { user } = useUser();
  const [assessmentEngine] = useState(
    () =>
      new AIAssessmentEngine({
        apiKey:
          import.meta.env.VITE_GEMINI_API_KEY ||
          import.meta.env.VITE_GEMINI_FALLBACK_API_KEY ||
          "",
        initialQuestionCount: 5,
        maxQuestionsPerSession: 15,
        crisisDetectionEnabled: true,
        adaptationThreshold: 0.7,
      })
  );

  // State management
  const [currentSession, setCurrentSession] =
    useState<DynamicAssessmentSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [completionData, setCompletionData] =
    useState<AssessmentCompletion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [crisisDetected, setCrisisDetected] = useState(false);

  // Initialize assessment when component mounts
  useEffect(() => {
    initializeAssessment();
  }, []);

  const initializeAssessment = async () => {
    if (!user?.id) {
      setError("User authentication required");
      return;
    }

    try {
      setIsInitializing(true);
      const session = await assessmentEngine.startDynamicAssessment(user.id);
      setCurrentSession(session);
      setQuestionStartTime(Date.now());
      setError(null);
    } catch (error) {
      console.error("Failed to initialize assessment:", error);
      setError("Failed to start assessment. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAnswer = async (
    answer: string,
    value: number,
    confidence: number = 0.8
  ) => {
    if (!currentSession || !user?.id) return;

    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    setIsLoading(true);

    try {
      // Calculate response time
      const responseTime = Date.now() - questionStartTime;

      // Create response object
      const response: QuestionResponse = {
        answer,
        value,
        responseTime,
        confidence,
      };

      // Add to responses
      const newResponses = [...responses, response];
      setResponses(newResponses);

      // Process response with AI engine
      const assessmentState = await assessmentEngine.processUserResponse(
        currentSession.sessionId,
        {
          sessionId: currentSession.sessionId,
          questionId: currentQuestion.id,
          answer,
          value,
          responseTime,
          confidence,
        }
      );

      // Handle crisis detection
      if (assessmentState.crisisDetected) {
        setCrisisDetected(true);
        await handleCrisisScenario();
        return;
      }

      // Update session state
      setCurrentSession(assessmentState.session);

      // Check if assessment should be completed
      if (
        assessmentState.completionRecommended ||
        currentQuestionIndex >= currentSession.questions.length - 1
      ) {
        await completeAssessment(assessmentState.session);
      } else {
        // Move to next question
        setCurrentQuestionIndex((prev) => prev + 1);
        setQuestionStartTime(Date.now());
      }
    } catch (error) {
      console.error("Error processing response:", error);
      setError("Failed to process your response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const completeAssessment = async (session: DynamicAssessmentSession) => {
    try {
      setIsLoading(true);

      // Get completion data from AI engine
      const completion = await assessmentEngine.completeAssessment(
        session.sessionId
      );
      setCompletionData(completion);
      setAssessmentComplete(true);

      // Convert to traditional assessment result format for compatibility
      const traditionalResult: AssessmentResult = {
        stress: completion.score.overallScore,
        anxiety: completion.score.categoryScores.emotional?.score || 50,
        sleep: completion.score.categoryScores.behavioral?.score || 50,
        stressLevel: getStressLevel(completion.score.overallScore),
        totalScore: completion.score.overallScore,
        activities: completion.recommendations.immediateActions.map(
          (action) => ({
            name: action.title,
            duration: action.timeframe,
          })
        ),
        games: completion.recommendations.shortTermGoals.map((goal) => ({
          name: goal.title,
          duration: goal.timeframe,
        })),
        categoryScores: {
          academicPressure:
            completion.score.categoryScores.academic?.score || 0,
          familyRelationships:
            completion.score.categoryScores.social?.score || 0,
          peerSocial: completion.score.categoryScores.social?.score || 0,
          futureUncertainty:
            completion.score.categoryScores.cognitive?.score || 0,
          sleepWorries: completion.score.categoryScores.behavioral?.score || 0,
          modernCoping: completion.score.categoryScores.emotional?.score || 0,
        },
      };

      // Call completion callback with both traditional and adaptive scores
      onComplete({
        ...traditionalResult,
        adaptiveScore: completion.score,
      });
    } catch (error) {
      console.error("Error completing assessment:", error);
      setError("Failed to complete assessment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrisisScenario = async () => {
    // In a real implementation, this would trigger crisis intervention protocols
    setError(
      "We noticed you might be going through a difficult time. Please consider reaching out to a mental health professional or crisis hotline immediately."
    );
  };

  const getCurrentQuestion = (): DynamicQuestion | null => {
    if (
      !currentSession ||
      currentQuestionIndex >= currentSession.questions.length
    ) {
      return null;
    }
    return currentSession.questions[currentQuestionIndex];
  };

  const getStressLevel = (score: number): string => {
    if (score <= 25) return "Low";
    if (score <= 50) return "Mild";
    if (score <= 75) return "Moderate";
    return "High";
  };

  const getProgress = (): number => {
    if (!currentSession) return 0;
    return Math.min(
      100,
      ((currentQuestionIndex + 1) /
        Math.max(currentSession.questions.length, 5)) *
        100
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      academic: Brain,
      social: Heart,
      emotional: Heart,
      behavioral: TrendingUp,
      cognitive: Brain,
      physical: Shield,
    };
    return icons[category as keyof typeof icons] || Brain;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      academic: "bg-blue-100 text-blue-800",
      social: "bg-green-100 text-green-800",
      emotional: "bg-purple-100 text-purple-800",
      behavioral: "bg-orange-100 text-orange-800",
      cognitive: "bg-cyan-100 text-cyan-800",
      physical: "bg-pink-100 text-pink-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  // Render loading state
  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">
              Initializing AI Assessment...
            </h3>
            <p className="text-gray-600">
              Our AI is preparing personalized questions for you
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-red-600">
              Assessment Error
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3 justify-center">
              <Button onClick={initializeAssessment} variant="default">
                Try Again
              </Button>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render crisis detection state
  if (crisisDetected) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-4 text-red-600">
              Immediate Support Available
            </h3>
            <p className="text-gray-700 mb-6">
              We're concerned about your wellbeing. Please reach out for
              immediate support:
            </p>
            <div className="space-y-3 text-left bg-red-50 rounded-lg p-4 mb-6">
              <p>
                <strong>National Suicide Prevention Lifeline:</strong> 988
              </p>
              <p>
                <strong>Crisis Text Line:</strong> Text HOME to 741741
              </p>
              <p>
                <strong>Emergency Services:</strong> 911
              </p>
            </div>
            <div className="flex space-x-3 justify-center">
              <Button
                onClick={() => window.open("tel:988")}
                className="bg-red-600 hover:bg-red-700"
              >
                Call 988 Now
              </Button>
              <Button onClick={onClose} variant="outline">
                Close Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render completion state
  if (assessmentComplete && completionData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-green-600">
              Assessment Complete! 🎉
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {completionData.completionCelebration.message}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Overview */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                Your Mental Wellness Score
              </h3>
              <div className="text-3xl font-bold text-center mb-2">
                {completionData.score.overallScore}/100
              </div>
              <div className="text-center">
                <Badge
                  className={`${
                    getStressLevel(completionData.score.overallScore) === "Low"
                      ? "bg-green-100 text-green-800"
                      : getStressLevel(completionData.score.overallScore) ===
                        "Mild"
                      ? "bg-yellow-100 text-yellow-800"
                      : getStressLevel(completionData.score.overallScore) ===
                        "Moderate"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {getStressLevel(completionData.score.overallScore)} Stress
                  Level
                </Badge>
              </div>
            </div>

            {/* Key Insights */}
            {completionData.score.personalizedInsights.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Key Insights
                </h3>
                <div className="space-y-2">
                  {completionData.score.personalizedInsights
                    .slice(0, 3)
                    .map((insight, index) => (
                      <div
                        key={index}
                        className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm"
                      >
                        {insight}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Immediate Recommendations */}
            {completionData.recommendations.immediateActions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  Immediate Actions
                </h3>
                <div className="space-y-3">
                  {completionData.recommendations.immediateActions
                    .slice(0, 2)
                    .map((action, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                      >
                        <h4 className="font-medium text-blue-900 mb-2">
                          {action.title}
                        </h4>
                        <p className="text-sm text-blue-700 mb-2">
                          {action.description}
                        </p>
                        <p className="text-xs text-blue-600">
                          ⏱️ {action.timeframe}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Chat Invitation */}
            {completionData.chatSession && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-900 mb-2">
                  Continue with AI Support Chat
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  Get personalized guidance and support based on your assessment
                  results
                </p>
                <Button className="bg-green-600 hover:bg-green-700" size="sm">
                  Start Chat Session
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-4">
              <Button
                onClick={() => {
                  // Here you could navigate to detailed report or chat
                  onClose();
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                View Detailed Report
              </Button>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main assessment interface
  const currentQuestion = getCurrentQuestion();
  if (!currentSession || !currentQuestion) {
    return null;
  }

  const IconComponent = getCategoryIcon(currentQuestion.category);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <Brain className="w-6 h-6 mr-2 text-purple-600" />
              AI-Powered Assessment
            </CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Question {currentQuestionIndex + 1} of{" "}
                {currentSession.questions.length}
              </span>
              <span>{Math.round(getProgress())}% Complete</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Question Category Badge */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                  currentQuestion.category
                )}`}
              >
                <IconComponent className="w-4 h-4 mr-1" />
                {currentQuestion.category.charAt(0).toUpperCase() +
                  currentQuestion.category.slice(1)}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
              {currentQuestion.text}
            </h3>

            {/* Answer Options */}
            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
              {["Never", "Rarely", "Sometimes", "Often", "Always"].map(
                (option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(option, index)}
                    variant="outline"
                    disabled={isLoading}
                    className="h-12 text-base hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all justify-start"
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 ${
                      index === 0 ? 'bg-green-100 text-green-600' :
                      index === 1 ? 'bg-blue-100 text-blue-600' :
                      index === 2 ? 'bg-yellow-100 text-yellow-600' :
                      index === 3 ? 'bg-orange-100 text-orange-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {index}
                    </span>
                    <span className="flex-1">{option}</span>
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">
                Processing your response...
              </p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            🔒 Your responses are confidential and will be used to provide
            personalized mental health insights.
            <br />
            <span className="text-xs text-purple-600 mt-1 block">
              Choose the frequency that best matches your experience: Never (0) → Always (4)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicAssessment;
