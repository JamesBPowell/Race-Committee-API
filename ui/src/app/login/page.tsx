'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Using the built-in .NET Identity /login endpoint
            const res = await fetch(`${API_BASE_URL}/login?useCookies=true`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include', // Crucial: tells browser to store the returned Set-Cookie
            });

            if (res.ok) {
                // Success! The cookie is now in the browser.
                router.push('/dashboard');
                router.refresh();
            } else {
                setError('Invalid email or password.');
            }
        } catch (err) {
            setError('An error occurred connecting to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
            {/* Background Image reused from Hero */}
            <div
                className="absolute inset-0 z-0 opacity-30 bg-cover bg-center bg-no-repeat mix-blend-screen"
                style={{ backgroundImage: "url('/hero-bg.jpg')" }}
            />

            <div className="relative z-10 w-full max-w-md p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">RC Login</h1>
                    <p className="text-slate-400">Welcome back to RaceKrewe</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                            placeholder="commodore@club.org"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Don't have an account? <Link href="/register" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4">Register here</Link>
                </p>
            </div>
        </main>
    );
}
