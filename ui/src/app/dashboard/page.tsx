'use client';

import { useState } from 'react';

import RegattaFormModal from '@/components/RegattaFormModal';
import FindRegattaModal from '@/components/FindRegattaModal';
import { PlusCircle, Search } from 'lucide-react';
import RegattaListSection from '@/components/RegattaListSection';
import Button from '@/components/ui/Button';
import { RegattaCardProps } from '@/components/RegattaCard';
import { useRegattas } from '@/hooks/useRegattas';

export default function DashboardPage() {
    const [isRegattaModalOpen, setIsRegattaModalOpen] = useState(false);
    const [isFindModalOpen, setIsFindModalOpen] = useState(false);

    const {
        managingRegattas,
        joinedRegattas,
        isLoading,
        refetchManaging,
        refetchJoined
    } = useRegattas();

    // Map backend models to RegattaCardProps
    const realRcRegattas: RegattaCardProps[] = managingRegattas.map(r => ({
        id: r.id.toString(),
        name: r.name,
        organization: r.organization,
        startDate: new Date(r.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endDate: r.endDate ? new Date(r.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        location: r.location,
        status: r.status as RegattaCardProps['status'],
        role: 'RC' as RegattaCardProps['role'],
        boatsEntered: 0
    })).sort((a, b) => parseInt(b.id) - parseInt(a.id));

    const realRacerRegattas: RegattaCardProps[] = joinedRegattas.map(r => ({
        id: r.id.toString(),
        name: r.name,
        organization: r.organization,
        startDate: new Date(r.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endDate: r.endDate ? new Date(r.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        location: r.location,
        status: r.status as RegattaCardProps['status'], // Use the actual server status, not hardcoded 'Entered'
        role: 'Racer' as RegattaCardProps['role'],
        boatsEntered: 0
    })).sort((a, b) => parseInt(b.id) - parseInt(a.id));

    return (
        <div className="space-y-12">

            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Mission Control</h1>
                    <p className="text-slate-400 mt-1">Manage your event logistics or track your racing campaigns.</p>
                </div>

                {/* Global Actions */}
                <div className="flex w-full md:w-auto items-center gap-3">
                    <Button
                        onClick={() => setIsRegattaModalOpen(true)}
                        className="flex-1 md:flex-none"
                        rounded="full"
                    >
                        <PlusCircle className="w-5 h-5" />
                        New Regatta
                    </Button>
                    <Button
                        onClick={() => setIsFindModalOpen(true)}
                        variant="secondary"
                        rounded="full"
                        className="flex-1 md:flex-none"
                    >
                        <Search className="w-5 h-5" />
                        Find Race
                    </Button>
                </div>
            </header>

            <div className="space-y-16">
                <RegattaListSection
                    title="Managing as RC"
                    countLabel="Active Events"
                    themeColor="cyan"
                    isLoading={isLoading}
                    regattas={realRcRegattas}
                    emptyMessage="You aren't organizing any regattas yet."
                    emptyActionText="Create your first event"
                    onEmptyAction={() => setIsRegattaModalOpen(true)}
                />

                <RegattaListSection
                    title="Racing"
                    countLabel="Entered Events"
                    themeColor="indigo"
                    isLoading={isLoading}
                    regattas={realRacerRegattas}
                    emptyMessage="You aren't entered in any upcoming races."
                    emptyActionText="Find a regatta to join"
                    onEmptyAction={() => setIsFindModalOpen(true)}
                />
            </div>

            <RegattaFormModal
                isOpen={isRegattaModalOpen}
                onClose={() => {
                    setIsRegattaModalOpen(false);
                    // Refresh the list after the modal closes
                    refetchManaging();
                }}
            />

            <FindRegattaModal
                isOpen={isFindModalOpen}
                onClose={() => setIsFindModalOpen(false)}
                onSuccess={() => {
                    // Refresh regattas (specifically entered ones)
                    refetchJoined();
                }}
            />
        </div>
    );
}
