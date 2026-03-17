import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
    return (
        <div className="atlas-page flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto animate-in fade-in duration-200">
                <div className="atlas-content container mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

