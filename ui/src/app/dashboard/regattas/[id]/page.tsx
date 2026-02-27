'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import {
    ChevronLeft, Calendar, MapPin, Users,
    Target, Anchor, Shield, TrendingUp, Loader2,
    Plus, Trash2, Edit, Save, Settings as SettingsIcon
} from 'lucide-react';
import { useRegatta, RaceResponse, useFleets, FleetResponse, ScoringMethod, StartType, CourseType } from '@/hooks/useRegattas';
import { useRaces } from '@/hooks/useRaces';
import AddRaceModal from '@/components/AddRaceModal';
import EditRaceModal from '@/components/EditRaceModal';
import { ScoreRaceModal } from '@/components/ScoreRaceModal';
import RaceOverridesModal from '@/components/RaceOverridesModal';

export default function RegattaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { regatta, isLoading, error, refetch, updateRegatta, updateEntry } = useRegatta(id);

    const [activeTab, setActiveTab] = useState<'Overview' | 'Entries' | 'Classes' | 'Races' | 'Settings'>('Overview');

    // Entry Edit State
    const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
    const [editEntryData, setEditEntryData] = useState<{ fleetId: number | null; rating: number | null; registrationStatus: string }>({ fleetId: null, rating: null, registrationStatus: 'Pending' });
    const { deleteRace, isLoading: isDeleting } = useRaces();
    const { createFleet, updateFleet, deleteFleet, isLoading: isManagingFleets } = useFleets();

    const [isAddRaceOpen, setIsAddRaceOpen] = useState(false);
    const [editingRace, setEditingRace] = useState<RaceResponse | null>(null);
    const [scoringRace, setScoringRace] = useState<RaceResponse | null>(null);
    const [isRaceOverridesOpen, setIsRaceOverridesOpen] = useState(false);
    const [selectedFleetForOverrides, setSelectedFleetForOverrides] = useState<FleetResponse | null>(null);
    const [scoringTab, setScoringTab] = useState<'record' | 'results'>('record');

    const [isAddFleetOpen, setIsAddFleetOpen] = useState(false);
    const [editingFleet, setEditingFleet] = useState<FleetResponse | null>(null);
    const [fleetName, setFleetName] = useState('');
    const [scoringMethod, setScoringMethod] = useState<ScoringMethod>(ScoringMethod.PHRF_TOT);

    const [regattaSettings, setRegattaSettings] = useState({
        name: '',
        organization: '',
        location: '',
        startDate: '',
        endDate: '',
        status: ''
    });

    React.useEffect(() => {
        if (regatta) {
            setRegattaSettings({
                name: regatta.name,
                organization: regatta.organization,
                location: regatta.location,
                startDate: regatta.startDate.split('T')[0],
                endDate: regatta.endDate?.split('T')[0] || '',
                status: regatta.status
            });
        }
    }, [regatta]);

    if (isLoading) {
        return (
            <div className="flex-1 w-full flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (error || !regatta) {
        return (
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 text-center text-rose-400">
                {error || "Regatta not found"}
            </div>
        );
    }

    const regattaName = regatta.name;
    const status = regatta.status || 'Upcoming';

    // Format dates nicely if they exist
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        // Force UTC to prevent shifting to previous day
        return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const startDate = formatDate(regatta.startDate);
    const endDate = formatDate(regatta.endDate);
    const location = regatta.location;
    const organization = regatta.organization || 'Race Committee';

    const statusColors: Record<string, string> = {
        'Upcoming': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'Live': 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse',
        'Completed': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        'Draft': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };

    const handleAddFleet = async () => {
        if (!fleetName.trim()) return;
        try {
            await createFleet(regatta.id, {
                name: fleetName,
                sequenceOrder: (regatta.fleets?.length || 0) + 1,
                scoringMethod: scoringMethod
            });
            setFleetName('');
            setScoringMethod(ScoringMethod.PHRF_TOT);
            setIsAddFleetOpen(false);
            refetch();
        } catch (err) {
            console.error("Failed to add fleet:", err);
        }
    };

    const handleUpdateFleet = async () => {
        if (!editingFleet || !fleetName.trim()) return;
        try {
            await updateFleet(editingFleet.id, {
                name: fleetName,
                sequenceOrder: editingFleet.sequenceOrder,
                scoringMethod: scoringMethod
            });
            setFleetName('');
            setEditingFleet(null);
            refetch();
        } catch (err) {
            console.error("Failed to update fleet:", err);
        }
    };

    const handleDeleteFleet = async (id: number) => {
        if (confirm('Are you sure you want to delete this class? This will also affect races and entries in this class.')) {
            try {
                await deleteFleet(id);
                refetch();
            } catch (err) {
                console.error("Failed to delete fleet:", err);
            }
        }
    };

    const handleDeleteRace = async (raceId: number) => {
        if (confirm('Are you sure you want to delete this race?')) {
            try {
                await deleteRace(raceId);
                refetch();
            } catch {
                alert('Failed to delete race');
            }
        }
    };

    const handleUpdateEntrySubmit = async (entryId: number) => {
        try {
            await updateEntry(entryId, editEntryData);
            setEditingEntryId(null);
        } catch (err) {
            console.error("Failed to update entry:", err);
            alert("Failed to update entry");
        }
    };

    const handleUpdateSettings = async () => {
        try {
            await updateRegatta(regattaSettings);
            alert('Settings updated successfully');
            refetch();
        } catch (err) {
            console.error("Failed to update settings:", err);
        }
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {/* Minimalist Top Navigation */}
            <nav className="flex items-center space-x-4 mb-8">
                <Link href="/dashboard" className="nav-button-round">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="h-4 w-px bg-slate-700"></div>
                <div className="text-sm font-medium text-slate-400">
                    Dashboard / <span className="text-cyan-400">{regattaName}</span>
                </div>
            </nav>

            {/* Header Section */}
            <div className="glass-header mb-10">
                <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <span className={`badge-base ${statusColors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                {status}
                            </span>
                            <span className="badge-base text-indigo-300 bg-indigo-500/10 border-indigo-500/20">
                                Race Committee
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                            {regattaName}
                        </h1>
                        <p className="text-lg text-slate-400 font-medium max-w-2xl">{organization}</p>

                        <div className="flex flex-wrap items-center gap-6 mt-6">
                            <div className="info-pill">
                                <Calendar className="w-5 h-5 mr-3 text-cyan-400" />
                                <span className="font-medium">{startDate} {endDate && `- ${endDate}`}</span>
                            </div>
                            <div className="info-pill">
                                <MapPin className="w-5 h-5 mr-3 text-cyan-400" />
                                <span className="font-medium">{location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Boats Entered" value={regatta.boatsEnteredCount?.toString() || "0"} icon={<Anchor className="w-6 h-6" />} color="cyan" />
                <StatCard title="Classes" value={regatta.classesCount?.toString() || "0"} icon={<Target className="w-6 h-6" />} color="indigo" />
                <StatCard title="Scheduled Races" value={regatta.scheduledRacesCount?.toString() || "0"} icon={<TrendingUp className="w-6 h-6" />} color="emerald" />
                <StatCard title="Protests" value="0" icon={<Shield className="w-6 h-6" />} color="slate" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-800 mb-8 pb-px scrollbar-hide">
                <Tab active={activeTab === 'Overview'} label="Overview" onClick={() => setActiveTab('Overview')} />
                <Tab active={activeTab === 'Entries'} label="Entries" onClick={() => setActiveTab('Entries')} />
                <Tab active={activeTab === 'Classes'} label="Classes" onClick={() => setActiveTab('Classes')} />
                <Tab active={activeTab === 'Races'} label="Races" onClick={() => setActiveTab('Races')} />
                <Tab active={activeTab === 'Settings'} label="Settings" onClick={() => setActiveTab('Settings')} />
            </div>

            {/* Main Content Area */}
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-container">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                                <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">View All</button>
                            </div>
                            <div className="space-y-4">
                                <ActivityItem time="Just now" action="Regatta Statistics Updated" target={`with ${regatta.boatsEnteredCount} boats`} />
                                <ActivityItem time="Today" action="Races Configured" target={`Total of ${regatta.scheduledRacesCount} races`} />
                                <ActivityItem time="Recently" action="Regatta Initialized" target={`at ${location}`} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Actions & Info */}
                    <div className="space-y-6">
                        <div className="backdrop-blur-md bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <ActionBtn icon={<Users className="w-4 h-4" />} label="Manage Entries" onClick={() => setActiveTab('Entries')} />
                                <ActionBtn icon={<Target className="w-4 h-4" />} label="Configure Classes" onClick={() => setActiveTab('Classes')} />
                                <ActionBtn icon={<Calendar className="w-4 h-4" />} label="Manage Races" onClick={() => setActiveTab('Races')} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Entries' && (
                <div className="space-y-6">
                    <div className="glass-container">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Regatta Entries</h2>
                            <div className="text-sm text-slate-400">{regatta.boatsEnteredCount} Boats Confirmed</div>
                        </div>

                        {!regatta.entries || regatta.entries.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                No boats have entered this regatta yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-slate-400 text-sm">
                                            <th className="pb-3 font-medium">Boat Name</th>
                                            <th className="pb-3 font-medium">Owner</th>
                                            <th className="pb-3 font-medium">Design / Model</th>
                                            <th className="pb-3 font-medium">Class / Fleet</th>
                                            <th className="pb-3 font-medium">Rating</th>
                                            <th className="pb-0 font-medium">Status</th>
                                            <th className="pb-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {regatta.entries.map((entry) => (
                                            <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                <td className="py-4 text-white font-medium">{entry.boatName} <span className="text-slate-500 text-xs block">{entry.sailNumber !== 'None' ? `Sail: ${entry.sailNumber}` : ''}</span></td>
                                                <td className="py-4 text-slate-300">{entry.ownerName}</td>
                                                <td className="py-4 text-slate-300">{entry.boatType}</td>
                                                <td className="py-4">
                                                    {editingEntryId === entry.id ? (
                                                        <select
                                                            title="Fleet Selection"
                                                            value={editEntryData.fleetId || ''}
                                                            onChange={(e) => setEditEntryData({ ...editEntryData, fleetId: e.target.value ? parseInt(e.target.value) : null })}
                                                            className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                                                        >
                                                            <option value="">-- No Class --</option>
                                                            {regatta.fleets?.map(f => (
                                                                <option key={f.id} value={f.id}>{f.name}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="text-cyan-400 font-medium">{regatta.fleets?.find(f => f.id === entry.fleetId)?.name || 'Unassigned'}</span>
                                                    )}
                                                </td>
                                                <td className="py-4">
                                                    {editingEntryId === entry.id ? (
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={editEntryData.rating ?? ''}
                                                            onChange={(e) => setEditEntryData({ ...editEntryData, rating: e.target.value ? parseFloat(e.target.value) : null })}
                                                            className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm w-20"
                                                            placeholder="e.g. 120"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-300 font-medium">{entry.rating ?? '—'}</span>
                                                    )}
                                                </td>
                                                <td className="py-4">
                                                    {editingEntryId === entry.id ? (
                                                        <select
                                                            title="Registration Status"
                                                            value={editEntryData.registrationStatus}
                                                            onChange={(e) => setEditEntryData({ ...editEntryData, registrationStatus: e.target.value })}
                                                            className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Approved">Approved</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${entry.registrationStatus === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                            entry.registrationStatus === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                            }`}>
                                                            {entry.registrationStatus}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-right">
                                                    {editingEntryId === entry.id ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleUpdateEntrySubmit(entry.id)}
                                                                title="Save Entry"
                                                                className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingEntryId(null)}
                                                                className="p-1.5 bg-slate-700/50 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingEntryId(entry.id);
                                                                setEditEntryData({ fleetId: entry.fleetId || null, rating: entry.rating ?? null, registrationStatus: entry.registrationStatus });
                                                            }}
                                                            title="Edit Entry"
                                                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'Classes' && (
                <div className="space-y-6">
                    <div className="glass-container">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Racing Classes</h2>
                            <button
                                onClick={() => {
                                    setFleetName('');
                                    setScoringMethod(ScoringMethod.PHRF_TOT);
                                    setIsAddFleetOpen(true);
                                }}
                                className="action-button-sm py-2.5 px-6 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-lg shadow-cyan-900/20 border-none inline-flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Class
                            </button>
                        </div>

                        {/* Inline Add/Edit Class Form */}
                        {(isAddFleetOpen || editingFleet) && (
                            <div className="mb-8 p-6 bg-slate-800/50 border border-white/10 rounded-2xl flex flex-col md:flex-row items-end gap-4 shadow-xl">
                                <div className="flex-1 space-y-1.5 w-full">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Class Name</label>
                                    <input
                                        type="text"
                                        value={fleetName}
                                        onChange={(e) => setFleetName(e.target.value)}
                                        placeholder="e.g. J/70, PHRF A, ILCA 7"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                                        autoFocus
                                    />
                                </div>
                                <div className="w-full md:w-64 space-y-1.5 ">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">Scoring Method</label>
                                    <select
                                        value={scoringMethod}
                                        onChange={(e) => setScoringMethod(parseInt(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
                                    >
                                        <option value={ScoringMethod.OneDesign}>One Design (No Handicap)</option>
                                        <option value={ScoringMethod.PHRF_TOT}>PHRF Time-on-Time</option>
                                        <option value={ScoringMethod.PHRF_TOD}>PHRF Time-on-Distance</option>
                                        <option value={ScoringMethod.ORR_EZ_GPH}>ORR-EZ General (GPH)</option>
                                        <option value={ScoringMethod.ORR_EZ_PC}>ORR-EZ Performance Curve</option>
                                        <option value={ScoringMethod.ORR_Full_PC}>ORR Full Performance Curve</option>
                                        <option value={ScoringMethod.Portsmouth}>Portsmouth Yardstick</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                    <button
                                        onClick={editingFleet ? handleUpdateFleet : handleAddFleet}
                                        disabled={isManagingFleets}
                                        className="flex-1 md:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-emerald-900/20"
                                    >
                                        {isManagingFleets ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        {editingFleet ? 'Update Class' : 'Create Class'}
                                    </button>
                                    <button
                                        onClick={() => { setIsAddFleetOpen(false); setEditingFleet(null); setFleetName(''); }}
                                        className="text-slate-400 hover:text-white px-4 py-2.5 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {!regatta.fleets || regatta.fleets.length === 0 ? (
                            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                                <Anchor className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">No racing classes configured yet.</p>
                                <p className="text-sm opacity-60">Add a class to start registering boats and scheduling races.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {regatta.fleets.map((fleet) => (
                                    <div key={fleet.id} className="group relative p-6 bg-slate-800/30 border border-white/5 rounded-2xl flex flex-col hover:bg-slate-800/50 hover:border-cyan-500/30 transition-all duration-300 shadow-lg">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white tracking-tight">{fleet.name}</h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded uppercase tracking-wider border border-cyan-500/20">
                                                        {ScoringMethod[fleet.scoringMethod]?.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                        Order: {fleet.sequenceOrder}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setSelectedFleetForOverrides(fleet);
                                                        setIsRaceOverridesOpen(true);
                                                    }}
                                                    title="Race Overrides"
                                                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                                >
                                                    <SettingsIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingFleet(fleet);
                                                        setFleetName(fleet.name);
                                                        setScoringMethod(fleet.scoringMethod);
                                                    }}
                                                    title="Edit Class"
                                                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFleet(fleet.id)}
                                                    title="Delete Class"
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {/* Placeholder for boat counts/icons */}
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center">
                                                        <Anchor className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium text-slate-400">
                                                {regatta.entries?.filter(e => e.fleetId === fleet.id).length || 0} Boats
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'Settings' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="glass-container">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <SettingsIcon className="w-5 h-5 text-cyan-400" /> Regatta Settings
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-400 ml-1">Regatta Name</label>
                                <input
                                    type="text"
                                    value={regattaSettings.name}
                                    onChange={(e) => setRegattaSettings({ ...regattaSettings, name: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-400 ml-1">Organization</label>
                                <input
                                    type="text"
                                    value={regattaSettings.organization}
                                    onChange={(e) => setRegattaSettings({ ...regattaSettings, organization: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-400 ml-1">Location</label>
                                <input
                                    type="text"
                                    value={regattaSettings.location}
                                    onChange={(e) => setRegattaSettings({ ...regattaSettings, location: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-400 ml-1">Status</label>
                                <select
                                    value={regattaSettings.status}
                                    onChange={(e) => setRegattaSettings({ ...regattaSettings, status: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="Live">Live</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-400 ml-1">Start Date</label>
                                <input
                                    type="date"
                                    value={regattaSettings.startDate}
                                    onChange={(e) => setRegattaSettings({ ...regattaSettings, startDate: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-400 ml-1">End Date</label>
                                <input
                                    type="date"
                                    value={regattaSettings.endDate}
                                    onChange={(e) => setRegattaSettings({ ...regattaSettings, endDate: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/5">
                            <button
                                onClick={handleUpdateSettings}
                                className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-3 px-10 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center"
                            >
                                <Save className="w-5 h-5 mr-3" /> Save Changes
                            </button>
                        </div>
                    </div>

                    <div className="glass-container border-rose-500/20">
                        <h3 className="text-lg font-bold text-rose-400 mb-2">Danger Zone</h3>
                        <p className="text-slate-400 text-sm mb-4">Once you delete a regatta, there is no going back. Please be certain.</p>
                        <button className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-sm font-medium transition-colors">
                            Delete Regatta
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'Races' && (
                <div className="space-y-6">
                    <div className="glass-container">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Races</h2>
                            <button
                                onClick={() => setIsAddRaceOpen(true)}
                                className="px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-sm font-medium transition-colors"
                            >
                                + Add Race
                            </button>
                        </div>

                        {!regatta.races || regatta.races.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                No races have been added to this regatta yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-slate-400 text-sm">
                                            <th className="pb-3 font-medium">Race</th>
                                            <th className="pb-3 font-medium">Type</th>
                                            <th className="pb-3 font-medium">Course</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium">Start Time</th>
                                            <th className="pb-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {regatta.races.map((race) => (
                                            <React.Fragment key={race.id}>
                                                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                    <td className="py-4 text-white font-bold">
                                                        {race.name || 'Unnamed Race'}
                                                    </td>
                                                    <td className="py-4 text-slate-300 font-medium">
                                                        {StartType[race.startType]?.replace(/_/g, ' ')}
                                                    </td>
                                                    <td className="py-4 text-slate-300 font-medium">
                                                        {CourseType[race.courseType]?.replace(/([A-Z])/g, ' $1').trim()}
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${race.status === 'Completed' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                                                            race.status === 'Racing' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                                'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                                                            }`}>
                                                            {race.status || 'Scheduled'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-slate-300 font-medium">
                                                        {race.scheduledStartTime ? new Date(race.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        {(race.status === 'Completed' || race.status === 'Racing') && (
                                                            <button
                                                                onClick={() => { setScoringTab('results'); setScoringRace(race); }}
                                                                className="mr-3 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                Results
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => { setScoringTab('record'); setScoringRace(race); }}
                                                            title="Score Race"
                                                            className="mr-3 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-bold transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            Score
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingRace(race)}
                                                            title="Race Details"
                                                            className="mr-3 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-xs font-bold transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            Details
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRace(race.id)}
                                                            disabled={isDeleting}
                                                            title="Delete Race"
                                                            className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                                {race.raceFleets && race.raceFleets.length > 0 && (
                                                    <tr className="border-b border-white/5 bg-slate-900/30">
                                                        <td colSpan={6} className="py-2 px-2">
                                                            <div className="flex flex-wrap gap-2">
                                                                {race.raceFleets.map(rf => {
                                                                    const parts = [];
                                                                    if (rf.startTimeOffset) parts.push(`+${rf.startTimeOffset}`);
                                                                    if (rf.courseType != null && rf.courseType !== race.courseType) parts.push(CourseType[rf.courseType]?.replace(/([A-Z])/g, ' $1').trim());
                                                                    if (rf.windSpeed != null && rf.windSpeed !== race.windSpeed) parts.push(`${rf.windSpeed}kts`);
                                                                    if (rf.windDirection != null && rf.windDirection !== race.windDirection) parts.push(`${rf.windDirection}°`);
                                                                    if (rf.courseDistance != null && rf.courseDistance !== race.courseDistance) parts.push(`${rf.courseDistance}nm`);

                                                                    if (parts.length === 0) return null;

                                                                    return (
                                                                        <div key={rf.id} className="text-[10px] bg-slate-800/80 border border-slate-700 rounded px-2 py-1 text-slate-400 inline-flex items-center gap-1.5">
                                                                            <span className="font-bold text-slate-300">{rf.fleetName}:</span>
                                                                            <span>{parts.join(' | ')}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AddRaceModal
                isOpen={isAddRaceOpen}
                onClose={() => setIsAddRaceOpen(false)}
                regattaId={regatta.id}
                fleets={regatta.fleets || []}
                onSuccess={refetch}
            />

            <EditRaceModal
                isOpen={!!editingRace}
                onClose={() => setEditingRace(null)}
                race={editingRace}
                fleets={regatta.fleets || []}
                onSuccess={refetch}
            />

            <ScoreRaceModal
                key={scoringRace?.id ?? 'none'}
                isOpen={!!scoringRace}
                onClose={() => setScoringRace(null)}
                race={scoringRace}
                regatta={regatta}
                defaultTab={scoringTab}
            />

            <RaceOverridesModal
                isOpen={isRaceOverridesOpen}
                onClose={() => setIsRaceOverridesOpen(false)}
                fleet={selectedFleetForOverrides}
                races={regatta.races || []}
                onSuccess={refetch}
            />
        </div>
    );
}

// Subcomponents for cleaner code

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: 'cyan' | 'indigo' | 'emerald' | 'slate' }) {
    const colors = {
        cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/50',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/50',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/50',
        slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20 group-hover:border-slate-500/50',
    };

    return (
        <div className={`group relative glass-container transition-all duration-300 hover:bg-white/10 overflow-hidden`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</span>
                <div className={`p - 2 rounded - xl transition - colors duration - 300 ${colors[color]} `}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        </div>
    );
}

function Tab({ label, active = false, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors duration-300 ${active
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
                }`}>
            {label}
        </button>
    );
}

function ActivityItem({ time, action, target }: { time: string, action: string, target: string }) {
    return (
        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2 flex-shrink-0"></div>
            <div>
                <p className="text-sm font-medium text-white">
                    <span className="text-slate-300 mr-1">{action}</span>
                    {target}
                </p>
                <p className="text-xs text-slate-500 mt-1">{time}</p>
            </div>
        </div>
    );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 hover:border-cyan-500/30 rounded-xl text-sm font-medium text-slate-200 hover:text-white transition-all duration-300 group"
        >
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">{icon}</span>
            {label}
        </button>
    );
}
