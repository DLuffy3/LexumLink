import { useEffect, useState, type ReactNode } from 'react';
import { SidebarContext } from './SidebarContext';

const STORAGE_KEY = 'lexumlink-sidebar-open';

// Sidebar open/closed state lives here instead of per-page useState so that
// closing it on one page keeps it closed when the user navigates to the next
// one. Falls back to open on desktop-sized screens and closed on mobile the
// very first time (no stored preference yet).
function getInitialState(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(getInitialState);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(sidebarOpen));
    }, [sidebarOpen]);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    return (
        <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar, setSidebarOpen }}>
            {children}
        </SidebarContext.Provider>
    );
}
