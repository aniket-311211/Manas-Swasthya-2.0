import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Star, Clock, IndianRupee, Calendar, MessageSquare, ArrowLeft, Check, Users, Sparkles, Brain, Target, Zap } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { aiAdvisoryService, BookingRecommendation, AssessmentData } from '@/lib/aiAdvisoryService';

interface Consultant {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  location: string;
  image: string;
  bio: string;
  degrees: string;
  languages: string[];
  consultationTypes: string[];
  fee: number;
  availability: string[];
}

const Booking: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedState, setSelectedState] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState('slot');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [specialId, setSpecialId] = useState('');
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<BookingRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAIResponse, setLoadingAIResponse] = useState(false);
  const [highlightedDoctors, setHighlightedDoctors] = useState<number[]>([]);
  const [showingRecommendations, setShowingRecommendations] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  const states = [
    'Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Maharashtra', 
    'Odisha', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal'
  ];

  const consultants = useMemo(() => [
    {
      id: 1,
      name: 'Dr. Sarah Wilson',
      specialty: 'Clinical Psychology',
      rating: 4.9,
      reviews: 127,
      location: 'Delhi',
      image: '👩‍⚕️',
      bio: 'Specialized in anxiety disorders and cognitive behavioral therapy with 15+ years of experience.',
      degrees: 'PhD in Clinical Psychology, M.A. in Counseling',
      languages: ['English', 'Hindi'],
      consultationTypes: ['Online', 'In-Person'],
      fee: 2500,
      availability: ['2025-09-15', '2025-09-16', '2025-09-17']
    },
    {
      id: 2,
      name: 'Dr. Rajesh Kumar',
      specialty: 'Mental Health Mentor & Peer Support',
      rating: 4.8,
      reviews: 89,
      location: 'Mumbai',
      image: '👨‍⚕️',
      bio: 'Experienced mental health mentor specializing in peer support, stress management, and student wellness. Provides compassionate guidance for academic and personal challenges.',
      degrees: 'M.D. in Psychiatry, M.A. in Psychology, Certified Peer Support Specialist',
      languages: ['English', 'Hindi', 'Marathi'],
      consultationTypes: ['Online', 'In-Person', 'Group Sessions'],
      fee: 1800,
      availability: ['2025-09-14', '2025-09-15', '2025-09-16', '2025-09-17', '2025-09-18']
    },
    {
      id: 3,
      name: 'Dr. Priya Mehta',
      specialty: 'Counseling Psychology',
      rating: 4.9,
      reviews: 156,
      location: 'Delhi',
      image: '👩‍💼',
      bio: 'Specializes in trauma therapy and relationship counseling. Creates a safe, supportive environment.',
      degrees: 'MA in Counseling Psychology, Trauma Therapy Certified',
      languages: ['English', 'Hindi', 'Gujarati'],
      consultationTypes: ['Online', 'In-Person'],
      fee: 2200,
      availability: ['2025-09-16', '2025-09-17', '2025-09-20']
    },
    {
      id: 4,
      name: 'Dr. Ashish Mohanty',
      specialty: 'Psychiatrist',
      rating: 4.8,
      reviews: 203,
      location: 'Odisha',
      image: '👨‍⚕️',
      bio: 'Leading psychiatrist in Odisha with expertise in mood disorders, depression, and anxiety. Fluent in Odia.',
      degrees: 'MBBS, MD Psychiatry',
      languages: ['English', 'Hindi', 'Odia'],
      consultationTypes: ['Online', 'In-Person'],
      fee: 2000,
      availability: ['2025-09-15', '2025-09-16', '2025-09-18']
    },
    {
      id: 5,
      name: 'Dr. Kavitha Reddy',
      specialty: 'Child Psychology',
      rating: 4.9,
      reviews: 178,
      location: 'Andhra Pradesh',
      image: '👩‍⚕️',
      bio: 'Specialized in child and adolescent mental health, learning disabilities, and behavioral issues.',
      degrees: 'M.Phil in Clinical Psychology',
      languages: ['English', 'Hindi', 'Telugu'],
      consultationTypes: ['Online', 'In-Person'],
      fee: 1900,
      availability: ['2025-09-15', '2025-09-17', '2025-09-19']
    },
    {
      id: 6,
      name: 'Dr. Sunita Patel',
      specialty: 'Women\'s Mental Health',
      rating: 4.9,
      reviews: 214,
      location: 'Maharashtra',
      image: '👩‍⚕️',
      bio: 'Specialized in women\'s mental health, postpartum depression, and maternal psychology.',
      degrees: 'MD Psychiatry, Fellowship in Women\'s Mental Health',
      languages: ['English', 'Hindi', 'Marathi'],
      consultationTypes: ['Online', 'In-Person'],
      fee: 2200,
      availability: ['2025-09-14', '2025-09-16', '2025-09-18']
    },
    {
      id: 7,
      name: 'Dr. Subhashree Panda',
      specialty: 'Community Mental Health',
      rating: 4.7,
      reviews: 142,
      location: 'Odisha',
      image: '👩‍💼',
      bio: 'Community mental health advocate working on rural mental health awareness and accessibility.',
      degrees: 'M.Phil in Social Psychology',
      languages: ['English', 'Hindi', 'Odia'],
      consultationTypes: ['Online', 'Community Sessions'],
      fee: 1500,
      availability: ['2025-09-15', '2025-09-17', '2025-09-19']
    },
    {
      id: 8,
      name: 'Dr. Meera Iyer',
      specialty: 'Marriage Counselor',
      rating: 4.8,
      reviews: 167,
      location: 'Tamil Nadu',
      image: '👩‍💼',
      bio: 'Experienced marriage and relationship counselor helping couples navigate challenges.',
      degrees: 'M.Phil in Clinical Psychology, Certified Marriage Counselor',
      languages: ['English', 'Tamil', 'Hindi'],
      consultationTypes: ['Online', 'Couple Sessions'],
      fee: 2100,
      availability: ['2025-09-15', '2025-09-17', '2025-09-19']
    },
    {
      id: 9,
      name: 'Dr. Arjun Singh',
      specialty: 'Addiction Counselor',
      rating: 4.7,
      reviews: 134,
      location: 'Delhi',
      image: '👨‍⚕️',
      bio: 'Specialized in addiction recovery, substance abuse counseling, and behavioral interventions.',
      degrees: 'M.Phil in Clinical Psychology, Certified Addiction Counselor',
      languages: ['English', 'Hindi', 'Punjabi'],
      consultationTypes: ['Online', 'In-Person', 'Group Therapy'],
      fee: 2300,
      availability: ['2025-09-14', '2025-09-16', '2025-09-18']
    },
    {
      id: 10,
      name: 'Dr. Neha Sharma',
      specialty: 'Eating Disorder Specialist',
      rating: 4.9,
      reviews: 98,
      location: 'Mumbai',
      image: '👩‍⚕️',
      bio: 'Expert in treating eating disorders, body image issues, and nutritional psychology.',
      degrees: 'MD Psychiatry, Fellowship in Eating Disorders',
      languages: ['English', 'Hindi', 'Marathi'],
      consultationTypes: ['Online', 'In-Person'],
      fee: 2400,
      availability: ['2025-09-15', '2025-09-17', '2025-09-19']
    },
    {
      id: 11,
      name: 'Dr. Vikram Patel',
      specialty: 'Geriatric Psychiatrist',
      rating: 4.8,
      reviews: 156,
      location: 'Gujarat',
      image: '👨‍⚕️',
      bio: 'Specialized in mental health care for elderly patients, dementia, and age-related disorders.',
      degrees: 'MBBS, MD Psychiatry, Fellowship in Geriatric Psychiatry',
      languages: ['English', 'Hindi', 'Gujarati'],
      consultationTypes: ['Online', 'In-Person', 'Home Visits'],
      fee: 2200,
      availability: ['2025-09-14', '2025-09-16', '2025-09-18']
    },
    {
      id: 12,
      name: 'Dr. Ananya Gupta',
      specialty: 'LGBTQ+ Affirmative Therapist',
      rating: 4.9,
      reviews: 112,
      location: 'Karnataka',
      image: '👩‍💼',
      bio: 'Specialized in LGBTQ+ affirmative therapy, gender identity issues, and inclusive mental health care.',
      degrees: 'M.Phil in Clinical Psychology, LGBTQ+ Affirmative Therapy Certified',
      languages: ['English', 'Hindi', 'Kannada'],
      consultationTypes: ['Online', 'In-Person'],
      fee: 2000,
      availability: ['2025-09-15', '2025-09-17', '2025-09-19']
    },
    {
      id: 13,
      name: 'Dr. Rahul Mehta',
      specialty: 'Sports Psychology',
      rating: 4.7,
      reviews: 89,
      location: 'Maharashtra',
      image: '👨‍💼',
      bio: 'Sports psychologist helping athletes with performance anxiety, motivation, and mental resilience.',
      degrees: 'M.A. in Sports Psychology, Performance Enhancement Certified',
      languages: ['English', 'Hindi', 'Marathi'],
      consultationTypes: ['Online', 'In-Person', 'Team Sessions'],
      fee: 1800,
      availability: ['2025-09-14', '2025-09-16', '2025-09-18']
    },
    {
      id: 14,
      name: 'Dr. Pooja Reddy',
      specialty: 'Neuropsychologist',
      rating: 4.8,
      reviews: 143,
      location: 'Andhra Pradesh',
      image: '👩‍⚕️',
      bio: 'Specialized in brain-behavior relationships, cognitive assessment, and neurological rehabilitation.',
      degrees: 'PhD in Neuropsychology, Clinical Neuropsychology Certified',
      languages: ['English', 'Hindi', 'Telugu'],
      consultationTypes: ['Online', 'In-Person'],
      fee: 2600,
      availability: ['2025-09-15', '2025-09-17', '2025-09-19']
    },
    {
      id: 15,
      name: 'Dr. Amit Kumar',
      specialty: 'Occupational Therapist',
      rating: 4.6,
      reviews: 76,
      location: 'Uttar Pradesh',
      image: '👨‍⚕️',
      bio: 'Helping individuals with mental health conditions develop daily living skills and workplace adaptation.',
      degrees: 'Masters in Occupational Therapy, Mental Health Specialization',
      languages: ['English', 'Hindi'],
      consultationTypes: ['Online', 'In-Person', 'Workplace Visits'],
      fee: 1600,
      availability: ['2025-09-14', '2025-09-16', '2025-09-18']
    },
    {
      id: 16,
      name: 'Dr. Sanya Kapoor',
      specialty: 'Art Therapist',
      rating: 4.7,
      reviews: 92,
      location: 'Delhi',
      image: '👩‍🎨',
      bio: 'Using creative arts and expression as therapeutic tools for emotional healing and self-discovery.',
      degrees: 'M.A. in Art Therapy, Expressive Arts Therapy Certified',
      languages: ['English', 'Hindi'],
      consultationTypes: ['Online', 'In-Person', 'Group Sessions'],
      fee: 1900,
      availability: ['2025-09-15', '2025-09-17', '2025-09-19']
    }
  ], []);

  // Get user assessment data from localStorage
  const getUserAssessmentData = (): AssessmentData | null => {
    try {
      const savedData = localStorage.getItem('lastAssessmentData');
      return savedData ? JSON.parse(savedData) : null;
    } catch {
      return null;
    }
  };

  // Generate AI consultant recommendations
  const generateAIRecommendations = useCallback(async () => {
    const assessmentData = getUserAssessmentData();
    if (!assessmentData) {
      setAiRecommendations([]);
      return;
    }

    setLoadingRecommendations(true);
    try {
      const recommendations = await aiAdvisoryService.generateBookingRecommendations(
        assessmentData,
        consultants
      );
      setAiRecommendations(recommendations);
      if (recommendations.length > 0) {
        setShowAIRecommendations(true);
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [consultants]);

  // Handle AI assistant for booking guidance
  const handleAIAssistant = async () => {
    if (!aiQuestion.trim()) return;
    
    setLoadingAIResponse(true);
    
    try {
      // Instead of showing popup response, analyze query and highlight matching doctor cards
      const query = aiQuestion.toLowerCase();
      let matchingDoctorIds: number[] = [];
      
      // Match keywords to appropriate specialists
      if (query.includes('anxiety') || query.includes('panic') || query.includes('worry') || query.includes('stress')) {
        matchingDoctorIds = consultants
          .filter(c => 
            c.specialty.includes('Clinical Psychology') || 
            c.specialty.includes('Psychiatrist') ||
            c.name === 'Dr. Sarah Wilson' || 
            c.name === 'Dr. Ashish Mohanty'
          )
          .map(c => c.id);
      }
      else if (query.includes('depression') || query.includes('mood') || query.includes('sad')) {
        matchingDoctorIds = consultants
          .filter(c => 
            c.specialty.includes('Psychiatrist') || 
            c.name === 'Dr. Ashish Mohanty'
          )
          .map(c => c.id);
      }
      else if (query.includes('child') || query.includes('teenager') || query.includes('adolescent') || query.includes('kid')) {
        matchingDoctorIds = consultants
          .filter(c => 
            c.specialty.includes('Child Psychology') ||
            c.name === 'Dr. Kavitha Reddy'
          )
          .map(c => c.id);
      }
      else if (query.includes('women') || query.includes('postpartum') || query.includes('maternal') || query.includes('pregnancy')) {
        matchingDoctorIds = consultants
          .filter(c => 
            c.specialty.includes('Women\'s Mental Health') ||
            c.name === 'Dr. Sunita Patel'
          )
          .map(c => c.id);
      }
      else if (query.includes('marriage') || query.includes('relationship') || query.includes('couple') || query.includes('partner')) {
        matchingDoctorIds = consultants
          .filter(c => 
            c.specialty.includes('Marriage Counselor') || 
            c.specialty.includes('Counseling Psychology') ||
            c.name === 'Dr. Meera Iyer' || 
            c.name === 'Dr. Priya Mehta'
          )
          .map(c => c.id);
      }
      else if (query.includes('trauma') || query.includes('ptsd') || query.includes('abuse')) {
        matchingDoctorIds = consultants
          .filter(c => 
            c.specialty.includes('Counseling Psychology') ||
            c.name === 'Dr. Priya Mehta'
          )
          .map(c => c.id);
      }
      else if (query.includes('peer') || query.includes('mentor') || query.includes('support') || query.includes('guidance')) {
        matchingDoctorIds = consultants
          .filter(c => 
            c.specialty.includes('Mental Health Mentor') ||
            c.name === 'Dr. Rajesh Kumar'
          )
          .map(c => c.id);
      }
      else if (query.includes('community') || query.includes('rural') || query.includes('local')) {
        matchingDoctorIds = consultants
          .filter(c => 
            c.specialty.includes('Community Mental Health') ||
            c.name === 'Dr. Subhashree Panda'
          )
          .map(c => c.id);
      }
      else {
        // General recommendations - show top-rated doctors
        matchingDoctorIds = consultants
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3)
          .map(c => c.id);
      }
      
      // Highlight matching doctor cards with smooth transitions
      setHighlightedDoctors(matchingDoctorIds);
      
      // Show banner with delay to prevent flickering
      setTimeout(() => {
        setBannerVisible(true);
        setShowingRecommendations(true);
      }, 100);
      
      // Close the AI assistant modal
      setShowAIAssistant(false);
      
      // Clear highlighting after 15 seconds
      setTimeout(() => {
        setBannerVisible(false);
        setTimeout(() => {
          setHighlightedDoctors([]);
          setShowingRecommendations(false);
        }, 300); // Allow fade out animation
      }, 15000);
      
      // Clear the question
      setAiQuestion('');
      
    } catch (error) {
      console.error('Error analyzing query:', error);
    } finally {
      setLoadingAIResponse(false);
    }
  };

  // Handle URL parameter for Dr. Rajesh Kumar
  useEffect(() => {
    const mentorParam = searchParams.get('mentor');
    if (mentorParam === 'dr-rajesh-kumar') {
      const drRajesh = consultants.find(c => c.name === 'Dr. Rajesh Kumar');
      if (drRajesh) {
        setSelectedConsultant(drRajesh);
        setShowBookingModal(true);
      }
    }
  }, [searchParams, consultants]);

  // Auto-generate AI recommendations on component mount
  useEffect(() => {
    const assessmentData = getUserAssessmentData();
    if (assessmentData) {
      generateAIRecommendations();
    }
  }, [generateAIRecommendations]);

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const isSpecialIdValid = specialId === '2241019047';
  const getConsultationPrice = () => {
    return isSpecialIdValid ? 0 : selectedConsultant?.fee || 0;
  };

  const handleConsultantSelect = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
  };

  const handleBookingConfirm = () => {
    if (!selectedSlot || !selectedConsultant) {
      alert('Please select a time slot before confirming your booking.');
      return;
    }

    // Show processing state
    setIsProcessingBooking(true);
    
    // Simulate booking process
    setTimeout(() => {
      // Here you would typically:
      // 1. Send booking data to your backend
      // 2. Process payment (if not free)
      // 3. Send confirmation email
      // 4. Add to calendar
      
      console.log('Booking confirmed:', {
        consultant: selectedConsultant.name,
        time: selectedSlot,
        date: 'September 15, 2025',
        price: getConsultationPrice(),
        specialId: isSpecialIdValid ? specialId : null,
        isFree: isSpecialIdValid
      });

      // Show success state
      setIsProcessingBooking(false);
      setBookingComplete(true);

      // Reset form after 5 seconds
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingComplete(false);
        setBookingStep('slot');
        setSelectedSlot('');
        setSelectedConsultant(null);
        setSpecialId('');
        setIsProcessingBooking(false);
      }, 5000);
    }, 2000);
  };

  const filteredConsultants = selectedState 
    ? consultants.filter(c => c.location === selectedState)
    : consultants;

  if (selectedConsultant && !showBookingModal) {
    return (
      <div className="min-h-screen pt-20 pb-8 bg-gradient-calm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
        <button
          onClick={() => setSelectedConsultant(null)}
          className="flex items-center space-x-2 mb-6 text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft size={20} />
          <span>{t('booking.backToConsultants')}</span>
        </button>

        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:space-x-8">
              <div className="lg:w-2/3">
                <div className="flex items-start space-x-6 mb-8">
                  <div className="text-6xl">{selectedConsultant.image}</div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedConsultant.name}</h1>
                    <p className="text-lg text-teal-600 mb-2">{selectedConsultant.specialty}</p>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="font-semibold">{selectedConsultant.rating}</span>
                        <span className="text-gray-600">({selectedConsultant.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MapPin size={16} />
                        <span>{selectedConsultant.location}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{selectedConsultant.bio}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('booking.qualifications')}</h3>
                    <p className="text-gray-700">{selectedConsultant.degrees}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('booking.languages')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedConsultant.languages.map((lang: string) => (
                        <span key={lang} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('booking.consultationTypes')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedConsultant.consultationTypes.map((type: string) => (
                        <span key={type} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('booking.consultationFeeLabel')}</h3>
                    <div className="flex items-center space-x-1">
                      <IndianRupee size={18} className="text-gray-700" />
                      <span className="text-xl font-bold text-gray-900">{selectedConsultant.fee}</span>
                      <span className="text-gray-600">{t('booking.perSession')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3 mt-8 lg:mt-0">
                <div className="bg-gray-50/80 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('booking.bookConsultation')}</h3>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition-colors font-medium"
                    >
                      {t('booking.bookAppointment')}
                    </button>
                    
                    <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2">
                      <MessageSquare size={18} />
                      <span>{t('booking.askQuestion')}</span>
                    </button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      {t('booking.consultationFee')}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      {t('booking.privacyNote')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 bg-gradient-calm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
      {/* Header with Back to Dashboard and Join Us Button */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link to="/dashboard" className="inline-flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('booking.backToDashboard')}
          </Link>
          
          {/* Join Us Button */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeuybOszANh7YX1YJbusdjuAh3lJ-gzGX1VeaZjLGd8lbEjtg/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Users className="w-4 h-4 mr-2" />
            Join Us
          </a>
        </div>
      </div>
      
      {/* AI Analysis Result Banner - No Flickering */}
      {bannerVisible && highlightedDoctors.length > 0 && (
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-4 mb-8 border border-green-200 transition-all duration-500 ease-in-out transform shadow-lg hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-xl shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">✨ AI Analysis Complete</h3>
                <p className="text-sm text-gray-600">
                  Found {highlightedDoctors.length} matching specialist{highlightedDoctors.length > 1 ? 's' : ''} for your needs
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setBannerVisible(false);
                setTimeout(() => {
                  setHighlightedDoctors([]);
                  setShowingRecommendations(false);
                }, 300);
              }}
              className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors px-3 py-1 rounded-lg hover:bg-green-50"
            >
              Clear
            </button>
          </div>
          <p className="text-sm text-green-700 mt-2 font-medium">
            ✨ The highlighted doctor cards below are recommended based on your query
          </p>
        </div>
      )}

      {/* AI Recommendations Section */}
      {aiRecommendations.length > 0 && showAIRecommendations && (
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-8 border border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Consultant Recommendations</h3>
                <p className="text-sm text-gray-600">Based on your mental health assessment</p>
              </div>
            </div>
            <button
              onClick={() => setShowAIRecommendations(false)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Hide
            </button>
          </div>
          
          <div className="space-y-3">
            {aiRecommendations.map((rec) => {
              const consultant = consultants.find(c => c.id === rec.consultantId);
              if (!consultant) return null;
              
              return (
                <div key={rec.consultantId} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{consultant.image}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{consultant.name}</h4>
                        <p className="text-sm text-blue-600">{consultant.specialty}</p>
                        <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            rec.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                            rec.urgency === 'recommended' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rec.urgency}
                          </span>
                          <span className="text-xs text-gray-500">{rec.confidence}% match</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedConsultant(consultant)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedConsultant(consultant);
                          setShowBookingModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Assistant and Recommendations Buttons */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAIAssistant(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)' }}
          >
            <Brain size={18} className="text-white" />
            <span className="font-medium text-white">Dr. Recommendation Assistant</span>
          </button>
          
          {getUserAssessmentData() && (
            <button
              onClick={generateAIRecommendations}
              disabled={loadingRecommendations}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              <Target size={18} />
              <span className="font-medium">
                {loadingRecommendations ? 'Analyzing...' : 'Get AI Recommendations'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* State Selection */}
      <div className="mb-8">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('booking.selectState')}
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">{t('booking.chooseState')}</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Consultants Grid */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredConsultants.map((consultant) => {
          const isHighlighted = highlightedDoctors.includes(consultant.id);
          return (
            <div 
              key={consultant.id} 
              className={`bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border overflow-hidden transition-all duration-500 ease-in-out ${
                isHighlighted 
                  ? 'border-green-400 shadow-green-200 shadow-2xl ring-4 ring-green-200/50 bg-gradient-to-br from-green-50 to-blue-50 transform scale-[1.02]' 
                  : 'border-white/50 hover:scale-105'
              }`}
            >
              {isHighlighted && (
                <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white text-center py-2 animate-bounce">
                  <span className="text-sm font-medium flex items-center justify-center">
                    ✨ AI Recommended for Your Needs ✨
                  </span>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-4xl">{consultant.image}</div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${
                      isHighlighted ? 'text-green-900' : 'text-gray-900'
                    }`}>{consultant.name}</h3>
                    <p className={`text-sm mb-1 ${
                      isHighlighted ? 'text-green-600 font-medium' : 'text-teal-600'
                    }`}>{consultant.specialty}</p>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{consultant.rating}</span>
                        <span className="text-xs text-gray-600">({consultant.reviews})</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MapPin size={12} />
                        <span className="text-xs">{consultant.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{consultant.bio}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <IndianRupee size={16} className="text-gray-700" />
                    <span className="font-bold text-gray-900">{consultant.fee}</span>
                    <span className="text-xs text-gray-600">{t('booking.perSession')}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <Clock size={14} />
                    <span className="text-xs">{t('booking.availableToday')}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleConsultantSelect(consultant)}
                    className={`flex-1 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isHighlighted 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('booking.preview')}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedConsultant(consultant);
                      setShowBookingModal(true);
                    }}
                    className={`flex-1 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isHighlighted
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  >
                    {t('booking.book')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedConsultant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {isProcessingBooking ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Your Booking</h3>
                <p className="text-gray-600 mb-4">
                  Please wait while we confirm your appointment with {selectedConsultant.name}...
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>✓ Validating time slot</p>
                  <p>✓ {isSpecialIdValid ? 'Applying special discount' : 'Processing payment'}</p>
                  <p>⏳ Sending confirmation...</p>
                </div>
              </div>
            ) : bookingComplete ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('booking.bookingConfirmed')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('booking.bookingSuccess', { name: selectedConsultant.name, time: selectedSlot, date: 'September 15, 2025' })}
                </p>
                
                {/* Booking Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">Booking Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Consultant:</span>
                      <span className="font-medium">{selectedConsultant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date & Time:</span>
                      <span className="font-medium">September 15, 2025 at {selectedSlot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="font-medium">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fee:</span>
                      <div className="flex items-center space-x-2">
                        {isSpecialIdValid && (
                          <span className="text-sm line-through text-gray-400">₹{selectedConsultant.fee}</span>
                        )}
                        <span className={`font-bold ${isSpecialIdValid ? "text-green-600" : ""}`}>
                          ₹{getConsultationPrice()}
                        </span>
                      </div>
                    </div>
                    {isSpecialIdValid && (
                      <div className="flex justify-between">
                        <span>Special ID:</span>
                        <span className="font-medium text-green-600">{specialId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  {t('booking.calendarInvite')}
                </p>
                
                {isSpecialIdValid && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    🎉 Congratulations! Your consultation is FREE with the special ID!
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{t('booking.bookConsultation')}</h3>
                    <button
                      onClick={() => {
                        setShowBookingModal(false);
                        setSpecialId('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    with {selectedConsultant.name}
                  </p>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">{t('booking.availableSlots')}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 text-sm border rounded-lg transition-all ${
                            selectedSlot === slot
                              ? 'border-teal-300 bg-teal-50 text-teal-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special ID
                    </label>
                    <input
                      type="text"
                      value={specialId}
                      onChange={(e) => setSpecialId(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Enter special ID for discount"
                    />
                    {isSpecialIdValid && (
                      <p className="text-green-600 text-sm mt-2 flex items-center">
                        <Check className="w-4 h-4 mr-1" />
                        Special discount applied! Consultation is now FREE.
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('booking.reasonForConsultation')}
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      placeholder={t('booking.reasonPlaceholder')}
                    ></textarea>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h5 className="font-medium text-gray-900 mb-2">{t('booking.bookingSummary')}</h5>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>{t('booking.date')}</span>
                        <span>September 15, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('booking.time')}</span>
                        <span>{selectedSlot || t('booking.selectSlot')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('booking.mode')}</span>
                        <span>{t('booking.online')}</span>
                      </div>
                      <div className="flex justify-between font-medium text-gray-900">
                        <span>{t('booking.fee')}</span>
                        <div className="flex items-center space-x-2">
                          {isSpecialIdValid && (
                            <span className="text-lg line-through text-gray-400">₹{selectedConsultant.fee}</span>
                          )}
                          <span className={isSpecialIdValid ? "text-green-600 font-bold" : ""}>
                            ₹{getConsultationPrice()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleBookingConfirm}
                    disabled={!selectedSlot || isProcessingBooking}
                    className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    {isProcessingBooking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Booking...</span>
                      </>
                    ) : (
                      <span>{t('booking.confirmBooking')}</span>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 mt-3 text-center">
                    {t('booking.paymentRedirect')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 rounded-xl">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dr. Recommendation Assistant</h3>
                    <p className="text-sm text-gray-600">Find the right specialist from our available doctors</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIAssistant(false);
                    setAiQuestion('');
                    setAiResponse('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of mental health support are you looking for?
                </label>
                <textarea
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="e.g., I need help with anxiety, depression, relationship issues, child counseling, etc."
                />
              </div>

              <button
                onClick={handleAIAssistant}
                disabled={!aiQuestion.trim() || loadingAIResponse}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {loadingAIResponse ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare size={18} />
                    <span>Find My Doctor</span>
                  </>
                )}
              </button>

              {aiResponse && (
                <div className="bg-gray-50 rounded-xl p-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Doctor Recommendations:</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Booking;