import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Heart, 
  Moon, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  MessageCircle,
  Lightbulb,
  Shield
} from 'lucide-react';
import { geminiService } from '@/lib/gemini';

interface Question {
  id: number;
  text: string;
  category: 'stress' | 'anxiety' | 'sleep';
  options: string[];
  isCore: boolean;
  followUpTrigger?: (score: number) => boolean;
}

interface UserResponse {
  questionId: number;
  selectedOption: string;
  optionIndex: number;
  freeText?: string;
  timestamp: number;
}

interface AssessmentScores {
  stress: number;
  anxiety: number;
  sleep: number;
}

interface AssessmentResult {
  scores: AssessmentScores;
  riskLevel: 'safe' | 'moderate' | 'critical';
  recommendations: string[];
  needsFollowUp: boolean;
}

const SmartAssessment: React.FC<{ onClose: () => void; onComplete: (result: AssessmentResult) => void }> = ({ 
  onClose, 
  onComplete 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [currentScores, setCurrentScores] = useState<AssessmentScores>({ stress: 0, anxiety: 0, sleep: 0 });
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [freeText, setFreeText] = useState('');
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [finalResult, setFinalResult] = useState<AssessmentResult | null>(null);

  // Core screening questions
  const coreQuestions: Question[] = [
    {
      id: 1,
      text: "How would you describe your current stress level?",
      category: 'stress',
      options: [
        "I feel completely relaxed and in control",
        "I feel mostly calm with occasional mild stress",
        "I feel moderately stressed most of the time",
        "I feel overwhelmed and constantly under pressure"
      ],
      isCore: true,
      followUpTrigger: (score) => score >= 6
    },
    {
      id: 2,
      text: "How often do you experience worry or anxiety?",
      category: 'anxiety',
      options: [
        "Rarely or never - I feel generally calm",
        "Occasionally when facing specific challenges",
        "Frequently throughout the day",
        "Almost constantly - it's hard to stop worrying"
      ],
      isCore: true,
      followUpTrigger: (score) => score >= 6
    },
    {
      id: 3,
      text: "How would you rate your sleep quality recently?",
      category: 'sleep',
      options: [
        "Excellent - I sleep well and wake up refreshed",
        "Good - I usually get adequate rest",
        "Poor - I often have trouble sleeping or staying asleep",
        "Very poor - I rarely get quality sleep"
      ],
      isCore: true,
      followUpTrigger: (score) => score <= 4
    }
  ];

  useEffect(() => {
    setQuestions(coreQuestions);
  }, []);

  const calculateScoreFromResponse = (questionIndex: number, optionIndex: number): number => {
    const question = questions[questionIndex];
    
    if (question.category === 'sleep') {
      // For sleep, higher option index = worse sleep = lower score
      return Math.max(0, 10 - (optionIndex * 3));
    } else {
      // For stress/anxiety, higher option index = more stress/anxiety = higher score
      return Math.min(10, optionIndex * 3);
    }
  };

  const updateScores = (responses: UserResponse[]): AssessmentScores => {
    const scores: AssessmentScores = { stress: 0, anxiety: 0, sleep: 10 };
    
    responses.forEach(response => {
      const question = questions.find(q => q.id === response.questionId);
      if (!question) return;
      
      const score = calculateScoreFromResponse(
        questions.findIndex(q => q.id === response.questionId),
        response.optionIndex
      );
      
      if (question.category === 'stress') {
        scores.stress = Math.max(scores.stress, score);
      } else if (question.category === 'anxiety') {
        scores.anxiety = Math.max(scores.anxiety, score);
      } else if (question.category === 'sleep') {
        scores.sleep = Math.min(scores.sleep, score);
      }
    });
    
    return scores;
  };

  const getRiskLevel = (scores: AssessmentScores): 'safe' | 'moderate' | 'critical' => {
    const avgScore = (scores.stress + scores.anxiety + (10 - scores.sleep)) / 3;
    
    if (avgScore <= 3) return 'safe';
    if (avgScore <= 6) return 'moderate';
    return 'critical';
  };

  const shouldContinueAssessment = (scores: AssessmentScores): boolean => {
    const riskLevel = getRiskLevel(scores);
    return riskLevel === 'moderate' || riskLevel === 'critical';
  };

  const generateFollowUpQuestion = async (responses: UserResponse[]): Promise<Question | null> => {
    if (!responses.length) return null;
    
    setIsGeneratingQuestion(true);
    
    try {
      const responseText = responses.map(r => 
        `Q: ${questions.find(q => q.id === r.questionId)?.text}\nA: ${r.selectedOption}${r.freeText ? `\nAdditional notes: ${r.freeText}` : ''}`
      ).join('\n\n');
      
      const scores = updateScores(responses);
      
      const prompt = `
Based on these mental health screening responses, generate a targeted follow-up question:

${responseText}

Current scores: Stress: ${scores.stress}/10, Anxiety: ${scores.anxiety}/10, Sleep: ${scores.sleep}/10

Generate ONE specific follow-up question that:
1. Addresses the highest concern area
2. Helps understand the root cause or severity
3. Is empathetic and non-judgmental
4. Includes exactly 4 multiple choice options that range from mild to severe

Respond in this exact JSON format:
{
  "question": "Your question here",
  "category": "stress|anxiety|sleep",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
}
`;

      const response = await geminiService.sendMessage(prompt);
      const questionData = JSON.parse(response.trim());
      
      const newQuestion: Question = {
        id: questions.length + 1,
        text: questionData.question,
        category: questionData.category,
        options: questionData.options,
        isCore: false
      };
      
      return newQuestion;
    } catch (error) {
      console.error('Error generating follow-up question:', error);
      return null;
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleAnswer = async (optionIndex: number, option: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const response: UserResponse = {
      questionId: currentQuestion.id,
      selectedOption: option,
      optionIndex,
      freeText: freeText.trim() || undefined,
      timestamp: Date.now()
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);
    setSelectedOption(null);
    setFreeText('');

    // Update scores
    const newScores = updateScores(newResponses);
    setCurrentScores(newScores);

    // Check if we should continue after core questions
    if (currentQuestionIndex === 2) { // After all 3 core questions
      const shouldContinue = shouldContinueAssessment(newScores);
      
      if (!shouldContinue) {
        // End assessment early
        await completeAssessment(newResponses, newScores);
        return;
      } else {
        // Generate follow-up question
        const followUpQuestion = await generateFollowUpQuestion(newResponses);
        if (followUpQuestion) {
          setQuestions(prev => [...prev, followUpQuestion]);
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          await completeAssessment(newResponses, newScores);
        }
        return;
      }
    }

    // Continue with next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Check if we need more follow-up questions
      const shouldContinue = shouldContinueAssessment(newScores);
      if (shouldContinue && questions.length < 8) { // Max 8 questions total
        const followUpQuestion = await generateFollowUpQuestion(newResponses);
        if (followUpQuestion) {
          setQuestions(prev => [...prev, followUpQuestion]);
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          await completeAssessment(newResponses, newScores);
        }
      } else {
        await completeAssessment(newResponses, newScores);
      }
    }
  };

  const completeAssessment = async (responses: UserResponse[], scores: AssessmentScores) => {
    const riskLevel = getRiskLevel(scores);
    
    const recommendations = generateRecommendations(scores, riskLevel);
    
    const result: AssessmentResult = {
      scores,
      riskLevel,
      recommendations,
      needsFollowUp: riskLevel !== 'safe'
    };

    setFinalResult(result);
    setAssessmentComplete(true);
    onComplete(result);
  };

  const generateRecommendations = (scores: AssessmentScores, riskLevel: string): string[] => {
    const recommendations: string[] = [];
    
    if (riskLevel === 'critical') {
      recommendations.push("Consider speaking with a mental health professional");
      recommendations.push("Reach out to a trusted friend or family member");
    }
    
    if (scores.stress >= 7) {
      recommendations.push("Try deep breathing exercises or meditation");
      recommendations.push("Consider stress management techniques");
    }
    
    if (scores.anxiety >= 7) {
      recommendations.push("Practice grounding techniques (5-4-3-2-1 method)");
      recommendations.push("Consider limiting caffeine intake");
    }
    
    if (scores.sleep <= 4) {
      recommendations.push("Establish a consistent sleep schedule");
      recommendations.push("Create a relaxing bedtime routine");
    }
    
    if (riskLevel === 'safe') {
      recommendations.push("Keep up the good work with your mental wellness");
      recommendations.push("Continue your current healthy habits");
    }
    
    return recommendations;
  };

  const getScoreColor = (score: number, category: string) => {
    if (category === 'sleep') {
      if (score >= 8) return 'text-green-600';
      if (score >= 5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (score <= 3) return 'text-green-600';
      if (score <= 6) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'safe': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (assessmentComplete && finalResult) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Assessment Complete!</CardTitle>
            <Badge className={getRiskBadgeColor(finalResult.riskLevel)}>
              {finalResult.riskLevel.toUpperCase()} LEVEL
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scores Display */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Brain className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className={`text-2xl font-bold ${getScoreColor(finalResult.scores.stress, 'stress')}`}>
                  {finalResult.scores.stress}/10
                </div>
                <p className="text-sm text-gray-600">Stress Level</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Heart className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className={`text-2xl font-bold ${getScoreColor(finalResult.scores.anxiety, 'anxiety')}`}>
                  {finalResult.scores.anxiety}/10
                </div>
                <p className="text-sm text-gray-600">Anxiety Level</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Moon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className={`text-2xl font-bold ${getScoreColor(finalResult.scores.sleep, 'sleep')}`}>
                  {finalResult.scores.sleep}/10
                </div>
                <p className="text-sm text-gray-600">Sleep Quality</p>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Personalized Recommendations
              </h3>
              <div className="space-y-2">
                {finalResult.recommendations.map((rec, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Crisis Support */}
            {finalResult.riskLevel === 'critical' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-2">Immediate Support Available</h4>
                    <p className="text-sm text-red-800 mb-3">
                      If you're in crisis or need immediate support:
                    </p>
                    <div className="space-y-1 text-sm text-red-700">
                      <p><strong>Crisis Hotline:</strong> 988 (24/7)</p>
                      <p><strong>Text Support:</strong> Text HOME to 741741</p>
                      <p><strong>Emergency:</strong> 911</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4 pt-4">
              <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700">
                Close Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isGeneratingQuestion) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              {/* Skeleton effect for question generation */}
              <div className="animate-pulse">
                <div className="h-4 bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200 rounded-full mb-4"></div>
                <div className="h-6 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 rounded-full mb-6"></div>
                <div className="space-y-3">
                  <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg"></div>
                  <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg"></div>
                  <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg"></div>
                  <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg"></div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2 text-purple-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-lg font-medium">Analyzing your responses...</span>
              </div>
              <p className="text-gray-600">
                Generating personalized follow-up question based on your answers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  const progress = ((currentQuestionIndex + 1) / Math.max(3, questions.length)) * 100;
  const isLastCoreQuestion = currentQuestionIndex === 2;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <Brain className="w-6 h-6 mr-2 text-purple-600" />
              Smart Mental Health Assessment
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
                Question {currentQuestionIndex + 1}
                {isLastCoreQuestion ? ' (Final Core Question)' : currentQuestion.isCore ? ' (Core)' : ' (Follow-up)'}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Live Score Display */}
            {responses.length > 0 && (
              <div className="flex justify-center space-x-4 text-xs">
                <span className={`${getScoreColor(currentScores.stress, 'stress')}`}>
                  Stress: {currentScores.stress}/10
                </span>
                <span className={`${getScoreColor(currentScores.anxiety, 'anxiety')}`}>
                  Anxiety: {currentScores.anxiety}/10
                </span>
                <span className={`${getScoreColor(currentScores.sleep, 'sleep')}`}>
                  Sleep: {currentScores.sleep}/10
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            {/* Question Category Badge */}
            <div className="mb-4">
              <Badge className={`${
                currentQuestion.category === 'stress' ? 'bg-red-100 text-red-800' :
                currentQuestion.category === 'anxiety' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {currentQuestion.category.charAt(0).toUpperCase() + currentQuestion.category.slice(1)}
                {currentQuestion.isCore && ' - Core Question'}
              </Badge>
            </div>

            {/* Question Text */}
            <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
              {currentQuestion.text}
            </h3>

            {/* MCQ Options */}
            <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  variant={selectedOption === index ? "default" : "outline"}
                  className={`h-auto p-4 text-left justify-start transition-all ${
                    selectedOption === index 
                      ? 'bg-purple-600 text-white border-purple-600' 
                      : 'hover:bg-purple-50 hover:border-purple-300'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 font-medium ${
                    selectedOption === index 
                      ? 'bg-white text-purple-600' 
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed">{option}</span>
                </Button>
              ))}
            </div>

            {/* Optional Free Text Input */}
            {selectedOption !== null && (
              <div className="mt-6 max-w-lg mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional thoughts (optional):
                </label>
                <Textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Share any additional details that might help us understand your situation better..."
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{freeText.length}/500 characters</p>
              </div>
            )}

            {/* Submit Button */}
            {selectedOption !== null && (
              <div className="mt-6">
                <Button
                  onClick={() => handleAnswer(selectedOption, currentQuestion.options[selectedOption])}
                  className="bg-purple-600 hover:bg-purple-700 px-8 py-3"
                  size="lg"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
                </Button>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            <Shield className="w-4 h-4 inline mr-1" />
            Your responses are confidential and help us provide personalized recommendations.
            {currentQuestion.isCore && (
              <p className="mt-1 text-xs text-purple-600">
                This is a core screening question to assess your overall wellbeing.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartAssessment;