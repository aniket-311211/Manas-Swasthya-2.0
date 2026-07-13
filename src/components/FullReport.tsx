import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Brain, Heart, Moon, TrendingUp, TrendingDown, BookOpen, Users, Globe, Zap } from 'lucide-react';
import { AssessmentResult } from '@/types/assessment';

interface FullReportProps {
  result: AssessmentResult;
  onClose: () => void;
}

const FullReport: React.FC<FullReportProps> = ({ result, onClose }) => {
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

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Mild': return 'bg-yellow-100 text-yellow-800';
      case 'Moderate': return 'bg-orange-100 text-orange-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateReportText = () => {
    const reportText = `
MENTAL HEALTH ASSESSMENT REPORT
Generated on: ${new Date().toLocaleDateString()}

OVERALL ASSESSMENT
==================
Total Stress Score: ${result.totalScore}/80
Stress Level: ${result.stressLevel}
Overall Stress: ${result.stress}/100
Anxiety Level: ${result.anxiety}/100
Sleep Quality: ${100 - result.sleep}/100

CATEGORY BREAKDOWN
==================
📚 Academic Pressure: ${result.categoryScores.academicPressure}/24
👨‍👩‍👧 Family & Relationships: ${result.categoryScores.familyRelationships}/20
🤝 Peer & Social Life: ${result.categoryScores.peerSocial}/16
🌍 Future & Uncertainty: ${result.categoryScores.futureUncertainty}/12
😴 Sleep & Well-being: ${result.categoryScores.sleepWorries}/4
🎭 Modern Coping: ${result.categoryScores.modernCoping}/4

RECOMMENDED ACTIVITIES
======================
${result.activities.map((activity, index) => `${index + 1}. ${activity.name} (${activity.duration})`).join('\n')}

RECOMMENDED MINDFULNESS GAMES
=============================
${result.games.map((game, index) => `${index + 1}. ${game.name} (${game.duration})`).join('\n')}

INTERPRETATION
==============
${result.stressLevel === 'Low' ? 'You are experiencing low levels of stress. Keep up your current coping strategies!' : 
  result.stressLevel === 'Mild' ? 'You are experiencing mild stress. Consider incorporating more relaxation techniques.' :
  result.stressLevel === 'Moderate' ? 'You are experiencing moderate stress. It may be helpful to seek additional support and implement stress management strategies.' :
  'You are experiencing high levels of stress. Please consider reaching out to a mental health professional for support.'}

This report can be shared with counselors, therapists, or AI chatbots for further discussion and personalized recommendations.
    `.trim();

    return reportText;
  };

  const copyReportToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      // You could add a toast notification here
      alert('Report copied to clipboard! You can now paste it in an AI chatbot for further discussion.');
    } catch (err) {
      console.error('Failed to copy report:', err);
      alert('Failed to copy report. Please try again.');
    }
  };

  const downloadReport = () => {
    const reportText = generateReportText();
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mental-health-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Mental Health Assessment Report
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
          <p className="text-gray-600">
            Comprehensive analysis of your mental health assessment
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Assessment */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-blue-600" />
              Overall Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Total Score</span>
                  <Badge className={getStressLevelColor(result.stressLevel)}>
                    {result.stressLevel}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.totalScore}/80
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Stress Level</span>
                  {getScoreIcon(result.stress)}
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(result.stress)}`}>
                  {result.stress}/100
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Anxiety Level</span>
                  {getScoreIcon(result.anxiety)}
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(result.anxiety)}`}>
                  {result.anxiety}/100
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Sleep Quality</span>
                  {getScoreIcon(100 - result.sleep)}
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(100 - result.sleep)}`}>
                  {100 - result.sleep}/100
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-green-600" />
              Category Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">📚</span>
                  <span className="font-medium text-gray-700">Academic Pressure</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {result.categoryScores.academicPressure}/24
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">👨‍👩‍👧</span>
                  <span className="font-medium text-gray-700">Family & Relationships</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {result.categoryScores.familyRelationships}/20
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">🤝</span>
                  <span className="font-medium text-gray-700">Peer & Social Life</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {result.categoryScores.peerSocial}/16
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">🌍</span>
                  <span className="font-medium text-gray-700">Future & Uncertainty</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {result.categoryScores.futureUncertainty}/12
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">😴</span>
                  <span className="font-medium text-gray-700">Sleep & Well-being</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {result.categoryScores.sleepWorries}/4
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">🎭</span>
                  <span className="font-medium text-gray-700">Modern Coping</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {result.categoryScores.modernCoping}/4
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-purple-600" />
                Recommended Activities
              </h3>
              <div className="space-y-3">
                {result.activities.map((activity, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{activity.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {activity.duration}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-orange-600" />
                Recommended Games
              </h3>
              <div className="space-y-3">
                {result.games.map((game, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{game.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {game.duration}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Resources & Support */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-indigo-600" />
              Additional Resources & Support
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Guided Meditation Exercises</h4>
                    <p className="text-sm text-gray-600 mb-2">Try our guided meditation exercises to help reduce stress and improve mental well-being.</p>
                    <a 
                      href="https://shorturl.at/Yiuyt" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium text-sm"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      Access Meditation Resources
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Connect with a Mentor</h4>
                    <p className="text-sm text-gray-600 mb-2">Get peer support and guidance from experienced mentors who understand your challenges.</p>
                    <a 
                      href="/booking?mentor=dr-rajesh-kumar" 
                      className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium text-sm"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Book with Dr. Rajesh Kumar
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Professional Consultation</h4>
                    <p className="text-sm text-gray-600 mb-2">Consider booking a consultation with a mental health professional for personalized support.</p>
                    <a 
                      href="/booking" 
                      className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium text-sm"
                    >
                      <Brain className="w-4 h-4 mr-1" />
                      Book Professional Consultation
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-4">
            <Button 
              onClick={copyReportToClipboard}
              className="px-6 bg-teal-600 hover:bg-teal-700 flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Report</span>
            </Button>
            <Button 
              onClick={downloadReport}
              variant="outline"
              className="px-6 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              Close
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Copy this report and paste it into an AI chatbot (like ChatGPT) for personalized mental health advice and further discussion about your results.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FullReport;
