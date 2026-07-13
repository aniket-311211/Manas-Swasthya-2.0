import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Play, Brain, Heart, Moon, TrendingUp, TrendingDown } from 'lucide-react';
import { AssessmentResult } from '@/types/assessment';

interface AssessmentProps {
  onClose: () => void;
  onComplete: (result: AssessmentResult) => void;
  userId?: string;
}


const Assessment: React.FC<AssessmentProps> = ({ onClose, onComplete, userId }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Assessment questions - 20 comprehensive questions for students
  const questions = [
    // Academic Pressure (6 questions)
    {
      id: 1,
      category: "Academic Pressure",
      question: "How often do you feel overwhelmed by schoolwork or exams?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 2,
      category: "Academic Pressure", 
      question: "Do you worry about disappointing your parents/teachers if you score low?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 3,
      category: "Academic Pressure",
      question: "How often do you feel you don't have enough time to finish your assignments?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 4,
      category: "Academic Pressure",
      question: "Do you feel nervous before exams to the point it affects your performance?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 5,
      category: "Academic Pressure",
      question: "How often do you compare your grades with others and feel stressed?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 6,
      category: "Academic Pressure",
      question: "Do you ever feel like your studies are controlling your life?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    // Family & Relationships (5 questions)
    {
      id: 7,
      category: "Family & Relationships",
      question: "Do you feel supported by your family when you are stressed?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 8,
      category: "Family & Relationships",
      question: "How often do you feel pressure from family expectations (like career choice)?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 9,
      category: "Family & Relationships",
      question: "Do arguments or conflicts at home make you feel anxious?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 10,
      category: "Family & Relationships",
      question: "How often do you feel misunderstood by people close to you?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 11,
      category: "Family & Relationships",
      question: "Do you find it difficult to talk about your problems with family or friends?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    // Peer & Social Life (4 questions)
    {
      id: 12,
      category: "Peer & Social Life",
      question: "How often do you feel left out in school or social circles?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 13,
      category: "Peer & Social Life",
      question: "Do you face bullying or teasing that affects your mental health?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 14,
      category: "Peer & Social Life",
      question: "How would you rate your overall social confidence?",
      options: ["Very Low", "Low", "Moderate", "High", "Very High"],
      type: "rating"
    },
    {
      id: 15,
      category: "Peer & Social Life",
      question: "Do you worry about how others view you on social media or in person?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    // Future & Uncertainty (3 questions)
    {
      id: 16,
      category: "Future & Uncertainty",
      question: "How often do you worry about your future career or opportunities?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 17,
      category: "Future & Uncertainty",
      question: "How would you describe your level of optimism about the future?",
      options: ["Very Pessimistic", "Pessimistic", "Neutral", "Optimistic", "Very Optimistic"],
      type: "rating"
    },
    {
      id: 18,
      category: "Future & Uncertainty",
      question: "Do you feel uncertain about what direction your life is heading in?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    // Sleep & Well-being (2 questions)
    {
      id: 19,
      category: "Sleep & Well-being",
      question: "How often do you find it hard to sleep because of worries?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
      type: "frequency"
    },
    {
      id: 20,
      category: "Sleep & Well-being",
      question: "How would you rate your overall sleep quality?",
      options: ["Very Poor", "Poor", "Fair", "Good", "Excellent"],
      type: "rating"
    },
    // Coping Strategies (1 question)
    {
      id: 21,
      category: "Coping Strategies",
      question: "When you're stressed, what is your most common coping strategy?",
      options: ["Talk to friends/family", "Exercise or physical activity", "Listen to music/entertainment", "Use social media/apps", "Isolate myself"],
      type: "choice"
    }
  ];

  // Scoring algorithm based on the 21-question assessment
  const calculateScores = (answers: string[]) => {
    // Convert answers to numerical scores based on question type
    const scores = answers.map((answer, index) => {
      const question = questions[index];
      
      switch(question.type) {
        case "frequency":
          switch(answer) {
            case "Never": return 0;
            case "Rarely": return 1;
            case "Sometimes": return 2;
            case "Often": return 3;
            case "Always": return 4;
            default: return 0;
          }
        case "rating":
          // For rating questions, higher positive ratings get lower stress scores
          if (question.id === 14) { // Social confidence
            switch(answer) {
              case "Very Low": return 4;
              case "Low": return 3;
              case "Moderate": return 2;
              case "High": return 1;
              case "Very High": return 0;
              default: return 2;
            }
          } else if (question.id === 17) { // Optimism
            switch(answer) {
              case "Very Pessimistic": return 4;
              case "Pessimistic": return 3;
              case "Neutral": return 2;
              case "Optimistic": return 1;
              case "Very Optimistic": return 0;
              default: return 2;
            }
          } else if (question.id === 20) { // Sleep quality
            switch(answer) {
              case "Very Poor": return 4;
              case "Poor": return 3;
              case "Fair": return 2;
              case "Good": return 1;
              case "Excellent": return 0;
              default: return 2;
            }
          }
          break;
        case "choice":
          // For coping strategies, score based on healthiness of strategy
          if (question.id === 21) {
            switch(answer) {
              case "Talk to friends/family": return 0; // Healthy
              case "Exercise or physical activity": return 0; // Healthy
              case "Listen to music/entertainment": return 1; // Neutral
              case "Use social media/apps": return 2; // Potentially unhealthy
              case "Isolate myself": return 4; // Unhealthy
              default: return 2;
            }
          }
          break;
        default:
          return 0;
      }
      return 0;
    });

    // Calculate total stress score (sum of all answers)
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    
    // Calculate category-specific scores
    const academicPressure = scores.slice(0, 6).reduce((sum, score) => sum + score, 0); // Questions 1-6
    const familyRelationships = scores.slice(6, 11).reduce((sum, score) => sum + score, 0); // Questions 7-11
    const peerSocial = scores.slice(11, 15).reduce((sum, score) => sum + score, 0); // Questions 12-15
    const futureUncertainty = scores.slice(15, 18).reduce((sum, score) => sum + score, 0); // Questions 16-18
    const sleepWellbeing = scores.slice(18, 20).reduce((sum, score) => sum + score, 0); // Questions 19-20
    const copingStrategies = scores[20] || 0; // Question 21

    // Calculate stress level based on total score (0-84 range for 21 questions)
    let stressLevel = "Low";
    let stressScore = 0;
    if (totalScore >= 0 && totalScore <= 21) {
      stressLevel = "Low";
      stressScore = Math.round((totalScore / 21) * 25); // 0-25 range
    } else if (totalScore >= 22 && totalScore <= 42) {
      stressLevel = "Mild";
      stressScore = Math.round(25 + ((totalScore - 21) / 21) * 25); // 25-50 range
    } else if (totalScore >= 43 && totalScore <= 63) {
      stressLevel = "Moderate";
      stressScore = Math.round(50 + ((totalScore - 42) / 21) * 25); // 50-75 range
    } else if (totalScore >= 64 && totalScore <= 84) {
      stressLevel = "High";
      stressScore = Math.round(75 + ((totalScore - 63) / 21) * 25); // 75-100 range
    }

    // Calculate anxiety score (weighted combination of academic pressure, peer social, and future uncertainty)
    const anxietyTotal = academicPressure + peerSocial + futureUncertainty;
    const anxietyScore = Math.min(100, Math.round((anxietyTotal / 54) * 100)); // Max possible is 54 (13*4 + 1 question with rating)
    
    // Calculate sleep quality (based on sleep and wellbeing questions, inverted so higher is better)
    const sleepScore = Math.max(0, 100 - Math.round((sleepWellbeing / 8) * 100)); // Invert so higher score = better sleep
    
    // Generate personalized recommendations based on scores
    const activities = generateActivities(stressScore, anxietyScore, sleepScore);
    const games = generateGames(stressScore, anxietyScore, sleepScore);

    return {
      stress: stressScore,
      anxiety: anxietyScore,
      sleep: sleepScore,
      stressLevel,
      totalScore,
      activities,
      games,
      categoryScores: {
        academicPressure,
        familyRelationships,
        peerSocial,
        futureUncertainty,
        sleepWorries: sleepWellbeing,
        modernCoping: copingStrategies
      }
    };
  };

  // Generate personalized activities based on scores
  const generateActivities = (stress: number, anxiety: number, sleep: number) => {
    const activities = [];
    
    if (stress > 60) {
      activities.push({ name: "Deep Breathing Exercise", duration: "10 min" });
    }
    if (anxiety > 60) {
      activities.push({ name: "Progressive Muscle Relaxation", duration: "15 min" });
    }
    if (sleep > 60) {
      activities.push({ name: "Sleep Hygiene Routine", duration: "20 min" });
    }
    
    // Always include these basic activities
    activities.push({ name: "Mindful Walking", duration: "10 min" });
    activities.push({ name: "Gratitude Journaling", duration: "5 min" });
    
    // Fill up to 3 activities
    while (activities.length < 3) {
      const additionalActivities = [
        { name: "Meditation", duration: "10 min" },
        { name: "Yoga Stretches", duration: "15 min" },
        { name: "Nature Sounds Listening", duration: "10 min" }
      ];
      activities.push(additionalActivities[activities.length - 3]);
    }
    
    return activities.slice(0, 3);
  };

  // Generate personalized games based on scores
  const generateGames = (stress: number, anxiety: number, sleep: number) => {
    const games = [];
    
    if (stress > 60) {
      games.push({ name: "Stress Relief Coloring", duration: "15 min" });
    }
    if (anxiety > 60) {
      games.push({ name: "Anxiety Calming Puzzles", duration: "10 min" });
    }
    if (sleep > 60) {
      games.push({ name: "Sleep Story Meditation", duration: "20 min" });
    }
    
    // Always include these basic games
    games.push({ name: "Mindful Breathing Game", duration: "5 min" });
    games.push({ name: "Positive Affirmation Cards", duration: "10 min" });
    
    // Fill up to 3 games
    while (games.length < 3) {
      const additionalGames = [
        { name: "Guided Visualization", duration: "15 min" },
        { name: "Relaxation Music Therapy", duration: "10 min" },
        { name: "Mindfulness Bingo", duration: "10 min" }
      ];
      games.push(additionalGames[games.length - 3]);
    }
    
    return games.slice(0, 3);
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last question answered, calculate scores using algorithm
      const calculatedResult = calculateScores(newAnswers);
      setResult(calculatedResult);
      onComplete(calculatedResult);
      
      // Save to localStorage for persistence
      saveAssessmentToStorage(calculatedResult, newAnswers);
      
      onClose();
    }
  };

  // Save assessment to localStorage for persistence
  const saveAssessmentToStorage = (result: AssessmentResult, answers: string[]) => {
    try {
      const assessmentData = {
        result,
        answers,
        timestamp: new Date().toISOString(),
        userId: userId
      };
      localStorage.setItem('latestAssessment', JSON.stringify(assessmentData));
      console.log('Assessment saved to localStorage');
    } catch (error) {
      console.error('Failed to save assessment to localStorage:', error);
    }
  };

  const resetAssessment = () => {
    setCurrentStep(0);
    setAnswers([]);
    setResult(null);
    setIsLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score <= 30) return 'text-green-600';
    if (score <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score <= 30) return <TrendingDown className="w-4 h-4 text-green-600" />;
    if (score <= 60) return <TrendingUp className="w-4 h-4 text-yellow-600" />;
    return <TrendingUp className="w-4 h-4 text-red-600" />;
  };

  const progress = ((currentStep + 1) / questions.length) * 100;


  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Analyzing with Gemini...</h3>
            <p className="text-gray-600">
              Our AI is processing your answers to provide personalized recommendations
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Mental Health Assessment
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
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="mb-4">
              <span className="inline-block bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full mr-2">
                {questions[currentStep].category}
              </span>
              {questions[currentStep].type && (
                <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                  questions[currentStep].type === 'frequency' ? 'bg-blue-100 text-blue-700' :
                  questions[currentStep].type === 'rating' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {questions[currentStep].type === 'frequency' ? 'Frequency' :
                   questions[currentStep].type === 'rating' ? 'Rating' : 'Choice'}
                </span>
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {questions[currentStep].question}
            </h3>
            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
              {questions[currentStep].options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  variant="outline"
                  className={`h-12 text-base hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-all justify-start ${
                    questions[currentStep].type === 'choice' ? 'text-left p-4' : ''
                  }`}
                >
                  {questions[currentStep].type === 'frequency' && (
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 ${
                      index === 0 ? 'bg-green-100 text-green-600' :
                      index === 1 ? 'bg-blue-100 text-blue-600' :
                      index === 2 ? 'bg-yellow-100 text-yellow-600' :
                      index === 3 ? 'bg-orange-100 text-orange-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {index}
                    </span>
                  )}
                  {questions[currentStep].type === 'rating' && (
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3 ${
                      index === 0 ? 'bg-red-100 text-red-600' :
                      index === 1 ? 'bg-orange-100 text-orange-600' :
                      index === 2 ? 'bg-yellow-100 text-yellow-600' :
                      index === 3 ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                  {questions[currentStep].type === 'choice' && (
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm mr-3 font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                  )}
                  <span className="flex-1">{option}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>Your answers are completely confidential and will be used to provide personalized recommendations.</p>
            {questions[currentStep].type === 'frequency' && (
              <p className="mt-1 text-xs text-blue-600">Rate how often you experience this</p>
            )}
            {questions[currentStep].type === 'rating' && (
              <p className="mt-1 text-xs text-green-600">Rate your level or quality</p>
            )}
            {questions[currentStep].type === 'choice' && (
              <p className="mt-1 text-xs text-purple-600">Choose the option that best describes you</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assessment;

