import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavCard {
    title: string;
    icon: string;
    href: string;
    description: string;
}

const navCards: NavCard[] = [
    { title: 'Dashboard', icon: 'fa-house', href: '/dashboard', description: 'Your landing page. Overview tab shows clients, active cases and today\'s workload. Analytics tab shows trends and Company Health.' },
    { title: 'Calendar', icon: 'fa-calendar-days', href: '/calendar', description: 'Appointments, follow-ups, court dates, medical assessments and task deadlines in one month/day view.' },
    { title: 'Clients', icon: 'fa-users', href: '/clients', description: 'Every client record: contact details, linked cases, claims and documents.' },
    { title: 'Cases', icon: 'fa-folder-open', href: '/cases', description: 'Track case status from open to closed, with incident dates and assigned staff.' },
    { title: 'Claims', icon: 'fa-file-invoice-dollar', href: '/claims', description: 'RAF claim numbers, amounts requested and awarded, and current status.' },
    { title: 'Documents', icon: 'fa-file-lines', href: '/documents', description: 'Upload and organize supporting documents against a client or case.' },
    { title: 'Settings', icon: 'fa-gear', href: '/settings', description: 'Your account details, and a place to log a bug or request a feature.' },
];

const tasks: { title: string; icon: string; steps: string[] }[] = [
    {
        title: 'Add a new client',
        icon: 'fa-user-plus',
        steps: [
            'Open Clients from the sidebar.',
            'Click "Add Client" in the top right.',
            'Fill in their contact details and save.',
            'You\'ll land on their client page — this is where their cases, claims and documents will appear.',
        ],
    },
    {
        title: 'Open a new case',
        icon: 'fa-folder-plus',
        steps: [
            'Go to Cases, or open a client\'s page and use "New Case".',
            'Select the client, add the incident date and a short description.',
            'Set the status — it starts as Open by default.',
            'Save. The case now shows up on your Dashboard and in Cases.',
        ],
    },
    {
        title: 'File a claim',
        icon: 'fa-file-circle-plus',
        steps: [
            'Go to Claims and click "Add Claim".',
            'Choose the case it belongs to and enter the claim number.',
            'Add the RAF reference and requested amount if you have them.',
            'Save — you can come back and add the awarded amount once it\'s finalized.',
        ],
    },
    {
        title: 'Upload a document',
        icon: 'fa-cloud-arrow-up',
        steps: [
            'Open the client or case the document belongs to, or go to Documents directly.',
            'Click "Upload Document" and choose the file from your device.',
            'Tag it with a document type so it\'s easy to find later.',
            'It\'ll appear under that client\'s Documents section immediately.',
        ],
    },
    {
        title: 'Schedule an appointment',
        icon: 'fa-calendar-plus',
        steps: [
            'Open Calendar and click on the date you need.',
            'Pick the type — appointment, follow-up, court date or medical assessment.',
            'Link it to a client or case if relevant, and set the time.',
            'It\'ll show up on your Dashboard under Upcoming Appointments too.',
        ],
    },
    {
        title: 'Check Company Health',
        icon: 'fa-heart-pulse',
        steps: [
            'Open Dashboard and switch to the Analytics tab.',
            'The Company Health card scores five factors: overdue tasks, approaching deadlines, pending documents, team workload and completed tasks.',
            'Use the bars below the chart to see which factor needs attention.',
        ],
    },
];

export default function Guide() {
    return (
        <main className="p-6 pt-16 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                {/* Header */}
                <div className="mb-10 text-center">
                    <div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                        style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-border)' }}
                    >
                        <i className="fa-solid fa-compass text-2xl" style={{ color: 'var(--brand-accent)' }} />
                    </div>
                    <h1 className="text-3xl font-bold">Guide &amp; Tutorial</h1>
                    <p className="text-[var(--muted)] mt-2 max-w-xl mx-auto">
                        A quick tour of LexumLink — what each page does, and how to get common tasks done.
                    </p>
                </div>

                {/* Sidebar orientation */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-map text-[var(--brand-accent)]" /> Finding your way around
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="bg-[var(--surface)] rounded-lg shadow p-4 border border-[var(--border)]">
                            <i className="fa-solid fa-circle-user text-xl mb-2" style={{ color: 'var(--brand-accent)' }} />
                            <p className="text-sm font-semibold mb-1">Top of the sidebar</p>
                            <p className="text-xs text-[var(--muted)]">Your profile picture, name and organisation. Click the picture to upload a new one.</p>
                        </div>
                        <div className="bg-[var(--surface)] rounded-lg shadow p-4 border border-[var(--border)]">
                            <i className="fa-solid fa-bars text-xl mb-2" style={{ color: 'var(--brand-accent)' }} />
                            <p className="text-sm font-semibold mb-1">Middle of the sidebar</p>
                            <p className="text-xs text-[var(--muted)]">Every page you can navigate to. Use the menu icon top-left to collapse it — it stays collapsed until you open it again.</p>
                        </div>
                        <div className="bg-[var(--surface)] rounded-lg shadow p-4 border border-[var(--border)]">
                            <i className="fa-solid fa-moon text-xl mb-2" style={{ color: 'var(--brand-accent)' }} />
                            <p className="text-sm font-semibold mb-1">Bottom of the sidebar</p>
                            <p className="text-xs text-[var(--muted)]">The LexumLink logo, the light/dark mode switch, and sign out.</p>
                        </div>
                    </div>
                </section>

                {/* Page directory */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-list-check text-[var(--brand-accent)]" /> What each page is for
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {navCards.map((card) => (
                            <Link
                                key={card.href}
                                to={card.href}
                                className="bg-[var(--surface)] rounded-lg shadow p-4 border border-[var(--border)] hover:border-[var(--brand-accent)] transition-colors group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span
                                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'var(--brand-soft)' }}
                                    >
                                        <i className={`fa-solid ${card.icon}`} style={{ color: 'var(--brand-accent)' }} />
                                    </span>
                                    <p className="font-semibold">{card.title}</p>
                                    <i className="fa-solid fa-arrow-right ml-auto text-xs text-[var(--faint)] group-hover:text-[var(--brand-accent)] transition-colors" />
                                </div>
                                <p className="text-xs text-[var(--muted)]">{card.description}</p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Common tasks */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-graduation-cap text-[var(--brand-accent)]" /> Common tasks, step by step
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {tasks.map((task) => (
                            <div key={task.title} className="bg-[var(--surface)] rounded-lg shadow p-5 border border-[var(--border)]">
                                <div className="flex items-center gap-3 mb-3">
                                    <span
                                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'var(--brand-soft)' }}
                                    >
                                        <i className={`fa-solid ${task.icon}`} style={{ color: 'var(--brand-accent)' }} />
                                    </span>
                                    <p className="font-semibold">{task.title}</p>
                                </div>
                                <ol className="space-y-2">
                                    {task.steps.map((step, i) => (
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
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tips */}
                <section>
                    <div
                        className="rounded-lg p-5 flex items-start gap-3"
                        style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand-border)' }}
                    >
                        <i className="fa-solid fa-lightbulb text-lg mt-0.5" style={{ color: 'var(--brand-accent)' }} />
                        <div>
                            <p className="font-semibold mb-1">Tips</p>
                            <ul className="text-sm text-[var(--muted)] space-y-1 list-disc list-inside">
                                <li>On a phone or tablet, tables scroll sideways — swipe left/right on a table if a column looks cut off.</li>
                                <li>Stuck or found a bug? Go to Settings and log a ticket — it reaches the team directly.</li>
                                <li>Your sidebar stays open or closed the way you left it, even after switching pages.</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </motion.div>
        </main>
    );
}
