// Lightweight, dependency-free chart primitives (plain divs + inline widths) used on the
// Super Admin Dashboard. No charting library is installed in this project, so these avoid
// adding one just for a handful of bars.

interface ProgressBarProps {
    label: string;
    value: number;
    max: number | null; // null = unlimited
    formatValue?: (n: number) => string;
}

// Color-codes by how close usage is to the limit: green while healthy, amber approaching
// the limit, red at or over it. Unlimited (max === null) always reads as healthy.
export function usageColor(pct: number | null): string {
    if (pct === null) return 'bg-emerald-500';
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
}

// Text-color counterpart of usageColor. Written as literal class names (not derived via
// string replacement) so Tailwind's content scanner can actually find and keep them.
export function usageTextColor(pct: number | null): string {
    if (pct === null) return 'text-emerald-500';
    if (pct >= 100) return 'text-red-500';
    if (pct >= 80) return 'text-amber-500';
    return 'text-emerald-500';
}

export function ProgressBar({ label, value, max, formatValue }: ProgressBarProps) {
    const pct = max === null ? null : max <= 0 ? 100 : Math.min(100, (value / max) * 100);
    const fmt = formatValue ?? ((n: number) => `${n}`);
    return (
        <div>
            <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1">
                <span>{label}</span>
                <span className="text-[var(--text)] font-medium">
                    {fmt(value)} {max === null ? '/ Unlimited' : `/ ${fmt(max)}`}
                </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--overlay-weak)] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${usageColor(pct)}`}
                    style={{ width: `${pct === null ? 8 : Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                />
            </div>
        </div>
    );
}

interface TrendBarChartProps {
    data: { label: string; value: number }[];
    color?: string;
}

// Simple vertical bar chart for a short time series (e.g. signups over the last 14 days).
export function TrendBarChart({ data, color = 'bg-[var(--brand-accent)]' }: TrendBarChartProps) {
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
        <div className="flex items-end gap-1 h-32">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">{d.value}</div>
                    <div
                        className={`w-full rounded-t ${color} min-h-[2px]`}
                        style={{ height: `${(d.value / max) * 100}%` }}
                        title={`${d.label}: ${d.value}`}
                    />
                    <div className="text-[9px] text-[var(--faint)] mt-1 whitespace-nowrap">{d.label}</div>
                </div>
            ))}
        </div>
    );
}

interface StatusSegment {
    label: string;
    value: number;
    color: string; // tailwind bg-* class
}

// Single horizontal stacked bar + legend, used for the tickets-by-status breakdown.
export function StackedStatusBar({ segments }: { segments: StatusSegment[] }) {
    const total = Math.max(1, segments.reduce((sum, s) => sum + s.value, 0));
    return (
        <div>
            <div className="h-4 rounded-full overflow-hidden flex bg-[var(--overlay-weak)]">
                {segments.map((s, i) => (
                    s.value > 0 && (
                        <div
                            key={i}
                            className={s.color}
                            style={{ width: `${(s.value / total) * 100}%` }}
                            title={`${s.label}: ${s.value}`}
                        />
                    )
                ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {segments.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        {s.label}: <span className="text-[var(--text)] font-medium">{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Bytes -> human readable, used for storage capacity bars/labels.
export function formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}
