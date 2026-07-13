import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, Mic, BarChart3, CheckCircle, Clock, ArrowLeft, Brain, TrendingUp, Moon } from 'lucide-react';
import { geminiService } from '@/lib/gemini';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useUser } from '@clerk/clerk-react';

interface DynamicQuestion {
  id: number;
  text: string;
  category: 'stress' | 'anxiety' | 'sleep' | 'general';
  followUp?: boolean;
  options?: string[];
}

interface AssessmentScores {
  stress: number;
  anxiety: number;
  sleep: number;
}

const ManasAI: React.FC = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm ManasAI, your supportive companion for mental wellness. I'll ask you a few questions to understand how you're feeling. Based on your responses, I'll provide personalized insights about your stress, anxiety, and sleep patterns. Ready to begin?",
      sender: 'ai',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<DynamicQuestion | null>(null);
  const [questionHistory, setQuestionHistory] = useState<Array<{ question: DynamicQuestion, answer: string }>>([]);
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScores | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial assessment questions
  const initialQuestions: DynamicQuestion[] = [
    {
      id: 1,
      text: "How would you describe your overall mood today?",
      category: 'general',
      options: [
        "Excellent - feeling great and positive",
        "Good - generally positive with minor concerns",
        "Okay - neutral, neither great nor terrible",
        "Poor - feeling down or negative"
      ]
    },
    {
      id: 2,
      text: "On a scale of 1-10, how stressed do you feel right now?",
      category: 'stress',
      options: [
        "1-3: Very low stress, feeling calm",
        "4-6: Moderate stress, manageable",
        "7-8: High stress, feeling overwhelmed",
        "9-10: Extreme stress, very difficult to cope"
      ]
    },
    {
      id: 3,
      text: "How has your sleep been over the past week?",
      category: 'sleep',
      options: [
        "Excellent - sleeping well and feeling rested",
        "Good - mostly good sleep with minor issues",
        "Fair - some sleep problems but manageable",
        "Poor - significant sleep difficulties"
      ]
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userResponse = inputValue.trim();
    const newMessage = {
      id: Date.now(),
      text: userResponse,
      sender: 'user' as const,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      if (showAssessment && currentQuestion) {
        // Handle assessment response
        await handleAssessmentResponse(userResponse);
      } else {
        // Handle regular chat
        const aiResponse = await geminiService.sendMessage(userResponse);
        setIsTyping(false);
        const aiMessage = {
          id: Date.now() + 1,
          text: aiResponse,
          sender: 'ai' as const,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsTyping(false);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or consider reaching out to your campus counseling center for immediate support.",
        sender: 'ai' as const,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const startAssessment = async () => {
    setShowAssessment(true);
    setQuestionCount(0);
    setQuestionHistory([]);
    setAskedQuestions(new Set());

    // Start with the first initial question
    const firstQuestion = initialQuestions[0];
    setCurrentQuestion(firstQuestion);
    setAskedQuestions(prev => new Set([...prev, firstQuestion.text]));

    const questionMessage = {
      id: Date.now(),
      text: `📋 **Assessment Question 1:**\n\n${firstQuestion.text}`,
      sender: 'ai' as const,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, questionMessage]);
  };

  const handleAssessmentResponse = async (response: string) => {
    if (!currentQuestion) return;

    // Add response to history
    const newHistory = [...questionHistory, { question: currentQuestion, answer: response }];
    setQuestionHistory(newHistory);
    setQuestionCount(prev => prev + 1);

    setIsTyping(true);
    setIsGeneratingQuestion(true);

    try {
      // Generate next question or complete assessment based on AI analysis
      const shouldContinue = await shouldAskFollowUp(newHistory);

      if (shouldContinue && questionCount < 20) { // Limit to max 20 questions
        const nextQuestion = await generateDynamicQuestion(newHistory, askedQuestions);
        setCurrentQuestion(nextQuestion);
        setAskedQuestions(prev => new Set([...prev, nextQuestion.text]));

        const questionMessage = {
          id: Date.now(),
          text: `📋 **Assessment Question ${questionCount + 2}:**\n\n${nextQuestion.text}`,
          sender: 'ai' as const,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, questionMessage]);
      } else {
        // Complete assessment and calculate scores
        await completeAssessment(newHistory);
      }
    } catch (error) {
      console.error('Error processing assessment:', error);
      await completeAssessment(newHistory);
    } finally {
      setIsTyping(false);
      setIsGeneratingQuestion(false);
    }
  };

  const shouldAskFollowUp = async (history: Array<{ question: DynamicQuestion, answer: string }>): Promise<boolean> => {
    if (history.length < 5) return true; // Always ask at least 5 questions

    // Analyze response patterns to determine if more questions are needed
    const responseAnalysis = analyzeResponsePatterns(history);

    // If user is giving very positive responses and we have good coverage, we can end early
    if (responseAnalysis.isVeryPositive && responseAnalysis.hasGoodCoverage && history.length >= 5) {
      return false;
    }

    // If user is giving concerning responses, we need more questions (up to 20)
    if (responseAnalysis.hasConcerningPatterns && history.length < 20) {
      return true;
    }

    // If responses are unclear or we need more coverage, continue
    if (responseAnalysis.needsMoreClarity && history.length < 15) {
      return true;
    }

    // Default: ask 8-12 questions for balanced assessment
    if (history.length < 12) {
      return true;
    }

    return false;
  };

  const analyzeResponsePatterns = (history: Array<{ question: DynamicQuestion, answer: string }>): {
    isVeryPositive: boolean;
    hasConcerningPatterns: boolean;
    needsMoreClarity: boolean;
    hasGoodCoverage: boolean;
  } => {
    let positiveCount = 0;
    let concerningCount = 0;
    let unclearCount = 0;
    const coverageAreas = new Set<string>();

    // Keywords for analysis
    const positiveKeywords = ['excellent', 'great', 'good', 'well', 'positive', 'satisfied', 'confident', 'calm', 'relaxed', 'energized', 'productive', 'manageable', 'healthy', 'supportive', 'strong'];
    const concerningKeywords = ['poor', 'bad', 'terrible', 'awful', 'struggling', 'difficult', 'overwhelmed', 'anxious', 'stressed', 'exhausted', 'drained', 'worried', 'nervous', 'panic', 'crisis', 'hopeless', 'helpless'];
    const unclearKeywords = ['okay', 'fine', 'alright', 'not sure', 'maybe', 'sometimes', 'depends', 'mixed', 'neutral'];

    history.forEach(({ answer, question }) => {
      const answerLower = answer.toLowerCase();

      // Count positive, concerning, and unclear responses
      if (positiveKeywords.some(keyword => answerLower.includes(keyword))) {
        positiveCount++;
      }
      if (concerningKeywords.some(keyword => answerLower.includes(keyword))) {
        concerningCount++;
      }
      if (unclearKeywords.some(keyword => answerLower.includes(keyword))) {
        unclearCount++;
      }

      // Track coverage areas
      coverageAreas.add(question.category);
    });

    const totalResponses = history.length;
    const positiveRatio = positiveCount / totalResponses;
    const concerningRatio = concerningCount / totalResponses;
    const unclearRatio = unclearCount / totalResponses;

    return {
      isVeryPositive: positiveRatio >= 0.7 && concerningRatio <= 0.2,
      hasConcerningPatterns: concerningRatio >= 0.4 || concerningCount >= 3,
      needsMoreClarity: unclearRatio >= 0.5 || unclearCount >= 3,
      hasGoodCoverage: coverageAreas.size >= 3 // At least 3 different categories covered
    };
  };

  const generateDynamicQuestion = async (history: Array<{ question: DynamicQuestion, answer: string }>, askedQuestionsSet: Set<string>): Promise<DynamicQuestion> => {
    const askedQuestionsList = Array.from(askedQuestionsSet);

    const prompt = `
    Based on the user's previous responses, generate a COMPLETELY NEW and UNIQUE mental health assessment question with 4 multiple choice options.
    
    Previous Q&A:
    ${history.map((h, i) => `${i + 1}. Q: ${h.question.text}\nA: ${h.answer}`).join('\n\n')}
    
    Already asked questions (DO NOT repeat these):
    ${askedQuestionsList.map((q, i) => `${i + 1}. ${q}`).join('\n')}
    
    Generate a NEW follow-up question that:
    - Is completely different from any previously asked questions
    - Explores NEW areas based on their specific responses
    - Dives deeper into concerning patterns or positive aspects mentioned
    - Is empathetic and non-judgmental
    - Is specific and actionable
    - Builds on their previous answers to understand their situation better
    
    Focus on:
    - Specific triggers or situations they mentioned
    - Coping strategies they use or need
    - Social support and relationships
    - Daily routines and habits
    - Physical symptoms or behaviors
    - Future concerns or goals
    - Academic/work pressures
    - Family dynamics
    - Social interactions
    - Self-care practices
    - Emotional regulation
    - Life transitions
    - Physical health impact
    - Technology and social media usage
    - Financial concerns
    - Career/academic goals
    
    Categories to consider: stress, anxiety, sleep, general wellbeing, relationships, work/school, health, coping strategies, family, social, academic, career, physical health, emotional regulation, life changes
    
    Respond with JSON format:
    {
      "question": "Your completely new question text here",
      "options": [
        "Option 1 - most positive/healthy response",
        "Option 2 - moderately positive response", 
        "Option 3 - moderately concerning response",
        "Option 4 - most concerning response"
      ]
    }
    
    Make sure the question is unique and options are clear, distinct, and cover a range from positive to concerning responses.
    `;

    try {
      const response = await geminiService.sendMessage(prompt);
      const parsed = JSON.parse(response.trim());

      // Double-check that the generated question is not a repeat
      if (askedQuestionsSet.has(parsed.question)) {
        throw new Error('Generated question is a repeat');
      }

      return {
        id: Date.now(),
        text: parsed.question,
        category: determineCategory(parsed.question, history),
        followUp: true,
        options: parsed.options
      };
    } catch {
      // Enhanced fallback questions with more variety
      const fallbackQuestions = [
        {
          id: Date.now(),
          text: "How do you typically start your day and what sets the tone for your mood?",
          category: 'general' as const,
          options: [
            "I have a positive morning routine that energizes me",
            "I usually feel okay but sometimes rushed or stressed",
            "My mornings are often chaotic and affect my mood",
            "I frequently wake up feeling anxious or overwhelmed"
          ]
        },
        {
          id: Date.now(),
          text: "When you face a challenging situation, what is your first instinct?",
          category: 'stress' as const,
          options: [
            "I approach it systematically and break it down into steps",
            "I seek advice from others or research solutions",
            "I feel overwhelmed but try to push through",
            "I tend to avoid or procrastinate on difficult tasks"
          ]
        },
        {
          id: Date.now(),
          text: "How would you describe your relationships with family and friends?",
          category: 'general' as const,
          options: [
            "Strong, supportive relationships that bring me joy",
            "Generally good with occasional conflicts or distance",
            "Mixed - some supportive, others stressful or complicated",
            "Challenging relationships that add to my stress"
          ]
        },
        {
          id: Date.now(),
          text: "What happens to your energy levels throughout the day?",
          category: 'general' as const,
          options: [
            "I maintain steady energy and feel productive",
            "I have natural ups and downs but manage well",
            "I often feel drained by afternoon or evening",
            "I frequently feel exhausted or low energy"
          ]
        },
        {
          id: Date.now(),
          text: "How do you handle unexpected changes or disruptions to your plans?",
          category: 'anxiety' as const,
          options: [
            "I adapt easily and see it as an opportunity",
            "I feel some stress but can adjust my approach",
            "I find it challenging and it affects my mood",
            "Unexpected changes cause significant anxiety or panic"
          ]
        },
        {
          id: Date.now(),
          text: "How do you typically unwind and relax after a busy day?",
          category: 'general' as const,
          options: [
            "I have consistent relaxation routines that work well",
            "I try different activities but sometimes struggle to relax",
            "I often feel too busy or stressed to properly unwind",
            "I rarely find time or methods that help me relax"
          ]
        },
        {
          id: Date.now(),
          text: "What role does social media and technology play in your daily stress?",
          category: 'stress' as const,
          options: [
            "Technology helps me stay connected and organized",
            "It's mostly positive but sometimes adds pressure",
            "It creates some stress and comparison issues",
            "It significantly contributes to my anxiety and stress"
          ]
        },
        {
          id: Date.now(),
          text: "How do you feel about your current academic or work situation?",
          category: 'general' as const,
          options: [
            "I'm satisfied and feel challenged in a good way",
            "It's generally okay with some manageable pressures",
            "I feel overwhelmed by demands and expectations",
            "I'm struggling with motivation and performance"
          ]
        },
        {
          id: Date.now(),
          text: "When you feel anxious or worried, what physical symptoms do you notice?",
          category: 'anxiety' as const,
          options: [
            "I rarely experience physical symptoms of anxiety",
            "I notice some tension or restlessness occasionally",
            "I often feel muscle tension, headaches, or stomach issues",
            "I experience frequent physical symptoms that affect my daily life"
          ]
        },
        {
          id: Date.now(),
          text: "How would you describe your relationship with your body and physical health?",
          category: 'general' as const,
          options: [
            "I feel good about my health and take care of myself",
            "I'm generally healthy but could improve some habits",
            "I have some health concerns that worry me",
            "I'm struggling with physical health issues that affect my mental state"
          ]
        },
        {
          id: Date.now(),
          text: "What gives you the most sense of purpose and fulfillment in life?",
          category: 'general' as const,
          options: [
            "I have clear goals and feel motivated by my purpose",
            "I find meaning in relationships and personal growth",
            "I'm searching for direction and sometimes feel lost",
            "I struggle to find meaning and feel disconnected from purpose"
          ]
        },
        {
          id: Date.now(),
          text: "How do you typically respond when someone close to you is going through a difficult time?",
          category: 'general' as const,
          options: [
            "I'm naturally supportive and good at helping others",
            "I try to help but sometimes feel overwhelmed by their problems",
            "I care but struggle to know how to support them effectively",
            "I often feel drained or stressed when others need support"
          ]
        }
      ];

      // Filter out questions that have already been asked
      const availableQuestions = fallbackQuestions.filter(q => !askedQuestionsSet.has(q.text));

      if (availableQuestions.length > 0) {
        return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      } else {
        // If all fallback questions have been used, generate a generic one
        return {
          id: Date.now(),
          text: "How would you rate your overall sense of well-being and life satisfaction?",
          category: 'general' as const,
          options: [
            "Excellent - I feel fulfilled and optimistic about life",
            "Good - I'm generally satisfied with how things are going",
            "Fair - I have some concerns but also positive aspects",
            "Poor - I'm struggling with multiple areas of life"
          ]
        };
      }
    }
  };

  const determineCategory = (questionText: string, history: Array<{ question: DynamicQuestion, answer: string }>): 'stress' | 'anxiety' | 'sleep' | 'general' => {
    const text = questionText.toLowerCase();
    if (text.includes('stress') || text.includes('pressure') || text.includes('overwhelm')) return 'stress';
    if (text.includes('anxious') || text.includes('worry') || text.includes('nervous')) return 'anxiety';
    if (text.includes('sleep') || text.includes('tired') || text.includes('rest')) return 'sleep';
    return 'general';
  };

  const completeAssessment = async (history: Array<{ question: DynamicQuestion, answer: string }>) => {
    setShowAssessment(false);
    setAssessmentComplete(true);

    try {
      // Calculate scores using AI analysis
      const scores = await calculateScoresWithAI(history);
      setAssessmentScores(scores);

      // Save results to localStorage for dashboard display
      const assessmentResult = {
        stress: scores.stress,
        anxiety: scores.anxiety,
        sleep: scores.sleep,
        stressLevel: getStressLevel(scores.stress),
        totalScore: Math.round((scores.stress + scores.anxiety + (100 - scores.sleep)) / 3),
        activities: [
          { name: "Meditation", duration: "10m" },
          { name: "Deep Breathing", duration: "5m" },
          { name: "Progressive Relaxation", duration: "15m" }
        ],
        games: [
          { name: "Mindfulness Game", duration: "10m" },
          { name: "", duration: "15m" }
        ],
        categoryScores: {
          academicPressure: Math.round(scores.stress * 0.8),
          familyRelationships: Math.round(scores.anxiety * 0.6),
          peerSocial: Math.round(scores.anxiety * 0.7),
          futureUncertainty: Math.round(scores.stress * 0.9),
          sleepWorries: Math.round((100 - scores.sleep) * 0.8),
          modernCoping: Math.round((100 - scores.stress) * 0.5)
        },
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('comprehensiveAssessmentResult', JSON.stringify(assessmentResult));

      // Save to backend
      try {
        if (user?.id) {
          await api.saveAssessment({
            userId: user.id,
            stress: scores.stress,
            anxiety: scores.anxiety,
            sleep: scores.sleep,
            answers: history.map(h => ({ q: h.question.text, a: h.answer })),
            activities: assessmentResult.activities,
            games: assessmentResult.games
          });
        }
      } catch (err) {
        console.error('Failed to save to backend:', err);
      }

      const resultsText = await generateResultsMessage(scores, history);
      const resultsMessage = {
        id: Date.now(),
        text: resultsText,
        sender: 'ai' as const,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, resultsMessage]);
    } catch (error) {
      console.error('Error calculating scores:', error);
      // Fallback to dynamic scoring
      const fallbackScores = calculateDynamicScores(history);
      setAssessmentScores(fallbackScores);

      // Save fallback results to localStorage
      const assessmentResult = {
        stress: fallbackScores.stress,
        anxiety: fallbackScores.anxiety,
        sleep: fallbackScores.sleep,
        stressLevel: getStressLevel(fallbackScores.stress),
        totalScore: Math.round((fallbackScores.stress + fallbackScores.anxiety + (100 - fallbackScores.sleep)) / 3),
        activities: [
          { name: "Meditation", duration: "10m" },
          { name: "Deep Breathing", duration: "5m" },
          { name: "Progressive Relaxation", duration: "15m" }
        ],
        games: [
          { name: "Mindfulness Game", duration: "10m" },
          { name: "color therapy ", duration: "15m" }
        ],
        categoryScores: {
          academicPressure: Math.round(fallbackScores.stress * 0.8),
          familyRelationships: Math.round(fallbackScores.anxiety * 0.6),
          peerSocial: Math.round(fallbackScores.anxiety * 0.7),
          futureUncertainty: Math.round(fallbackScores.stress * 0.9),
          sleepWorries: Math.round((100 - fallbackScores.sleep) * 0.8),
          modernCoping: Math.round((100 - fallbackScores.stress) * 0.5)
        },
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('comprehensiveAssessmentResult', JSON.stringify(assessmentResult));

      const resultsText = await generateResultsMessage(fallbackScores, history);
      const resultsMessage = {
        id: Date.now(),
        text: resultsText,
        sender: 'ai' as const,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, resultsMessage]);
    }
  };

  const getStressLevel = (stressScore: number): string => {
    if (stressScore <= 30) return 'Low';
    if (stressScore <= 60) return 'Moderate';
    return 'High';
  };

  const calculateScoresWithAI = async (history: Array<{ question: DynamicQuestion, answer: string }>): Promise<AssessmentScores> => {
    // First, use our dynamic algorithm
    const dynamicScores = calculateDynamicScores(history);

    // Then enhance with AI analysis
    const prompt = `
    Analyze these mental health assessment responses and provide numerical scores (0-100) for stress, anxiety, and sleep quality.
    
    User responses (${history.length} questions):
    ${history.map((h, i) => `${i + 1}. Q: ${h.question.text}\nA: ${h.answer}`).join('\n\n')}
    
    Current calculated scores:
    - Stress: ${dynamicScores.stress}/100
    - Anxiety: ${dynamicScores.anxiety}/100  
    - Sleep: ${dynamicScores.sleep}/100
    
    Provide refined scores as a JSON object with this exact format:
    {
      "stress": [0-100 number],
      "anxiety": [0-100 number], 
      "sleep": [0-100 number]
    }
    
    Consider:
    - Response patterns and consistency
    - Severity of concerns mentioned
    - Coping strategies mentioned
    - Support systems available
    - Physical symptoms described
    - Overall mental health trajectory
    
    For sleep: Higher score = better sleep quality
    For stress/anxiety: Higher score = more stress/anxiety
    
    Respond with ONLY the JSON object, no other text.
    `;

    try {
      const response = await geminiService.sendMessage(prompt);
      const aiScores = JSON.parse(response.trim());

      // Blend AI scores with dynamic scores (70% AI, 30% dynamic for accuracy)
      return {
        stress: Math.max(0, Math.min(100, Math.round(aiScores.stress * 0.7 + dynamicScores.stress * 0.3))),
        anxiety: Math.max(0, Math.min(100, Math.round(aiScores.anxiety * 0.7 + dynamicScores.anxiety * 0.3))),
        sleep: Math.max(0, Math.min(100, Math.round(aiScores.sleep * 0.7 + dynamicScores.sleep * 0.3)))
      };
    } catch {
      // Fallback to dynamic scoring
      return dynamicScores;
    }
  };

  const calculateDynamicScores = (history: Array<{ question: DynamicQuestion, answer: string }>): AssessmentScores => {
    let stressScore = 30; // Start with neutral
    let anxietyScore = 30;
    let sleepScore = 50; // Start with moderate sleep

    const weights = {
      stress: { high: 25, medium: 15, low: 5 },
      anxiety: { high: 25, medium: 15, low: 5 },
      sleep: { high: 20, medium: 10, low: 5 }
    };

    // Response pattern analysis
    const responseAnalysis = analyzeResponsePatterns(history);

    // Base adjustments based on response patterns
    if (responseAnalysis.hasConcerningPatterns) {
      stressScore += 20;
      anxietyScore += 20;
      sleepScore -= 15;
    } else if (responseAnalysis.isVeryPositive) {
      stressScore -= 10;
      anxietyScore -= 10;
      sleepScore += 15;
    }

    // Analyze each response for specific indicators
    history.forEach(({ answer, question }) => {
      const answerLower = answer.toLowerCase();
      const category = question.category;

      // Stress indicators
      if (category === 'stress' || answerLower.includes('stress') || answerLower.includes('pressure')) {
        if (answerLower.includes('overwhelmed') || answerLower.includes('extreme') || answerLower.includes('unmanageable')) {
          stressScore += weights.stress.high;
        } else if (answerLower.includes('moderate') || answerLower.includes('some') || answerLower.includes('manageable')) {
          stressScore += weights.stress.medium;
        } else if (answerLower.includes('low') || answerLower.includes('minimal') || answerLower.includes('calm')) {
          stressScore += weights.stress.low;
        }
      }

      // Anxiety indicators
      if (category === 'anxiety' || answerLower.includes('anxious') || answerLower.includes('worry')) {
        if (answerLower.includes('panic') || answerLower.includes('constant') || answerLower.includes('debilitating')) {
          anxietyScore += weights.anxiety.high;
        } else if (answerLower.includes('sometimes') || answerLower.includes('occasional') || answerLower.includes('manageable')) {
          anxietyScore += weights.anxiety.medium;
        } else if (answerLower.includes('rarely') || answerLower.includes('confident') || answerLower.includes('calm')) {
          anxietyScore += weights.anxiety.low;
        }
      }

      // Sleep indicators
      if (category === 'sleep' || answerLower.includes('sleep') || answerLower.includes('rest')) {
        if (answerLower.includes('excellent') || answerLower.includes('great') || answerLower.includes('well-rested')) {
          sleepScore += weights.sleep.high;
        } else if (answerLower.includes('good') || answerLower.includes('decent') || answerLower.includes('okay')) {
          sleepScore += weights.sleep.medium;
        } else if (answerLower.includes('poor') || answerLower.includes('insomnia') || answerLower.includes('tired')) {
          sleepScore += weights.sleep.low;
        }
      }

      // General mental health indicators
      if (answerLower.includes('crisis') || answerLower.includes('hopeless') || answerLower.includes('suicidal')) {
        stressScore += 30;
        anxietyScore += 30;
        sleepScore -= 20;
      }

      if (answerLower.includes('excellent') || answerLower.includes('thriving') || answerLower.includes('flourishing')) {
        stressScore -= 15;
        anxietyScore -= 15;
        sleepScore += 20;
      }
    });

    // Adjust based on number of questions answered (more questions = more accurate)
    const questionCount = history.length;
    const accuracyMultiplier = Math.min(1.2, 0.8 + (questionCount * 0.02)); // 0.8 to 1.2 based on question count

    return {
      stress: Math.max(0, Math.min(100, Math.round(stressScore * accuracyMultiplier))),
      anxiety: Math.max(0, Math.min(100, Math.round(anxietyScore * accuracyMultiplier))),
      sleep: Math.max(0, Math.min(100, Math.round(sleepScore * accuracyMultiplier)))
    };
  };

  const analyzeResponsesForScores = (history: Array<{ question: DynamicQuestion, answer: string }>): AssessmentScores => {
    let stressScore = 40;
    let anxietyScore = 40;
    let sleepScore = 60;

    history.forEach(({ answer }) => {
      const text = answer.toLowerCase();

      // Stress indicators
      if (text.includes('overwhelmed') || text.includes('pressure') || text.includes('stressed')) {
        stressScore += 15;
      }
      if (text.includes('calm') || text.includes('relaxed') || text.includes('manageable')) {
        stressScore -= 10;
      }

      // Anxiety indicators
      if (text.includes('anxious') || text.includes('worried') || text.includes('nervous')) {
        anxietyScore += 15;
      }
      if (text.includes('confident') || text.includes('peaceful') || text.includes('comfortable')) {
        anxietyScore -= 10;
      }

      // Sleep indicators
      if (text.includes('tired') || text.includes('insomnia') || text.includes('can\'t sleep')) {
        sleepScore -= 15;
      }
      if (text.includes('rested') || text.includes('good sleep') || text.includes('sleeping well')) {
        sleepScore += 10;
      }
    });

    return {
      stress: Math.max(0, Math.min(100, stressScore)),
      anxiety: Math.max(0, Math.min(100, anxietyScore)),
      sleep: Math.max(0, Math.min(100, sleepScore))
    };
  };

  const generateResultsMessage = async (scores: AssessmentScores, history: Array<{ question: DynamicQuestion, answer: string }>): Promise<string> => {
    const getLevel = (score: number, isReversed = false): string => {
      if (isReversed) {
        if (score >= 70) return 'Excellent';
        if (score >= 50) return 'Good';
        if (score >= 30) return 'Fair';
        return 'Needs Attention';
      } else {
        if (score <= 30) return 'Low';
        if (score <= 60) return 'Moderate';
        return 'High';
      }
    };

    const getEmoji = (score: number, isReversed = false): string => {
      if (isReversed) {
        if (score >= 70) return '🟢';
        if (score >= 50) return '🟡';
        if (score >= 30) return '🟠';
        return '🔴';
      } else {
        if (score <= 30) return '🟢';
        if (score <= 60) return '🟡';
        return '🔴';
      }
    };

    try {
      // Generate personalized insights using AI
      const insightsPrompt = `
      Based on these comprehensive assessment responses and scores, provide detailed personalized insights and recommendations.
      
      User Responses (${history.length} questions answered):
      ${history.map((h, i) => `${i + 1}. Q: ${h.question.text}\nA: ${h.answer}`).join('\n\n')}
      
      Calculated Scores:
      - Stress: ${scores.stress}/100 (${getLevel(scores.stress)})
      - Anxiety: ${scores.anxiety}/100 (${getLevel(scores.anxiety)})
      - Sleep: ${scores.sleep}/100 (${getLevel(scores.sleep, true)})
      
      Generate comprehensive analysis:
      1. 4-5 detailed personalized insights based on their specific responses and patterns
      2. 4-5 actionable recommendations tailored to their unique situation and challenges
      3. Specific coping strategies based on what they mentioned
      4. Areas of strength to build upon
      5. Encouraging and supportive tone with specific next steps
      
      Consider their:
      - Specific triggers and stressors mentioned
      - Coping strategies they use or need
      - Relationship dynamics and support systems
      - Daily routines and habits
      - Physical symptoms and health concerns
      - Academic/work pressures
      - Technology and social media impact
      - Life goals and purpose
      
      Format as JSON:
      {
        "insights": ["detailed insight 1", "detailed insight 2", "detailed insight 3", "detailed insight 4", "detailed insight 5"],
        "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3", "specific recommendation 4", "specific recommendation 5"],
        "strengths": ["strength 1", "strength 2", "strength 3"],
        "encouragement": "personalized encouraging message with specific next steps"
      }
      `;

      const aiResponse = await geminiService.sendMessage(insightsPrompt);
      const parsed = JSON.parse(aiResponse.trim());

      return `Thank you for completing the comprehensive assessment! Based on your ${history.length} detailed responses:

📊 **Your Mental Health Snapshot:**

${getEmoji(scores.stress)} **Stress Level:** ${scores.stress}/100 (${getLevel(scores.stress)})
${getEmoji(scores.anxiety)} **Anxiety Level:** ${scores.anxiety}/100 (${getLevel(scores.anxiety)})
${getEmoji(scores.sleep, true)} **Sleep Quality:** ${scores.sleep}/100 (${getLevel(scores.sleep, true)})

**🔍 Personalized Insights:**
${parsed.insights.map((insight: string) => `• ${insight}`).join('\n')}

**💪 Your Strengths:**
${parsed.strengths.map((strength: string) => `• ${strength}`).join('\n')}

**🎯 Recommended Actions:**
${parsed.recommendations.map((rec: string) => `• ${rec}`).join('\n')}

**💝 Encouragement & Next Steps:**
${parsed.encouragement}

Remember, this comprehensive assessment provides detailed insights to help you understand your current state and build upon your strengths. How do these results align with how you've been feeling?`;
    } catch (error) {
      console.error('Error generating dynamic insights:', error);

      // Fallback to dynamic but simpler insights
      const stressInsight = scores.stress > 60
        ? 'Your stress levels appear elevated. Consider stress-reduction techniques like deep breathing or meditation.'
        : scores.stress > 30
          ? 'Your stress levels are moderate. Regular relaxation practices could help maintain balance.'
          : 'Your stress levels are well-managed. Keep up the good work!';

      const anxietyInsight = scores.anxiety > 60
        ? 'Your anxiety scores suggest you might benefit from relaxation practices and professional support.'
        : scores.anxiety > 30
          ? 'Your anxiety levels are moderate. Mindfulness techniques could be helpful.'
          : 'Your anxiety levels appear to be in a healthy range.';

      const sleepInsight = scores.sleep < 50
        ? 'Your sleep quality could be improved with better sleep hygiene and a consistent bedtime routine.'
        : scores.sleep < 70
          ? 'Your sleep quality is decent but could be enhanced with some adjustments.'
          : 'You seem to be getting good rest. Maintain your healthy sleep habits!';

      return `Thank you for completing the comprehensive assessment! Based on your ${history.length} detailed responses:

📊 **Your Mental Health Snapshot:**

${getEmoji(scores.stress)} **Stress Level:** ${scores.stress}/100 (${getLevel(scores.stress)})
${getEmoji(scores.anxiety)} **Anxiety Level:** ${scores.anxiety}/100 (${getLevel(scores.anxiety)})
${getEmoji(scores.sleep, true)} **Sleep Quality:** ${scores.sleep}/100 (${getLevel(scores.sleep, true)})

**🔍 Personalized Insights:**
• ${stressInsight}
• ${anxietyInsight}
• ${sleepInsight}
• Your responses show patterns that we can work with to improve your overall wellbeing
• You've demonstrated self-awareness by taking this comprehensive assessment

**💪 Your Strengths:**
• You're proactive about understanding your mental health
• You're willing to engage in self-reflection and assessment
• You're taking steps toward better self-care and awareness

**🎯 Recommended Actions:**
• Try guided meditation and deep breathing exercises
• Connect with peer support or counseling services
• Consider professional consultation if scores are concerning
• Maintain a consistent sleep schedule and bedtime routine
• Build on your existing coping strategies and support systems

**💝 Encouragement & Next Steps:**
You've taken an important step by completing this comprehensive assessment. Your self-awareness and willingness to understand your mental health are strengths to build upon. Consider implementing one or two of the recommended actions this week, and remember that small, consistent changes often lead to significant improvements over time.

Remember, this comprehensive assessment provides detailed insights to help you understand your current state and build upon your strengths. How do these results align with how you've been feeling?`;
    }
  };

  if (showAssessment && currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
        <Link to="/dashboard" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <h2 className="font-semibold text-gray-900">Dynamic Mental Wellness Assessment</h2>
              </div>
              <div className="text-sm text-gray-600">
                Question {questionCount + 1}
              </div>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((questionCount + 1) / 20) * 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {isGeneratingQuestion ? '🤖 Analyzing your response and generating next question...' : 'Please select one of the options below'}
            </p>
          </div>

          <div className="p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {currentQuestion.text}
            </h3>

            <div className="mt-6">
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={async () => {
                        if (isGeneratingQuestion) return;

                        const userResponse = option;
                        const newMessage = {
                          id: Date.now(),
                          text: userResponse,
                          sender: 'user' as const,
                          timestamp: new Date().toISOString(),
                        };

                        setMessages(prev => [...prev, newMessage]);
                        setIsTyping(true);

                        try {
                          if (showAssessment && currentQuestion) {
                            // Handle assessment response
                            await handleAssessmentResponse(userResponse);
                          }
                        } catch (error) {
                          console.error('Error getting AI response:', error);
                          setIsTyping(false);
                          const errorMessage = {
                            id: Date.now() + 1,
                            text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or consider reaching out to your campus counseling center for immediate support.",
                            sender: 'ai' as const,
                            timestamp: new Date().toISOString(),
                          };
                          setMessages(prev => [...prev, errorMessage]);
                        }
                      }}
                      disabled={isGeneratingQuestion}
                      className="w-full p-4 text-left bg-white border-2 border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-teal-500 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <span className="text-gray-900 font-medium">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-teal-300 focus-within:bg-white transition-all">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isGeneratingQuestion && handleSendMessage()}
                    placeholder="Type your response here..."
                    className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
                    disabled={isGeneratingQuestion}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isGeneratingQuestion}
                    className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}

              {/* Score indicators if available */}
              {assessmentScores && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-xl text-center">
                    <TrendingUp className="w-6 h-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-red-800">Stress</p>
                    <p className="text-lg font-bold text-red-600">{assessmentScores.stress}/100</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl text-center">
                    <Brain className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-yellow-800">Anxiety</p>
                    <p className="text-lg font-bold text-yellow-600">{assessmentScores.anxiety}/100</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <Moon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-blue-800">Sleep</p>
                    <p className="text-lg font-bold text-blue-600">{assessmentScores.sleep}/100</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
      <Link to="/dashboard" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 overflow-hidden flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <h2 className="font-semibold text-gray-900">ManasAI</h2>
              {!assessmentComplete && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                  Assessment Available
                </span>
              )}
            </div>
            {!assessmentComplete && (
              <button
                onClick={startAssessment}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 transition-colors"
              >
                <BarChart3 size={16} />
                <span className="text-sm font-medium">Take Assessment</span>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Chats are confidential and stored securely. Your privacy is protected.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-2xl ${message.sender === 'user'
                  ? 'bg-teal-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-teal-100' : 'text-gray-500'
                  }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-teal-300 focus-within:bg-white transition-all">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Share what's on your mind..."
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
                />
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Upload size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Mic size={18} />
                </button>
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="p-3 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            If you're feeling unsafe, call emergency services immediately. Need urgent help? Let me know.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManasAI;