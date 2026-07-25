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

// ─── Smooth line chart ────────────────────────────────────────────────────────

export interface LinePoint { label: string; value: number; }

function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
}

export function LineChart({ points, height = 220, yUnit }: { points: LinePoint[]; height?: number; yUnit?: string }) {
    const W = 640;
    const H = height;
    const padX = 8;
    const padTop = 16;
    const bottom = H - 28;

    // "Nice" y-axis scale with round tick values.
    const rawMax = Math.max(1, ...points.map((p) => p.value));
    const tickCount = 4;
    const step = Math.max(1, Math.ceil(rawMax / tickCount));
    const niceMax = step * tickCount;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step); // 0 … niceMax
    const yFor = (v: number) => padTop + (1 - v / niceMax) * (bottom - padTop);

    const n = points.length;
    const xy = points.map((p, i) => ({
        x: padX + (n <= 1 ? (W - 2 * padX) / 2 : (i * (W - 2 * padX)) / (n - 1)),
        y: yFor(p.value),
    }));
    const line = smoothPath(xy);
    const area = n > 0 ? `${line} L ${xy[n - 1].x.toFixed(2)} ${bottom} L ${xy[0].x.toFixed(2)} ${bottom} Z` : '';
    const gid = 'lineFill';

    return (
        <div className="flex">
            {/* Y-axis (case counts) */}
            <div className="relative flex-shrink-0" style={{ width: 34, height: H }} aria-hidden>
                {ticks.map((t) => (
                    <span key={t} className="absolute right-2 text-[0.6rem] text-[var(--faint)] leading-none" style={{ top: yFor(t) - 4 }}>{t}</span>
                ))}
                {yUnit && (
                    <span className="absolute text-[0.55rem] uppercase tracking-wider text-[var(--faint)]" style={{ top: '50%', left: -8, transform: 'rotate(-90deg) translateX(50%)', transformOrigin: 'left center', whiteSpace: 'nowrap' }}>{yUnit}</span>
                )}
            </div>

            {/* Plot */}
            <div className="flex-1 min-w-0">
                <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
                    <defs>
                        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {ticks.map((t) => (
                        <line key={t} x1={0} y1={yFor(t)} x2={W} y2={yFor(t)} stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                    ))}
                    {area && <path d={area} fill={`url(#${gid})`} stroke="none" />}
                    {line && <path d={line} fill="none" stroke="var(--brand-accent)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                <div className="flex justify-between mt-2">
                    {points.map((p, i) => (
                        <span key={i} className="text-[0.6rem] text-[var(--faint)] flex-1 text-center truncate">{p.label}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Radar / spider chart ─────────────────────────────────────────────────────

export interface RadarAxis { label: string; value: number; } // value 0–max

export function Radar({ axes, size = 260, max = 100 }: { axes: RadarAxis[]; size?: number; max?: number }) {
    const n = axes.length;
    // Extra horizontal room so left/right axis labels don't clip.
    const padSide = 56;
    const padV = 30;
    const vw = size + padSide * 2;
    const vh = size;
    const cx = vw / 2;
    const cy = vh / 2;
    const R = size / 2 - padV;
    const angle = (i: number) => -Math.PI / 2 + i * ((2 * Math.PI) / n);
    const pt = (i: number, r: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });
    const poly = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const rings = [0.25, 0.5, 0.75, 1];
    const dataPts = axes.map((a, i) => pt(i, (Math.max(0, Math.min(max, a.value)) / max) * R));

    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" style={{ maxWidth: vw, margin: '0 auto', display: 'block' }}>
            {rings.map((rr, ri) => (
                <polygon key={ri} points={poly(axes.map((_, i) => pt(i, rr * R)))} fill="none" stroke="var(--border)" strokeWidth={1} />
            ))}
            {axes.map((_, i) => {
                const p = pt(i, R);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1} />;
            })}
            <polygon points={poly(dataPts)} fill="var(--brand-soft)" stroke="var(--brand-accent)" strokeWidth={2} strokeLinejoin="round" />
            {dataPts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--brand-accent)" />
            ))}
            {axes.map((a, i) => {
                const p = pt(i, R + 18);
                const anchor = Math.abs(p.x - cx) < 8 ? 'middle' : p.x < cx ? 'end' : 'start';
                return (
                    <text key={i} x={p.x} y={p.y} fontSize={11} fill="var(--muted)" textAnchor={anchor} dominantBaseline="middle">{a.label}</text>
                );
            })}
        </svg>
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
