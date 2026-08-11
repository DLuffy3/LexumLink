import { useState } from 'react';

interface HelpButtonProps {
    title: string;
    description?: string;
    steps?: string[];
    tips?: string[];
}

// A small "?" button, fixed to the top-right of a page, that opens a modal
// explaining what the page is for and how to use it. Drop one of these into
// any page and pass page-specific copy — it's self-contained (owns its own
// open/close state) so it can be placed anywhere without extra wiring.
export default function HelpButton({ title, description, steps, tips }: HelpButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                title="Help"
                aria-label="Help"
                className="fixed top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)] shadow-md transition-colors"
            >
                <i className="fa-solid fa-question" />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setOpen(false)}>
                            <div className="absolute inset-0 bg-[var(--backdrop)]"></div>
                        </div>

                        <div className="inline-block align-bottom bg-[var(--surface)] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="px-5 pt-5 pb-4 sm:p-6">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'var(--brand-soft)' }}
                                        >
                                            <i className="fa-solid fa-circle-question" style={{ color: 'var(--brand-accent)' }} />
                                        </span>
                                        <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
                                    </div>
                                    <button
                                        onClick={() => setOpen(false)}
                                        aria-label="Close"
                                        className="text-[var(--faint)] hover:text-[var(--text)] flex-shrink-0"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {description && (
                                    <p className="text-sm text-[var(--muted)] text-left mb-4">{description}</p>
                                )}

                                {steps && steps.length > 0 && (
                                    <ol className="space-y-2 text-left mb-4">
                                        {steps.map((step, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-[var(--muted)]">
                                                <span
                                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                                                    style={{ background: 'var(--brand)', color: '#fff' }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}

                                {tips && tips.length > 0 && (
                                    <div
                                        className="rounded-lg p-3 text-left flex items-start gap-2"
                                        style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-border)' }}
                                    >
                                        <i className="fa-solid fa-lightbulb mt-0.5 text-sm" style={{ color: 'var(--brand-accent)' }} />
                                        <ul className="text-xs text-[var(--muted)] space-y-1 list-disc list-inside">
                                            {tips.map((tip, i) => (
                                                <li key={i}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="bg-[var(--overlay-weak)] px-5 py-3 sm:px-6 flex justify-end">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[var(--brand)] text-sm font-medium text-white hover:bg-[var(--brand-hover)]"
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
