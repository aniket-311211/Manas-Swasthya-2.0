import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SmartAssessment from '@/components/SmartAssessment';
import TestAIAssessment from '@/components/TestAIAssessment';
import { AssessmentResult } from '@/types/assessment';

const TestAI: React.FC = () => {
  const [showSmartAssessment, setShowSmartAssessment] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const handleAssessmentComplete = (result: AssessmentResult) => {
    console.log('Assessment completed:', result);
    setAssessmentResult(result);
    setShowSmartAssessment(false);
  };

  if (showSmartAssessment) {
    return (
      <SmartAssessment 
        onClose={() => setShowSmartAssessment(false)}
        onComplete={handleAssessmentComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Assessment Testing</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Test the new Smart Assessment system with AI-powered dynamic questioning, 
            real-time scoring, and intelligent early completion.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Smart Assessment Test */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-bold text-purple-900">
                <Brain className="w-6 h-6 mr-2" />
                Smart Assessment Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Testing Features:</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• 3 core questions with intelligent branching</li>
                  <li>• Dynamic follow-up question generation</li>
                  <li>• Real-time 0-10 scoring (Stress, Anxiety, Sleep)</li>
                  <li>• Risk level assessment (Safe/Moderate/Critical)</li>
                  <li>• Early completion for healthy responses</li>
                  <li>• Crisis detection and support resources</li>
                  <li>• Skeleton loading effects during AI processing</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => setShowSmartAssessment(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                size="lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Smart Assessment Test
              </Button>
              
              {assessmentResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-green-900 mb-2">Last Test Result:</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Risk Level:</strong> {assessmentResult.riskLevel.toUpperCase()}</p>
                    <p><strong>Stress:</strong> {assessmentResult.scores.stress}/10</p>
                    <p><strong>Anxiety:</strong> {assessmentResult.scores.anxiety}/10</p>
                    <p><strong>Sleep:</strong> {assessmentResult.scores.sleep}/10</p>
                    <p><strong>Recommendations:</strong> {assessmentResult.recommendations.length} generated</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI System Test */}
          <div>
            <TestAIAssessment />
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How Smart Assessment Works:</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-1">Core Screening</h4>
              <p className="text-sm text-blue-700">Starts with 3 essential questions covering stress, anxiety, and sleep</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-purple-900 mb-1">AI Analysis</h4>
              <p className="text-sm text-purple-700">AI analyzes responses and decides whether follow-up is needed</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-green-900 mb-1">Smart Results</h4>
              <p className="text-sm text-green-700">Provides targeted recommendations and crisis support if needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAI;
