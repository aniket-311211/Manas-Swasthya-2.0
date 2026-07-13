import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useCommunity } from '@/contexts/CommunityContext';

interface MentorLoginProps {
    onBack: () => void;
    onSuccess: () => void;
}

const MentorLogin: React.FC<MentorLoginProps> = ({ onBack, onSuccess }) => {
    const { loginMentor, state } = useCommunity();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const success = await loginMentor(email, password);
        if (success) {
            onSuccess();
        } else {
            setError('Invalid email or password. Please try again.');
        }
    };

    return (
        <div className="min-h-[500px] flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                        <UserCheck className="w-8 h-8 text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Mentor Login</h2>
                    <p className="text-gray-600">Sign in to access the mentor dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mentor@example.com"
                            required
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                className="w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={state.loading}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3"
                    >
                        {state.loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                Signing in...
                            </div>
                        ) : (
                            'Sign In as Mentor'
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onBack}
                        className="w-full"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Community
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        Test credentials: <br />
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">mentor@nexus.com / mentor123</code>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MentorLogin;
