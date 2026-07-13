import React, { useState, useEffect } from 'react';
import { Upload, Camera, Send, AlertTriangle, Info, Clock, Users, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { medicineAnalysisService, MedicineAnalysis, testMedicineAPI } from '../lib/gemini';
import { api } from '../lib/api';

const MedicineAI: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [selectedBot, setSelectedBot] = useState('quick');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectedMedicine, setDetectedMedicine] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [medicineAnalysis, setMedicineAnalysis] = useState<MedicineAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bots = [
    { id: 'quick', name: t('medicine.bots.quick'), icon: '⚡', description: t('medicine.bots.quickDesc') },
    { id: 'detailed', name: t('medicine.bots.detailed'), icon: '📋', description: t('medicine.bots.detailedDesc') },
    { id: 'pill-id', name: t('medicine.bots.pill'), icon: '💊', description: t('medicine.bots.pillDesc') },
  ];


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPEG, PNG, etc.)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Please upload an image smaller than 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result as string;
        setUploadedImage(imageData);
        setIsProcessing(true);
        setError(null);

        try {
          // Use Gemini to analyze the medicine image
          console.log('=== IMAGE UPLOAD DEBUG START ===');
          console.log('Starting image analysis...');
          console.log('File name:', file.name);
          console.log('File size:', file.size);
          console.log('File type:', file.type);
          console.log('Image data length:', imageData.length);

          const analysis = await medicineAnalysisService.analyzeMedicineImage(imageData);
          console.log('Analysis result:', analysis);
          setDetectedMedicine(analysis.name);
          setMedicineAnalysis(analysis);

          // Save to backend
          if (user) {
            try {
              await api.saveMedicineAnalysis(user.id, {
                ...analysis,
                imageUrl: imageData // Note: This might be large, real apps usually upload to cloud storage first
              });
            } catch (saveError) {
              console.error("Failed to save analysis history", saveError);
            }
          }

          setIsProcessing(false);
          console.log('=== IMAGE UPLOAD DEBUG END ===');
        } catch (err) {
          console.error('=== IMAGE UPLOAD ERROR ===');
          console.error('Error analyzing image:', err);
          console.error('Error type:', typeof err);
          console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
          console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');

          // Provide more specific error messages
          let errorMessage = 'Failed to analyze image';
          if (err instanceof Error) {
            if (err.message.includes('API_KEY') || err.message.includes('quota')) {
              errorMessage = 'AI service is temporarily unavailable. Please try again later.';
            } else if (err.message.includes('Failed to analyze image')) {
              errorMessage = 'Unable to identify medicine from image. Please try a clearer image or use text input.';
            } else {
              errorMessage = err.message;
            }
          }

          setError(errorMessage);
          setDetectedMedicine('Unable to identify medicine');
          setMedicineAnalysis(null);
          setIsProcessing(false);
          console.log('=== IMAGE UPLOAD ERROR END ===');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDetection = () => {
    setShowResults(true);
    setUploadedImage(null);
  };

  const handleTextQuery = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setError(null);
    setShowResults(false);

    try {
      // Use Gemini to analyze the medicine text
      console.log('=== MEDICINE AI DEBUG START ===');
      console.log('Starting text analysis for:', inputText);
      console.log('Environment variables check:');
      console.log('VITE_GEMINI_API_KEY exists:', !!import.meta.env.VITE_GEMINI_API_KEY);
      console.log('VITE_GEMINI_FALLBACK_API_KEY exists:', !!import.meta.env.VITE_GEMINI_FALLBACK_API_KEY);

      const analysis = await medicineAnalysisService.analyzeMedicineText(inputText);
      console.log('Text analysis result:', analysis);
      console.log('Setting medicine analysis:', analysis);

      setDetectedMedicine(analysis.name);
      setMedicineAnalysis(analysis);

      // Save to backend
      if (user) {
        try {
          await api.saveMedicineAnalysis(user.id, {
            ...analysis,
            medicineName: inputText
          });
        } catch (saveError) {
          console.error("Failed to save analysis history", saveError);
        }
      }

      setShowResults(true);
      setInputText('');
      setIsProcessing(false);
      console.log('Text analysis completed successfully');
      console.log('=== MEDICINE AI DEBUG END ===');
    } catch (err) {
      console.error('=== MEDICINE AI ERROR ===');
      console.error('Error analyzing medicine text:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');

      // Provide more specific error messages
      let errorMessage = 'Failed to analyze medicine information';
      if (err instanceof Error) {
        if (err.message.includes('API_KEY') || err.message.includes('quota')) {
          errorMessage = 'AI service is temporarily unavailable. Please try again later.';
        } else if (err.message.includes('Failed to analyze medicine')) {
          errorMessage = 'Unable to identify this medicine. Please try a different name or check the spelling.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setDetectedMedicine(inputText);
      setMedicineAnalysis(null);
      setShowResults(true);
      setInputText('');
      setIsProcessing(false);
      console.log('=== MEDICINE AI ERROR END ===');
    }
  };

  const handleRetry = () => {
    setUploadedImage(null);
    setDetectedMedicine('');
    setShowResults(false);
    setIsProcessing(false);
    setMedicineAnalysis(null);
    setError(null);
  };

  // Check if API keys are configured
  const hasApiKeys = !!(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_FALLBACK_API_KEY);

  // API Key Warning Component
  const ApiKeyWarning = () => {
    if (hasApiKeys) return null;

    return (
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">AI Service Configuration Needed</h4>
            <p className="text-sm text-amber-800 mb-2">
              To enable full AI-powered medicine analysis, please configure your Gemini API key.
            </p>
            <div className="text-xs text-amber-700">
              <p className="mb-1">• Create a .env file in your project root</p>
              <p className="mb-1">• Add: VITE_GEMINI_API_KEY=your_api_key_here</p>
              <p>• Get your free API key from: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></p>
            </div>
            <p className="text-xs text-amber-600 mt-2">Note: Basic medicine database is still available for common medicines.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24 lg:pb-6">
      <div className="mb-8">
        <a href="/dashboard" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('medicine.title')}</h1>
        <p className="text-gray-600">{t('medicine.subtitle')}</p>
      </div>

      {/* API Key Warning */}
      <ApiKeyWarning />

      {!showResults && !uploadedImage && (
        <>
          {/* Bot Selection */}
          <div className="mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">{t('medicine.chooseAssistant')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bots.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => setSelectedBot(bot.id)}
                  className={`p-4 rounded-2xl border-2 transition-all ${selectedBot === bot.id
                    ? 'border-teal-300 bg-teal-50'
                    : 'border-gray-200 bg-white/70 hover:border-gray-300'
                    }`}
                >
                  <div className="text-3xl mb-2">{bot.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{bot.name}</h3>
                  <p className="text-sm text-gray-600">{bot.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Input Methods */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 overflow-hidden">
            <div className="p-8">
              <h3 className="font-semibold text-gray-900 mb-6">{t('medicine.subtitle')}</h3>

              {/* Text Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('medicine.typeName')}</label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTextQuery()}
                    placeholder={t('medicine.typePlaceholder')}
                    className="flex-1 p-4 border border-gray-200 rounded-2xl bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <button
                    onClick={handleTextQuery}
                    disabled={!inputText.trim() || isProcessing}
                    className="px-6 py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>

                {/* Debug Test Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      try {
                        console.log('Testing API directly...');
                        const result = await testMedicineAPI('paracetamol');
                        console.log('Direct API test result:', result);
                        setInputText('paracetamol');
                        setDetectedMedicine(result.name);
                        setMedicineAnalysis(result);
                        setShowResults(true);
                      } catch (error) {
                        console.error('Direct API test failed:', error);
                        setError('API test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                  >
                    Test API Direct
                  </button>
                  <button
                    onClick={() => {
                      // Create a test image for debugging
                      const canvas = document.createElement('canvas');
                      canvas.width = 200;
                      canvas.height = 200;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, 200, 200);
                        ctx.fillStyle = 'black';
                        ctx.font = '16px Arial';
                        ctx.fillText('Paracetamol 500mg', 20, 100);
                        ctx.fillText('Tablets', 20, 120);
                      }
                      const testImageData = canvas.toDataURL('image/jpeg');
                      setUploadedImage(testImageData);
                      setIsProcessing(true);
                      setError(null);

                      medicineAnalysisService.analyzeMedicineImage(testImageData)
                        .then(analysis => {
                          console.log('Test image analysis result:', analysis);
                          setDetectedMedicine(analysis.name);
                          setMedicineAnalysis(analysis);
                          setIsProcessing(false);
                        })
                        .catch(err => {
                          console.error('Test image analysis failed:', err);
                          setError('Test image analysis failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                          setDetectedMedicine('Unable to identify medicine');
                          setMedicineAnalysis(null);
                          setIsProcessing(false);
                        });
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                  >
                    Test Image Analysis
                  </button>
                  <button
                    onClick={() => {
                      setInputText('paracetamol');
                      handleTextQuery();
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                  >
                    Test Paracetamol
                  </button>
                  <button
                    onClick={() => {
                      setInputText('ibuprofen');
                      handleTextQuery();
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                  >
                    Test Ibuprofen
                  </button>
                  <button
                    onClick={() => {
                      setInputText('aspirin');
                      handleTextQuery();
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                  >
                    Test Aspirin
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t('medicine.or')}</span>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('medicine.uploadLabel')}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex space-x-4">
                        <Upload size={40} className="text-gray-400" />
                        <Camera size={40} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1">{t('medicine.uploadCtaTitle')}</p>
                        <p className="text-sm text-gray-600">{t('medicine.uploadCtaSub')}</p>
                        {!hasApiKeys && (
                          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1 inline-block mt-2">
                            ⚠️ Limited functionality - API key required for AI analysis
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Image Processing */}
      {uploadedImage && (
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-8">
            <h3 className="font-semibold text-gray-900 mb-6">Image Processing</h3>

            <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="lg:w-1/2">
                <img
                  src={uploadedImage}
                  alt="Uploaded medicine"
                  className="w-full h-64 object-cover rounded-2xl"
                />
              </div>

              <div className="lg:w-1/2">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                    <p className="text-gray-600">{t('medicine.processing')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                      <h4 className="font-medium text-teal-900 mb-2">{t('medicine.detected')}</h4>
                      <p className="text-lg font-bold text-teal-800">{detectedMedicine}</p>
                    </div>

                    <p className="text-gray-600">Is this detection correct?</p>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleConfirmDetection}
                        className="flex-1 bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition-colors font-medium"
                      >
                        {t('medicine.confirm')}
                      </button>
                      <button
                        onClick={handleRetry}
                        className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                      >
                        {t('medicine.retry')}
                      </button>
                    </div>

                    <div className="mt-4">
                      <input
                        type="text"
                        value={detectedMedicine}
                        onChange={(e) => setDetectedMedicine(e.target.value)}
                        placeholder={t('medicine.correctPlaceholder')}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-3xl">💊</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {medicineAnalysis?.name || detectedMedicine}
                </h3>
                <p className="text-gray-600">{t('medicine.info')}</p>
                {medicineAnalysis && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${medicineAnalysis.confidence >= 80
                      ? 'bg-green-100 text-green-800'
                      : medicineAnalysis.confidence >= 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      Confidence: {medicineAnalysis.confidence}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Debug info for text analysis */}
            {medicineAnalysis && !uploadedImage && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-sm text-green-800">
                  <strong>Text Analysis:</strong> {medicineAnalysis.name} (Confidence: {medicineAnalysis.confidence}%)
                </p>
              </div>
            )}


            {medicineAnalysis ? (
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* What it's used for */}
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <h4 className="flex items-center space-x-2 font-semibold text-blue-900 mb-3">
                      <Info size={20} />
                      <span>{t('medicine.usedFor')}</span>
                    </h4>
                    <ul className="space-y-2">
                      {medicineAnalysis.uses.map((use, index) => (
                        <li key={index} className="flex items-start space-x-2 text-blue-800">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{use}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dosage */}
                  <div className="bg-green-50 rounded-2xl p-6">
                    <h4 className="flex items-center space-x-2 font-semibold text-green-900 mb-3">
                      <Clock size={20} />
                      <span>{t('medicine.dosage')}</span>
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-green-800">{t('medicine.adults')}</p>
                        <p className="text-green-700">{medicineAnalysis.dosage.adult}</p>
                      </div>
                      <div>
                        <p className="font-medium text-green-800">{t('medicine.children')}</p>
                        <p className="text-green-700">{medicineAnalysis.dosage.pediatric}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Side Effects */}
                  <div className="bg-yellow-50 rounded-2xl p-6">
                    <h4 className="flex items-center space-x-2 font-semibold text-yellow-900 mb-3">
                      <AlertTriangle size={20} />
                      <span>{t('medicine.sideEffects')}</span>
                    </h4>
                    <ul className="space-y-2">
                      {medicineAnalysis.sideEffects.map((effect, index) => (
                        <li key={index} className="flex items-start space-x-2 text-yellow-800">
                          <span className="text-yellow-600 mt-1">•</span>
                          <span>{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Warnings */}
                  <div className="bg-red-50 rounded-2xl p-6">
                    <h4 className="flex items-center space-x-2 font-semibold text-red-900 mb-3">
                      <AlertTriangle size={20} />
                      <span>{t('medicine.warnings')}</span>
                    </h4>
                    <ul className="space-y-2">
                      {medicineAnalysis.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start space-x-2 text-red-800">
                          <span className="text-red-600 mt-1">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No analysis data available. Please try again.</p>
              </div>
            )}

            {/* Safety Verdict */}
            {medicineAnalysis && (
              <div className="mt-8 bg-teal-50 border-2 border-teal-200 rounded-2xl p-6">
                <h4 className="font-semibold text-teal-900 mb-2">{t('medicine.isItSafe')}</h4>
                <p className="text-teal-800 mb-4">{medicineAnalysis.safetyVerdict}</p>
                <p className="text-sm text-teal-700 font-medium">{t('medicine.followDoctor')}</p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-6 bg-gray-100 rounded-2xl p-6">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <AlertTriangle size={20} className="text-orange-500" />
                <span>{t('medicine.disclaimerTitle')}</span>
              </h4>
              <p className="text-gray-800 text-sm leading-relaxed">{t('medicine.disclaimer')}</p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleRetry}
                className="flex-1 bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition-colors font-medium"
              >
                {t('medicine.searchAnother')}
              </button>
              <button className="flex-1 bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition-colors font-medium">
                {t('medicine.contactPharmacist')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer at bottom */}
      {!showResults && (
        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-800">{t('medicine.medicalDisclaimer')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineAI;