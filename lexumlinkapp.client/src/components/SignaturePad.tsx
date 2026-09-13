import { useEffect, useRef } from 'react';

interface SignaturePadProps {
    // Called with a base64 PNG data URL after each completed stroke, or null once cleared.
    onChange: (dataUrl: string | null) => void;
    height?: number;
}

// Hand-rolled canvas signature pad (mouse, touch and stylus via Pointer Events) — no
// external dependency, since this session has no working sandbox to npm install one.
export default function SignaturePad({ onChange, height = 180 }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const hasInkRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const setupCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ratio = window.devicePixelRatio || 1;
        const displayWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 500;

        canvas.width = displayWidth * ratio;
        canvas.height = height * ratio;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(ratio, ratio);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = '#1a1a1a';
        }
    };

    useEffect(() => {
        setupCanvas();
        const handleResize = () => {
            // Resizing mid-signature clears it — acceptable trade-off for a hand-rolled
            // pad (redrawing existing strokes at a new backing resolution isn't tracked).
            setupCanvas();
            hasInkRef.current = false;
            onChange(null);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [height]);

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drawingRef.current = true;
        lastPointRef.current = getPos(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const pos = getPos(e);
        if (ctx && lastPointRef.current) {
            ctx.beginPath();
            ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            hasInkRef.current = true;
        }
        lastPointRef.current = pos;
    };

    const finishStroke = () => {
        if (!drawingRef.current) return;
        drawingRef.current = false;
        lastPointRef.current = null;
        if (hasInkRef.current && canvasRef.current) {
            onChange(canvasRef.current.toDataURL('image/png'));
        }
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        hasInkRef.current = false;
        onChange(null);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                style={{ height: `${height}px` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishStroke}
                onPointerLeave={finishStroke}
                onPointerCancel={finishStroke}
                className="w-full touch-none bg-white border border-[var(--border)] rounded cursor-crosshair"
            />
            <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-[var(--faint)]">Sign above using your mouse, finger or stylus.</p>
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-medium text-[var(--brand-accent)] hover:underline"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}
