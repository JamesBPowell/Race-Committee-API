import React from 'react';
import { Radio, Map, Navigation, Trophy, ChevronRight } from 'lucide-react';

export default function LiveNowSection() {
    return (
        <section className="bg-[#0b101a] py-24 pb-32 text-slate-200 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <h2 className="text-red-500 font-bold uppercase tracking-widest text-sm">Live Now</h2>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                            Real-time telemetry <br /> and scoring.
                        </h3>
                    </div>
                    <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors group">
                        Explore All Live Races
                        <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Dashboard Mockup Container */}
                <div className="relative rounded-2xl border border-slate-800 bg-[#0f172a]/50 p-6 md:p-8 backdrop-blur-sm shadow-2xl overflow-hidden">

                    {/* Subtle glowing orb behind dashboard */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

                        {/* Left Column (Leaderboard Placeholder) */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-slate-400 font-semibold uppercase tracking-wider text-xs mb-2">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <p>Current Standings (J/70 Fleet)</p>
                            </div>

                            {/* Mock Leaderboard Items */}
                            {[1, 2, 3].map((pos) => (
                                <div key={pos} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800 transition-colors cursor-default">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-black text-slate-500 w-6">{pos}</span>
                                        <div>
                                            <p className="text-white font-bold">Sonic Spirit</p>
                                            <p className="text-xs text-slate-400">USA 142</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-cyan-400 font-mono font-semibold">+0:00</p>
                                        <p className="text-xs text-slate-500">To Leader</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Middle/Right Column (Map / Tracking Placeholder) */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <div className="flex items-center justify-between text-slate-400 font-semibold uppercase tracking-wider text-xs mb-2">
                                <div className="flex items-center gap-3">
                                    <Map className="w-4 h-4 text-cyan-400" />
                                    <p>Live Course Map</p>
                                </div>
                                <div className="flex items-center gap-2 text-green-400">
                                    <Radio className="w-4 h-4" />
                                    <p>Telemetry Active</p>
                                </div>
                            </div>

                            {/* Map UI Box */}
                            <div className="flex-1 bg-slate-900 border border-slate-700/50 rounded-xl relative overflow-hidden min-h-[300px] flex items-center justify-center">
                                {/* Abstract grid for map background */}
                                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>

                                {/* Mock Boats on map */}
                                <div className="absolute top-1/3 left-1/3 p-2 bg-slate-800 border-2 border-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] z-10 animate-bounce">
                                    <Navigation className="w-5 h-5 text-cyan-400 transform rotate-45" />
                                </div>

                                <div className="absolute top-1/2 right-1/4 p-2 bg-slate-800 border-2 border-slate-500 rounded-full z-10">
                                    <Navigation className="w-4 h-4 text-slate-400 transform -rotate-12" />
                                </div>

                                {/* Mark */}
                                <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-orange-500 rounded-full z-10 shadow-[0_0_10px_rgba(249,115,22,0.8)] border border-white"></div>

                                {/* Route Line (Abstract) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M200,100 C 300,150 400,200 600,150" fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="2" strokeDasharray="5,5" />
                                </svg>

                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}
