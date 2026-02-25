'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

export default function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include', // Important: sends the cookie to be cleared
            });

            if (res.ok) {
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-full transition-colors"
        >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
        </button>
    );
}
