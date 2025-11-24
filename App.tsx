
import React from 'react';
import { Header } from './components/Header';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { BackgroundBeams } from './components/ui/BackgroundBeams';
import { Business } from './components/Business';

const AppContent: React.FC = () => {
    const { theme } = useTheme();

    return (
        <div className="min-h-screen relative">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <Business />
            </main>
            {theme === 'dark' && <BackgroundBeams />}
        </div>
    );
}

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <ToastProvider>
                <NotificationProvider>
                    <AppContent />
                </NotificationProvider>
            </ToastProvider>
        </ThemeProvider>
    );
};

export default App;
