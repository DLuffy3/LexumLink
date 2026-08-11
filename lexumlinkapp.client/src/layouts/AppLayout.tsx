import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/useSidebar';

// Shared shell for every authenticated page: renders the Sidebar and the
// mobile toggle button exactly once at the router level, so navigating
// between pages no longer unmounts/remounts the sidebar (which previously
// made it "pop back open" on every page load regardless of what the user
// had chosen). Individual pages only need to render their own <main> content
// via <Outlet />.
export default function AppLayout() {
    const { sidebarOpen, toggleSidebar } = useSidebar();

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <Sidebar />

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
                <div className="fixed top-4 left-4 z-30">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] shadow-md"
                        aria-label="Toggle sidebar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                <Outlet />
            </div>
        </div>
    );
}
