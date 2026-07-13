import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SignOutPage = () => {
  const { signOut, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSignOut = async () => {
      if (isSignedIn) {
        try {
          await signOut(() => {
            navigate("/", { replace: true });
          });
        } catch (error) {
          console.error("Error signing out:", error);
          navigate("/", { replace: true });
        }
      } else {
        // If not signed in, redirect to home
        navigate("/", { replace: true });
      }
    };

    handleSignOut();
  }, [isSignedIn, signOut, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing Out</h1>
            <p className="text-gray-600">
              You are being signed out of your account...
            </p>
          </div>
          
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          
          <div className="mt-6">
            <p className="text-sm text-gray-500">
              Thank you for using Manas Svasthya. Take care of your mental health!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignOutPage;