import React from 'react';
import Link from 'next/link';

export default function HeroSection() {
    return (
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Hero Background Image */}
            <div
                className="absolute inset-0 z-0 opacity-50 bg-cover bg-center bg-no-repeat mix-blend-screen"
                style={{
                    backgroundImage: "url('/hero-bg.jpg')",
                }}
            />

            {/* Subtle grid pattern for texture */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Glassmorphic Hero Card */}
            <div className="relative z-10 w-full max-w-3xl mx-auto px-6">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-10 md:p-16 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] text-center">

                    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-sm">
                        Are you racing <br className="hidden md:block" /> or hosting?
                    </h1>

                    <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        Modern Race Management for the 21st Century. Effortless registration, live telemetry, and scoring all in one powerful platform.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/events" className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transform hover:-translate-y-1 text-center">
                            Register for a Race
                        </Link>
                        <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/20 transition-all duration-300 backdrop-blur-sm transform hover:-translate-y-1 text-center">
                            RC Login
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    );
}
