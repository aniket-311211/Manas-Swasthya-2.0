import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Brain,
  Zap,
  Settings,
  Play,
} from "lucide-react";
import { aiAssessmentService } from "@/lib/ai-assessment";
import DynamicAssessment from "./DynamicAssessment";

const TestAIAssessment: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState({
    initialized: false,
    apiKeyAvailable: false,
    connectivity: false,
    activeSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    setIsLoading(true);

    try {
      const stats = aiAssessmentService.getServiceStats();
      const connectivity = await aiAssessmentService.testConnectivity();

      setServiceStatus({
        initialized: stats.initialized,
        apiKeyAvailable: stats.apiKeyAvailable,
        connectivity,
        activeSessions: stats.activeSessions,
      });
    } catch (error) {
      console.error("Error checking service status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTestAssessment = () => {
    setShowAssessment(true);
  };

  const handleAssessmentComplete = (result: any) => {
    setTestResults(result);
    setShowAssessment(false);
    console.log("Assessment completed:", result);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge
        className={`${
          status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {status ? "✓" : "✗"} {label}
      </Badge>
    );
  };

  if (showAssessment) {
    return (
      <DynamicAssessment
        onClose={() => setShowAssessment(false)}
        onComplete={handleAssessmentComplete}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-6 h-6 mr-2 text-purple-600" />
            AI Assessment System Test Dashboard
          </CardTitle>
          <p className="text-gray-600">
            Test and validate the dynamic AI-powered assessment system
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Service Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Service Initialized
                  </span>
                  {getStatusIcon(serviceStatus.initialized)}
                </div>
                {getStatusBadge(serviceStatus.initialized, "Ready")}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    API Key Available
                  </span>
                  {getStatusIcon(serviceStatus.apiKeyAvailable)}
                </div>
                {getStatusBadge(serviceStatus.apiKeyAvailable, "Configured")}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    AI Connectivity
                  </span>
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  ) : (
                    getStatusIcon(serviceStatus.connectivity)
                  )}
                </div>
                {getStatusBadge(serviceStatus.connectivity, "Connected")}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Active Sessions
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    {serviceStatus.activeSessions}
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  Sessions Running
                </Badge>
              </div>
            </div>
          </div>

          {/* System Capabilities */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              System Capabilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">
                  Dynamic Question Generation
                </h4>
                <p className="text-sm text-purple-700">
                  AI-powered questions that adapt based on user responses and
                  context
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Adaptive Scoring Engine
                </h4>
                <p className="text-sm text-blue-700">
                  Multi-dimensional analysis with confidence intervals and risk
                  assessment
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  Crisis Detection
                </h4>
                <p className="text-sm text-green-700">
                  Real-time identification of crisis indicators with immediate
                  intervention
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">
                  Personalized Insights
                </h4>
                <p className="text-sm text-orange-700">
                  AI-generated recommendations based on individual response
                  patterns
                </p>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Test Actions</h3>
            <div className="flex space-x-4">
              <Button
                onClick={startTestAssessment}
                disabled={
                  !serviceStatus.initialized || !serviceStatus.connectivity
                }
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start AI Assessment Test
              </Button>

              <Button
                onClick={checkServiceStatus}
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Refresh Status
              </Button>
            </div>
          </div>

          {/* Service Requirements */}
          {(!serviceStatus.initialized || !serviceStatus.connectivity) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-2">
                    Setup Required
                  </h4>
                  <div className="text-sm text-yellow-800 space-y-1">
                    {!serviceStatus.apiKeyAvailable && (
                      <p>• Add VITE_GEMINI_API_KEY to your .env file</p>
                    )}
                    {!serviceStatus.connectivity &&
                      serviceStatus.apiKeyAvailable && (
                        <p>
                          • Check your internet connection and API key validity
                        </p>
                      )}
                    <p>• Ensure all dependencies are installed (npm install)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Latest Test Results
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-green-700">
                      Overall Score
                    </span>
                    <div className="text-2xl font-bold text-green-900">
                      {testResults.stress ||
                        testResults.adaptiveScore?.overallScore ||
                        "N/A"}
                      /100
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">
                      Stress Level
                    </span>
                    <div className="text-lg font-semibold text-green-900">
                      {testResults.stressLevel || "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">
                      AI Insights
                    </span>
                    <div className="text-sm text-green-800">
                      {testResults.adaptiveScore?.personalizedInsights
                        ?.length || 0}{" "}
                      generated
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm text-green-700">
                    ✅ Assessment completed successfully with AI-powered
                    analysis
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAIAssessment;
