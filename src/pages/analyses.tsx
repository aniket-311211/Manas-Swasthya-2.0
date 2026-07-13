import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, Mic, BarChart3, CheckCircle, Clock } from 'lucide-react';

const ManasAI: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm ManasAI, your supportive companion for mental wellness. I'm here to listen and help you navigate your feelings. How are you doing today?",
      sender: 'ai',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<number[]>([]);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const assessmentQuestions = [
    "Over the last 2 weeks, how often have you felt little interest or pleasure in doing things?",
    "Over the last 2 weeks, how often have you felt down, depressed, or hopeless?",
    "How often have you had trouble falling asleep or sleeping too much?",
    "How often have you felt nervous, anxious or on edge?",
    "How often have you had trouble relaxing?",
    "How often have you found it hard to concentrate?",
    "How often have you felt irritable or angry?",
    "How often have you avoided social contact due to anxiety?",
    "How often have you felt overwhelmed by daily tasks?",
    "How often have you had negative thoughts about yourself?",
    "How often have you felt restless or fidgety?",
    "How often have you had difficulty making decisions?",
    "How often have you felt tired or had little energy?",
    "How often have you had changes in your appetite?",
    "How often have you felt worried about your health?",
    "How often have you had trouble controlling worry?",
    "How often have you felt afraid something awful might happen?",
    "How often have you avoided activities you used to enjoy?",
    "How often have you felt disconnected from others?",
    "How often have you had physical symptoms of stress (headaches, muscle tension)?"
  ];

  const answerOptions = [
    { value: 0, label: 'Never' },
    { value: 1, label: 'Several days' },
    { value: 2, label: 'More than half the days' },
    { value: 3, label: 'Nearly every day' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user' as const,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiResponse = {
        id: Date.now() + 1,
        text: generateAIResponse(inputValue),
        sender: 'ai' as const,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "I hear what you're sharing, and I want you to know that your feelings are completely valid. It takes courage to express yourself.",
      "Thank you for trusting me with this. What you're experiencing is more common than you might think, and you're not alone in this.",
      "That sounds really challenging. Can you tell me more about what's been on your mind lately?",
      "I appreciate you opening up about this. Have you noticed any patterns in when these feelings tend to arise?",
      "Your awareness of these feelings shows real strength. What coping strategies have you tried before?",
      "It's important that you're recognizing these patterns. How has this been affecting your daily routine?",
      "I'm glad you feel comfortable sharing this with me. What kind of support feels most helpful to you right now?",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)] + " If you're feeling unsafe, please call emergency services. Need urgent help? I can connect you with a professional right away.";
  };

  const startAssessment = () => {
    setShowAssessment(true);
    setCurrentQuestion(0);
    setAssessmentAnswers([]);
  };

  const handleAssessmentAnswer = (value: number) => {
    const newAnswers = [...assessmentAnswers, value];
    setAssessmentAnswers(newAnswers);

    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Assessment complete
      setShowAssessment(false);
      setAssessmentComplete(true);
      
      // Calculate scores (simplified)
      const totalScore = newAnswers.reduce((sum, score) => sum + score, 0);
      const stressScore = Math.min(100, Math.round((totalScore / 60) * 100));
      const anxietyScore = Math.min(100, Math.round((totalScore / 60) * 85));

      const assessmentResult = {
        id: Date.now(),
        text: `Thank you for completing the assessment. Based on your responses:

📊 **Assessment Results:**
• Stress Level: ${stressScore}/100
• Anxiety Level: ${anxietyScore}/100

${stressScore > 60 ? '💡 Your stress levels appear elevated. Consider incorporating daily relaxation techniques.' : '✅ Your stress levels are in a manageable range.'}

${anxietyScore > 60 ? '🤝 Your anxiety scores suggest you might benefit from professional support.' : '😌 Your anxiety levels appear to be in a healthy range.'}

**Recommended Next Steps:**
• Try our guided meditation exercises-  https://shorturl.at/Yiuyt
• Connect with a mentor for peer support- https://shorturl.at/wLRat
• Consider booking a consultation with a professional

Remember, this assessment is just a starting point. How are you feeling about these results?`,
        sender: 'ai' as const,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assessmentResult]);
    }
  };

  if (showAssessment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <h2 className="font-semibold text-gray-900">Mental Wellness Assessment</h2>
              </div>
              <div className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {assessmentQuestions.length}
              </div>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / assessmentQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {assessmentQuestions[currentQuestion]}
            </h3>
            
            <div className="space-y-3">
              {answerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAssessmentAnswer(option.value)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-teal-50 rounded-xl transition-colors border border-gray-200 hover:border-teal-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
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
                className={`max-w-[70%] p-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-teal-100' : 'text-gray-500'
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