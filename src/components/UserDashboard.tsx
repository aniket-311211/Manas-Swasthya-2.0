import React, { useState, useEffect } from "react";
import {
  Edit,
  TrendingUp,
  CheckCircle2,
  Play,
  Calendar,
  MessageCircle,
  BookOpen,
  Users,
  Award,
  Zap,
  Brain,
  Download,
  Smartphone,
  Camera,
  X,
  Save,
  MapPin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Assessment from "./Assessment";
import FullReport from "./FullReport";
import { AssessmentResult } from "@/types/assessment";
import { getInstallPrompt, isPWAInstalled } from "@/utils/pwa";
import MoodTracker from "./mood/MoodTracker";

interface DashboardProps {
  onTabChange?: (tab: string) => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const UserDashboard: React.FC<DashboardProps> = ({
  onTabChange = () => {},
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([
    {
      id: 1,
      name: "Meditation",
      duration: "10m",
      completed: false,
      icon: "🧘‍♂️",
    },
    { id: 2, name: "Journaling", duration: "5m", completed: false, icon: "📝" },
    { id: 3, name: "Walk", duration: "20m", completed: false, icon: "🚶‍♂️" },
  ]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null);
  const [comprehensiveAssessmentResult, setComprehensiveAssessmentResult] = 
    useState<AssessmentResult | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [showAssessmentSuccess, setShowAssessmentSuccess] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Profile editing state - Local storage for user freedom
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [editingUniversity, setEditingUniversity] = useState("");
  const [editingRegistrationNumber, setEditingRegistrationNumber] =
    useState("");
  const [editingLocation, setEditingLocation] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Functions to handle comprehensive assessment results
  const loadComprehensiveAssessmentResult = () => {
    const saved = localStorage.getItem('comprehensiveAssessmentResult');
    if (saved) {
      try {
        const result = JSON.parse(saved);
        setComprehensiveAssessmentResult(result);
      } catch (error) {
        console.error('Error loading comprehensive assessment result:', error);
      }
    }
  };

  const saveComprehensiveAssessmentResult = (result: AssessmentResult) => {
    localStorage.setItem('comprehensiveAssessmentResult', JSON.stringify(result));
    setComprehensiveAssessmentResult(result);
  };
  
  // Local profile data state (independent of Clerk)
  const [localProfileData, setLocalProfileData] = useState({
    name: "",
    university: "",
    registrationNumber: "",
    location: "",
    profileImage: ""
  });

  // PWA Install functionality
  useEffect(() => {
    const checkPWAStatus = async () => {
      const installed = isPWAInstalled();
      setIsInstalled(installed);

      if (!installed) {
        const prompt = await getInstallPrompt();
        if (prompt) {
          setInstallPrompt(prompt);
          setShowInstallButton(true);
        }
      }
    };

    checkPWAStatus();
  }, []);

  // Load local profile data from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setLocalProfileData(parsedProfile);
      setEditingName(parsedProfile.name || user?.fullName || "");
      setEditingUniversity(parsedProfile.university || "");
      setEditingRegistrationNumber(parsedProfile.registrationNumber || "");
      setEditingLocation(parsedProfile.location || "");
    } else {
      // Initialize with Clerk data if available
      const initialData = {
        name: user?.fullName || "",
        university: (user?.publicMetadata?.university as string) || "",
        registrationNumber: (user?.publicMetadata?.registrationNumber as string) || "",
        location: (user?.publicMetadata?.location as string) || "",
        profileImage: user?.imageUrl || ""
      };
      setLocalProfileData(initialData);
      setEditingName(initialData.name);
      setEditingUniversity(initialData.university);
      setEditingRegistrationNumber(initialData.registrationNumber);
      setEditingLocation(initialData.location);
    }

    // Load comprehensive assessment results
    loadComprehensiveAssessmentResult();
  }, [user]);

  // Update editing fields when user data loads (keep original logic as fallback)
  useEffect(() => {
    if (!localStorage.getItem('userProfile')) {
      if (user?.fullName) {
        setEditingName(user.fullName);
      }
      if (user?.publicMetadata?.university) {
        setEditingUniversity(user.publicMetadata.university as string);
      }
      if (user?.publicMetadata?.registrationNumber) {
        setEditingRegistrationNumber(
          user.publicMetadata.registrationNumber as string
        );
      }
      if (user?.publicMetadata?.location) {
        setEditingLocation(user.publicMetadata.location as string);
      }
    }
  }, [user?.fullName, user?.publicMetadata]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        setShowInstallButton(false);
        setIsInstalled(true);
      } else {
        console.log("User dismissed the install prompt");
      }
    } catch (error) {
      console.error("Error showing install prompt:", error);
    }
  };

  // Enhanced location detection function with improved accuracy
  const detectLocation = async () => {
    setIsDetectingLocation(true);

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
      }

      // Get user's position with enhanced accuracy settings
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true, // Use GPS if available
            timeout: 30000, // Increased timeout for better accuracy
            maximumAge: 0, // Don't use cached location, get fresh coordinates
          });
        }
      );

      const { latitude, longitude } = position.coords;
      console.log(`GPS Coordinates: ${latitude}, ${longitude}`);

      // Use multiple geocoding services for better reliability
      let locationString = "";
      
      try {
        // Try OpenStreetMap Nominatim first (more detailed)
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
        );

        if (nominatimResponse.ok) {
          const data = await nominatimResponse.json();
          locationString = formatLocationFromNominatim(data);
        }
      } catch (nominatimError) {
        console.warn("Nominatim failed, trying fallback");
      }

      // Fallback to BigDataCloud if Nominatim fails
      if (!locationString) {
        try {
          const bigDataResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );

          if (bigDataResponse.ok) {
            const data = await bigDataResponse.json();
            locationString = formatLocationFromBigData(data);
          }
        } catch (bigDataError) {
          console.warn("BigDataCloud also failed");
        }
      }

      if (locationString) {
        setEditingLocation(locationString);
        console.log(`Location detected: ${locationString}`);
      } else {
        alert("Could not determine your location. Please enter manually.");
      }
    } catch (error) {
      console.error("Error detecting location:", error);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert(
              "Location access denied. Please enable location permissions in your browser settings and try again."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            alert(
              "Location information is unavailable. Please check your GPS/location services and try again."
            );
            break;
          case error.TIMEOUT:
            alert(
              "Location request timed out. Please ensure you have a good GPS signal and try again."
            );
            break;
          default:
            alert("An unknown error occurred while detecting location.");
            break;
        }
      } else {
        alert("Failed to detect location. Please enter manually.");
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Format location from Nominatim API response
  const formatLocationFromNominatim = (data: { address: { [key: string]: string } }): string => {
    const address = data.address;
    
    // Extract location components in order of preference
    const city = address.city || address.town || address.village || address.municipality ||  address.county || "";
    const state = address.state || address.province || address.region || "";
    const country = address.country || "";
    
    // Build location string: City, State, Country
    const locationParts: string[] = [];
    
    if (city) locationParts.push(city);
    if (state && state !== city) locationParts.push(state);
    if (country) locationParts.push(country);
    
    return locationParts.join(", ");
  };

  // Format location from BigDataCloud API response (fallback)
  const formatLocationFromBigData = (data: { [key: string]: string }): string => {
    const city = data.city || data.locality || "";
    const state = data.principalSubdivision || "";
    const country = data.countryName || "";
    
    // Build location string: City, State, Country
    const locationParts: string[] = [];
    
    if (city) locationParts.push(city);
    if (state && state !== city) locationParts.push(state);
    if (country) locationParts.push(country);
    
    return locationParts.join(", ");
  };

  // Profile editing functions
  const handleEditProfile = () => {
    // Use local data first, fallback to Clerk data
    setEditingName(localProfileData.name || user?.fullName || "");
    setEditingUniversity(localProfileData.university || (user?.publicMetadata?.university as string) || "");
    setEditingRegistrationNumber(localProfileData.registrationNumber || (user?.publicMetadata?.registrationNumber as string) || "");
    setEditingLocation(localProfileData.location || (user?.publicMetadata?.location as string) || "");
    setProfileImagePreview(null);
    setProfileImageFile(null);
    setShowEditProfile(true);
  };

      const handleProfileImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please select a valid image file (PNG, JPG, etc.)",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Image file size must be less than 5MB",
        });
        return;
      }

      setProfileImageFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!editingName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name cannot be empty. Please enter your name.",
      });
      return;
    }

    setIsUpdatingProfile(true);

    try {
      console.log("Saving profile data locally...");
      
      // Handle profile image
      let profileImageUrl = localProfileData.profileImage;
      if (profileImageFile) {
        // Convert image to base64 for local storage
        const reader = new FileReader();
        profileImageUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(profileImageFile);
        });
        console.log("Profile image converted to base64");
      }

      // Save all profile data to localStorage
      const updatedProfile = {
        name: editingName.trim(),
        university: editingUniversity.trim(),
        registrationNumber: editingRegistrationNumber.trim(),
        location: editingLocation.trim(),
        profileImage: profileImageUrl
      };

      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      setLocalProfileData(updatedProfile);
      console.log("Profile data saved successfully:", updatedProfile);

      // Optional: Try to update Clerk data for name only (non-blocking)
      if (user && editingName.trim() && editingName !== user.fullName) {
        try {
          console.log("Attempting to update Clerk name...");
          await user.update({
            firstName: editingName.split(" ")[0] || "",
            lastName: editingName.split(" ").slice(1).join(" ") || "",
          });
          console.log("Clerk name updated successfully");
        } catch (clerkError) {
          console.warn("Clerk name update failed (non-critical):", clerkError);
          // Continue anyway - local data is preserved
        }
      }

      setShowEditProfile(false);
      setProfileImageFile(null);
      setProfileImagePreview(null);

      // Profile updated silently - no popup notifications
      
      console.log("Profile update completed successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      
      toast({
        variant: "destructive",
        title: "Profile Update Failed",
        description: "Failed to save profile data. Please try again.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const getUserDisplayName = () => {
    // Use local profile data first, then extract name from Gmail, then fallback to Clerk data
    if (localProfileData.name) {
      return localProfileData.name;
    }
    
    // Extract name from Gmail address first (prioritize email over Clerk fullName)
    if (user?.emailAddresses[0]?.emailAddress) {
      const emailLocal = user.emailAddresses[0].emailAddress.split("@")[0];
      // Convert email local part to a readable name (e.g., john.doe -> John Doe)
      const nameFromEmail = emailLocal
        .split(/[._-]+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
      return nameFromEmail;
    }
    
    // Fallback to other Clerk data only if email is not available
    return (
      user?.fullName ||
      user?.firstName ||
      "User"
    );
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const completeActivity = (id: number) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === id ? { ...activity, completed: true } : activity
      )
    );

    const activity = activities.find((a) => a.id === id);
    if (activity) {
      setEarnedBadge(`${activity.name} Completed! 🎖`);
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setEarnedBadge("");
      }, 3000);
    }
  };

  // Use comprehensive assessment results if available, otherwise use default values
  const kpis = comprehensiveAssessmentResult
    ? [
        {
          label: "Stress",
          score: comprehensiveAssessmentResult.stress,
          trend: comprehensiveAssessmentResult.stress <= 50 ? "down" : "up",
          color:
            comprehensiveAssessmentResult.stress <= 30
              ? "green"
              : comprehensiveAssessmentResult.stress <= 60
              ? "yellow"
              : "red",
        },
        {
          label: "Anxiety",
          score: comprehensiveAssessmentResult.anxiety,
          trend: comprehensiveAssessmentResult.anxiety <= 50 ? "down" : "up",
          color:
            comprehensiveAssessmentResult.anxiety <= 30
              ? "green"
              : comprehensiveAssessmentResult.anxiety <= 60
              ? "yellow"
              : "red",
        },
        {
          label: "Sleep Quality",
          score: comprehensiveAssessmentResult.sleep,
          trend: comprehensiveAssessmentResult.sleep >= 50 ? "up" : "down",
          color:
            comprehensiveAssessmentResult.sleep >= 70
              ? "green"
              : comprehensiveAssessmentResult.sleep >= 40
              ? "yellow"
              : "red",
        },
      ]
    : [
        { label: "Stress", score: 38, trend: "down", color: "green" },
        { label: "Anxiety", score: 45, trend: "down", color: "blue" },
        { label: "Sleep Quality", score: 72, trend: "up", color: "purple" },
      ];

  // Use comprehensive assessment results for activities and games if available
  const recommendedActivities = comprehensiveAssessmentResult ? comprehensiveAssessmentResult.activities : [
    { name: 'Meditation', duration: '10m' },
    { name: 'Journaling', duration: '5m' },
    { name: 'Walk', duration: '20m' },
  ];

  const recommendedGames = comprehensiveAssessmentResult ? comprehensiveAssessmentResult.games : [
    { name: 'Mindful Breathing', duration: '5 min', externalLink: 'https://keepingmychesthealthy.bdct.nhs.uk/resource/breathing-activites/' },
    { name: 'Color Therapy', duration: '10 min', externalLink: 'https://poki.com/en/g/color-therapy' },
    { name: 'Nature Sounds', duration: '15 min', externalLink: 'https://pixabay.com/music/search/nature/' },
  ];

  const games = recommendedGames.map((game, index) => {
    const gameObj = {
      id: index + 1,
      title: game.name,
      duration: game.duration,
      image: index === 0 ? '🫁' : index === 1 ? '🎨' : '🌿',
      video: false,
      videoSrc: null,
      thumbnail: null,
      externalLink: game.externalLink || null
    };
    console.log('Created game:', gameObj.title, 'with externalLink:', gameObj.externalLink);
    return gameObj;
  });

  // Add extra Puzzle Game card
  games.push({
    id: games.length + 1,
    title: 'Puzzle Game',
    duration: '10 min',
    image: '🧩',
    video: false,
    videoSrc: null,
    thumbnail: null,
    externalLink: 'https://www.jigsawplanet.com/'
  });

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-auto"
      style={{
        backgroundImage:
          "url(https://images.pexels.com/photos/14822817/pexels-photo-14822817.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pt-32 pb-24 lg:pb-10 font-sans min-h-screen relative">
        {/* Main content container */}
        <div className="relative z-10">
          {/* Confetti effect */}
          {showConfetti && (
            <div
              role="alert"
              aria-live="assertive"
              className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl animate-bounce max-w-sm text-center">
                <Award
                  className="w-14 h-14 text-orange-400 mx-auto mb-3"
                  aria-hidden="true"
                />
                <p className="font-semibold text-gray-900 text-lg select-none">
                  {earnedBadge}
                </p>
              </div>
            </div>
          )}

          {/* Assessment Success Message */}
          {showAssessmentSuccess && (
            <div
              role="alert"
              aria-live="assertive"
              className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl animate-bounce max-w-sm text-center">
                <Brain
                  className="w-14 h-14 text-teal-400 mx-auto mb-3"
                  aria-hidden="true"
                />
                <p className="font-semibold text-gray-900 text-lg select-none">
                  Assessment Complete! 🎉
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Your dashboard has been updated with personalized
                  recommendations
                </p>
              </div>
            </div>
          )}

          {/* Hero Section */}
          <section className="relative mb-10">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/60 relative overflow-hidden">
              {/* Doctor welcoming patient - Where ocean emoji was */}
              <div className="absolute top-6 right-6 opacity-10 select-none pointer-events-none text-5xl">
                👩‍⚕️
              </div>

              {/* PWA Install Button - Far Left */}
              {showInstallButton && !isInstalled && (
                <div className="absolute top-6 left-6 z-10">
                  <button
                    onClick={handleInstallClick}
                    className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    aria-label="Install Nexus Mind Care app"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Install App</span>
                    <Smartphone className="w-4 h-4 sm:hidden" />
                  </button>
                </div>
              )}

              <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
                {t("dashboard.greeting", {
                  name: getUserDisplayName().split(" ")[0],
                })}
              </h1>
            </div>
          </section>

          {/* Mood Tracker Section */}
          <section className="mb-10">
            <MoodTracker userId={user?.id} />
          </section>

          {/* Profile Strip */}
          <section className="bg-white/80 backdrop-blur-md rounded-3xl p-5 mb-8 shadow-xl border border-white/60 flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={localProfileData.profileImage || user?.imageUrl} 
                  alt={getUserDisplayName()} 
                />
                <AvatarFallback className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-600 text-white font-bold text-2xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                  {getUserDisplayName()}
                </h3>
                <p className="text-teal-700 font-medium text-sm">
                  {localProfileData.university || (user?.publicMetadata?.university as string) || "University"}
                </p>
                {(localProfileData.registrationNumber || (user?.publicMetadata?.registrationNumber as string)) && (
                  <p className="text-blue-600 font-medium text-xs">
                    ID: {localProfileData.registrationNumber || (user?.publicMetadata?.registrationNumber as string)}
                  </p>
                )}
                <p className="text-gray-600 text-sm">
                  {localProfileData.location || (user?.publicMetadata?.location as string) || "Location"}
                </p>
              </div>
            </div>
            <button
              onClick={handleEditProfile}
              aria-label="Edit profile"
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
              type="button"
            >
              <Edit size={20} className="text-gray-600" />
            </button>
          </section>

          {/* Main Grid */}
          <section className="grid lg:grid-cols-2 gap-8 mb-10">
            {/* Assessment Snapshot */}
            <article className="bg-white/85 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/70 flex flex-col justify-between">
              <header className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900 text-xl">
                  {t("dashboard.assessment")}
                </h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/assessment')}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 flex items-center space-x-2"
                    type="button"
                    aria-label="Start Comprehensive Assessment"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Take Assessment</span>
                  </button>
                  <button
                    onClick={() => setShowFullReport(true)}
                    className="text-teal-600 font-semibold text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-teal-400 rounded"
                    type="button"
                    aria-label="View detailed report"
                  >
                    {assessmentResult
                      ? "View Full Report"
                      : t("dashboard.viewReport")}
                  </button>
                </div>
              </header>

              <div className="space-y-4">
                {kpis.map((kpi, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/90 shadow-inner"
                    role="listitem"
                  >
                    <div className="flex items-center space-x-4">
                      <span
                        className={`w-4 h-4 rounded-full ${
                          kpi.color === "green"
                            ? "bg-green-500"
                            : kpi.color === "blue"
                            ? "bg-blue-500"
                            : "bg-purple-600"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-gray-900">
                        {kpi.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 text-lg tabular-nums">
                        {kpi.score}
                      </span>
                      <TrendingUp
                        size={18}
                        className={`${
                          kpi.trend === "up"
                            ? "text-green-600"
                            : "text-red-600 rotate-180"
                        }`}
                        aria-label={`Trend ${
                          kpi.trend === "up" ? "upwards" : "downwards"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm text-gray-600 italic select-none">
                {comprehensiveAssessmentResult 
                  ? `Last assessed: ${new Date(comprehensiveAssessmentResult.timestamp).toLocaleDateString()}`
                  : t("dashboard.lastAssessed", { date: "Sep 10, 2025" })
                }
              </p>
            </article>

            {/* Daily Activities */}
            <article className="bg-white/85 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/70">
              <h2 className="font-semibold text-gray-900 text-xl mb-6">
                {t("dashboard.todayActivities")}
              </h2>

              <div className="space-y-4">
                {recommendedActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50/90 rounded-2xl shadow-inner"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl select-none">
                        {index === 0 ? "🧘‍♂️" : index === 1 ? "📝" : "🚶‍♂️"}
                      </span>
                      <div>
                        <span className="font-semibold text-gray-900 text-base">
                          {activity.name}
                        </span>
                        <p className="text-sm text-gray-600">
                          {activity.duration}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => completeActivity(index + 1)}
                      aria-label={`Mark ${activity.name} as complete`}
                      className="transition-transform text-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-400 hover:text-teal-600 hover:scale-110 active:scale-105 cursor-pointer"
                      type="button"
                    >
                      <CheckCircle2 size={28} />
                    </button>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* Games Carousel */}
          <section className="mb-10">
            <h2 className="font-semibold text-white text-xl mb-5">
              {t("dashboard.games")}
            </h2>
            <div className="flex space-x-6 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-teal-300 scrollbar-track-teal-50">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="flex-shrink-0 bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-white/50 w-48 flex flex-col justify-between"
                  tabIndex={0}
                  aria-label={`${game.title}, duration ${game.duration}`}
                  role="group"
                >
                  {game.video ? (
                    <div className="mb-3">
                      {playingVideo === game.id ? (
                        game.videoSrc?.endsWith(".mp3") ? (
                          <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl flex items-center justify-center">
                            <audio
                              className="w-full"
                              controls
                              autoPlay
                              onEnded={() => setPlayingVideo(null)}
                            >
                              <source
                                src={`/animation/${game.videoSrc}`}
                                type="audio/mpeg"
                              />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        ) : (
                          <video
                            className="w-full h-32 object-cover rounded-xl"
                            controls
                            autoPlay
                            onEnded={() => setPlayingVideo(null)}
                          >
                            <source
                              src={`/animation/${
                                game.videoSrc ||
                                "Thought Bubbles! For Anxiety & Worry..mp4"
                              }`}
                              type="video/mp4"
                            />
                            Your browser does not support the video tag.
                          </video>
                        )
                      ) : (
                        <div className="w-full h-32 rounded-xl overflow-hidden relative">
                          <img
                            src={`/animation/${game.thumbnail || "image.jpg"}`}
                            alt={`${game.title} thumbnail`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-3">
                              <Play size={24} className="text-teal-600" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-5xl mb-3 select-none">
                      {game.image}
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {game.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-5">{game.duration}</p>
                  <button
                    className="w-full bg-teal-600 text-white py-3 rounded-2xl hover:bg-teal-700 transition-colors flex items-center justify-center space-x-3 focus:outline-none focus:ring-4 focus:ring-teal-400"
                    type="button"
                    aria-label={`${
                      playingVideo === game.id ? "Stop" : "Play"
                    } ${game.title}`}
                    onClick={() => {
                      console.log('Game clicked:', game.title, 'External link:', game.externalLink);
                      if (game.externalLink) {
                        console.log('Opening external link:', game.externalLink);
                        window.open(
                          game.externalLink,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      } else if (game.video) {
                        setPlayingVideo(
                          playingVideo === game.id ? null : game.id
                        );
                      }
                    }}
                  >
                    <Play size={20} />
                    <span>
                      {playingVideo === game.id ? "Stop" : t("dashboard.play")}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mb-12">
            <h2 className="font-semibold text-gray-900 text-xl mb-6">
              {t("dashboard.quickActions")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  tab: "booking",
                  icon: <Calendar className="w-10 h-10 text-teal-600" />,
                  label: t("dashboard.bookConsultant"),
                },
                {
                  tab: "manasai",
                  icon: <MessageCircle className="w-10 h-10 text-blue-600" />,
                  label: t("dashboard.chatWithAI"),
                },
                {
                  tab: "resources",
                  icon: <BookOpen className="w-10 h-10 text-purple-600" />,
                  label: t("dashboard.resources"),
                },
                {
                  tab: "peer",
                  icon: <Users className="w-10 h-10 text-orange-600" />,
                  label: t("dashboard.peerChat"),
                },
              ].map(({ tab, icon, label }) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/60 hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-teal-400 flex flex-col items-center justify-center space-y-3 text-center"
                  aria-label={label}
                  type="button"
                >
                  {icon}
                  <span className="font-semibold text-gray-900 text-sm">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Upcoming Bookings */}
          <section className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/60 max-w-4xl mx-auto">
            <h2 className="font-semibold text-gray-900 text-xl mb-6">
              {t("dashboard.upcoming")}
            </h2>
            <div className="space-y-5">
              <div
                className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl border border-teal-200 shadow-inner"
                role="listitem"
                tabIndex={0}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-4 h-4 bg-green-500 rounded-full"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-base">
                      Dr. Sarah Wilson - Consultation
                    </p>
                    <p className="text-sm text-gray-600">Tomorrow at 2:00 PM</p>
                  </div>
                </div>
                <Zap size={22} className="text-teal-600" aria-hidden="true" />
              </div>

              <div
                className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-3xl border border-orange-200 shadow-inner"
                role="listitem"
                tabIndex={0}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-4 h-4 bg-orange-500 rounded-full"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-base">
                      Art Therapy Group Session
                    </p>
                    <p className="text-sm text-gray-600">Friday at 6:00 PM</p>
                  </div>
                </div>
                <Users
                  size={22}
                  className="text-orange-600"
                  aria-hidden="true"
                />
              </div>
            </div>
          </section>

          {/* Assessment Modal */}
          {showAssessment && (
            <Assessment
              onClose={() => setShowAssessment(false)}
              onComplete={(result) => {
                setAssessmentResult(result);
                setShowAssessmentSuccess(true);
                setTimeout(() => setShowAssessmentSuccess(false), 3000);
              }}
              userId="user-123" // This should be the actual user ID from Clerk
            />
          )}

          {/* Full Report Modal */}
          {showFullReport && assessmentResult && (
            <FullReport
              result={assessmentResult}
              onClose={() => setShowFullReport(false)}
            />
          )}

          {/* Edit Profile Modal */}
          {showEditProfile && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Edit Profile
                    </CardTitle>
                    <Button
                      onClick={() => setShowEditProfile(false)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage
                          src={profileImagePreview || localProfileData.profileImage || user?.imageUrl}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback className="w-24 h-24 bg-gradient-to-br from-teal-400 to-blue-600 text-white font-bold text-3xl">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2">
                        <Label
                          htmlFor="profile-image"
                          className="cursor-pointer"
                        >
                          <div className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-full shadow-lg transition-colors">
                            <Camera className="w-4 h-4" />
                          </div>
                        </Label>
                        <input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      Click the camera icon to change your profile picture
                    </p>
                  </div>

                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full"
                    />
                  </div>

                  {/* University Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="university"
                      className="text-sm font-medium text-gray-700"
                    >
                      University/College
                    </Label>
                    <Input
                      id="university"
                      type="text"
                      value={editingUniversity}
                      onChange={(e) => setEditingUniversity(e.target.value)}
                      placeholder="Enter your university or college name"
                      className="w-full"
                    />
                  </div>

                  {/* Registration Number Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="registration"
                      className="text-sm font-medium text-gray-700"
                    >
                      Registration/Roll Number
                    </Label>
                    <Input
                      id="registration"
                      type="text"
                      value={editingRegistrationNumber}
                      onChange={(e) =>
                        setEditingRegistrationNumber(e.target.value)
                      }
                      placeholder="Enter your registration or roll number"
                      className="w-full"
                    />
                  </div>

                  {/* Location Field with Auto-detect */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="location"
                      className="text-sm font-medium text-gray-700"
                    >
                      Location
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="location"
                        type="text"
                        value={editingLocation}
                        onChange={(e) => setEditingLocation(e.target.value)}
                        placeholder="Enter your city, state"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={detectLocation}
                        disabled={isDetectingLocation}
                        variant="outline"
                        size="sm"
                        className="px-3"
                      >
                        {isDetectingLocation ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Click the location icon to auto-detect your current
                      location
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={() => setShowEditProfile(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isUpdatingProfile || !editingName.trim()}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Privacy Note */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 text-center">
                      🔒 Your privacy is our priority. All your profile data is securely stored locally on your device, giving you full control
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>{" "}
        {/* End of main content container */}
      </div>
      {/* End of background wrapper */}
    </div>
  );
};

export default UserDashboard;
