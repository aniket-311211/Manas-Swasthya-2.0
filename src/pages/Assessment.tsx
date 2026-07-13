import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Zap, Target, Clock } from 'lucide-react';
import SmartAssessment from '@/components/SmartAssessment';
import TakeAssessment from '@/components/TakeAssessment';
import { AssessmentResult } from '@/types/assessment';

const Assessment: React.FC = () => {
  const [showSmartAssessment, setShowSmartAssessment] = useState(false);
  const [showClassicAssessment, setShowClassicAssessment] = useState(false);
  const navigate = useNavigate();

  const handleSmartAssessmentComplete = (result: AssessmentResult) => {
    console.log('Smart Assessment completed:', result);
    setShowSmartAssessment(false);
    // You can save results or navigate somewhere
  };

  const handleClassicAssessmentComplete = (result: AssessmentResult) => {
    console.log('Classic Assessment completed:', result);
    setShowClassicAssessment(false);
  };

  if (showSmartAssessment) {
    return (
      <SmartAssessment 
        onClose={() => setShowSmartAssessment(false)}
        onComplete={handleSmartAssessmentComplete}
      />
    );
  }

  if (showClassicAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-20">
        <TakeAssessment />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mental Health Assessment</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Take our comprehensive assessment to get personalized insights and recommendations 
            for your mental wellness journey.
          </p>
        </div>

        <div className="flex justify-center">
          {/* Comprehensive Assessment Card */}
          <Card className="border-2 border-teal-200 hover:border-teal-300 transition-colors max-w-md w-full">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-teal-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-teal-900 mb-2">
                Comprehensive Assessment
              </CardTitle>
              <div className="flex items-center justify-center space-x-2 text-sm text-teal-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Structured & Complete</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="text-sm">21 comprehensive questions covering all areas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Multiple question types (frequency, rating, choice)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm">Complete assessment for detailed analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <span className="text-sm">Detailed category-based scoring</span>
                </div>
              </div>
              
              <div className="bg-teal-50 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-teal-900 mb-2">Features:</h4>
                <ul className="text-sm text-teal-700 space-y-1">
                  <li>• Academic pressure assessment</li>
                  <li>• Family & relationship evaluation</li>
                  <li>• Peer & social life analysis</li>
                  <li>• Future & uncertainty concerns</li>
                  <li>• Sleep & wellbeing tracking</li>
                  <li>• Coping strategies assessment</li>
                </ul>
              </div>

              <Button 
                onClick={() => setShowClassicAssessment(true)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 text-lg font-medium"
                size="lg"
              >
                Start Comprehensive Assessment
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            This assessment is confidential and provides personalized recommendations 
            based on your responses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
