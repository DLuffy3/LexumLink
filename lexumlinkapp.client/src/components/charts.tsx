// Lightweight, dependency-free charts themed with brand CSS variables.

export interface Segment {
    label: string;
    value: number;
    color: string;
}

export interface Series {
    name: string;
    color: string;
}

export interface BarDatum {
    label: string;
    values: number[];
}

// ─── Donut / pie ──────────────────────────────────────────────────────────────

export function Donut({
    segments,
    size = 180,
    thickness = 22,
    centerValue,
    centerLabel,
}: {
    segments: Segment[];
    size?: number;
    thickness?: number;
    centerValue?: React.ReactNode;
    centerLabel?: string;
}) {
    const total = segments.reduce((s, x) => s + x.value, 0);
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--overlay-med)" strokeWidth={thickness} />
                        {total > 0 && segments.map((seg, i) => {
                            const len = (seg.value / total) * c;
                            const el = (
                                <circle
                                    key={i}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={r}
                                    fill="none"
                                    stroke={seg.color}
                                    strokeWidth={thickness}
                                    strokeDasharray={`${len} ${c - len}`}
                                    strokeDashoffset={-offset}
                                />
                            );
                            offset += len;
                            return el;
                        })}
                    </g>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {centerValue !== undefined && (
                        <span className="font-['Grifter'] text-3xl font-bold leading-none" style={{ color: 'var(--text)' }}>{centerValue}</span>
                    )}
                    {centerLabel && <span className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{centerLabel}</span>}
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                        {seg.label}
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Grouped bar chart ────────────────────────────────────────────────────────

export function BarChart({
    data,
    series,
    height = 200,
}: {
    data: BarDatum[];
    series: Series[];
    height?: number;
}) {
    const max = Math.max(1, ...data.flatMap((d) => d.values));

    return (
        <div>
            <div className="flex items-end gap-3 sm:gap-5" style={{ height }}>
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                        <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-full w-full">
                            {d.values.map((v, j) => (
                                <div
                                    key={j}
                                    title={`${series[j].name}: ${v}`}
                                    className="rounded-t w-2.5 sm:w-4 transition-all duration-500"
                                    style={{ height: `${Math.max((v / max) * 100, v > 0 ? 3 : 0)}%`, background: series[j].color }}
                                />
                            ))}
                        </div>
                        <span className="text-[0.65rem] mt-2 truncate w-full text-center" style={{ color: 'var(--faint)' }}>{d.label}</span>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
                {series.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                        {s.name}
                    </div>
                ))}
            </div>
        </div>
    );
}
