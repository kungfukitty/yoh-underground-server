import React, { useState } from 'react';

// Define the shape of the user data returned from the API
interface User {
    id: string;
    name: string;
    email: string;
}

// Update props to include the navigation function
interface AuthScreenProps {
    onLoginSuccess: (user: User, token: string) => void;
    onNavigateToClaim: () => void; // New prop for navigation
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onNavigateToClaim }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = 'https://yoh-underground-server.onrender.com/api/auth/login';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed.');
            }

            onLoginSuccess(data.user, data.token);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            <div className="w-full max-w-sm text-center">
                <form onSubmit={handleSubmit} className="p-10 border border-gray-700 rounded-lg shadow-xl bg-gray-800/50 backdrop-blur-sm">
                    <h1 className="text-5xl font-serif text-accent-gold mb-4">YOH</h1>
                    <p className="text-gray-400 mb-8">Secure Access Portal</p>

                    <div className="space-y-4 mb-6">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:border-accent-gold focus:outline-none"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:border-accent-gold focus:outline-none"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-md text-lg transition-all duration-300 bg-accent-gold text-black hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Authenticating...' : 'Authenticate'}
                    </button>
                </form>

                {/* Navigation link to the Claim Code screen */}
                <div className="mt-6">
                    <button
                        onClick={onNavigateToClaim}
                        className="text-sm text-gray-400 hover:text-accent-gold hover:underline"
                    >
                        Have an access code? Activate account.
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
