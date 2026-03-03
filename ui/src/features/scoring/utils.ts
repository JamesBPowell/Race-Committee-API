import { CourseType } from '@/hooks/useRegattas';

export function formatDuration(isoOrTimeSpan: string | null | undefined): string {
    if (!isoOrTimeSpan) return '—';
    const parts = isoOrTimeSpan.replace(/\.\d+$/, '').split(':');
    if (parts.length < 2) return isoOrTimeSpan;
    const h = parseInt(parts[0]);
    const m = parts[1].padStart(2, '0');
    const s = parts.length > 2 ? parts[2].padStart(2, '0') : '00';
    return `${h}:${m}:${s}`;
}

export function formatDelta(isoOrTimeSpan: string | null | undefined): string {
    if (!isoOrTimeSpan) return '—';
    const parts = isoOrTimeSpan.replace(/\.\d+$/, '').split(':');
    if (parts.length < 2) return isoOrTimeSpan;
    const h = parseInt(parts[0]);
    const m = parts[1].padStart(2, '0');
    const s = parts.length > 2 ? parts[2].padStart(2, '0') : '00';
    if (h === 0 && parseInt(m) === 0 && parseInt(s) === 0) return '—';
    return `+${h > 0 ? h + ':' : ''}${m}:${s}`;
}

export function courseLabel(ct: CourseType | null | undefined): string {
    if (ct == null) return '';
    const labels: Record<number, string> = {
        0: 'W/L', 1: 'Random', 2: 'Triangle', 3: 'Olympic'
    };
    return labels[ct] ?? '';
}
