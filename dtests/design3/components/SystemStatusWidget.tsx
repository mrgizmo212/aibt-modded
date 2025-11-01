import React, { useState } from 'react';
import { ServerIcon, XIcon } from './icons';

const StatusItem: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color}`}></div>
            <p className="text-text-secondary">{label}</p>
        </div>
        <p className="text-text-primary font-medium">{value}</p>
    </div>
);

const SystemStatusWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2 bg-surface-elevated border border-border rounded-full shadow-lg hover:bg-border transition-colors animate-fade-in"
                aria-label="Open System Status"
            >
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </div>
                <span className="text-sm text-text-primary font-medium">System Status</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-72 bg-surface-elevated border border-border rounded-lg shadow-2xl animate-slide-up">
            <header className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <ServerIcon className="w-5 h-5 text-text-tertiary" />
                    <h3 className="font-semibold text-text-primary">System Status</h3>
                </div>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-1 text-text-secondary hover:text-text-primary rounded-md hover:bg-border"
                    aria-label="Close System Status"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </header>
            <div className="p-4 space-y-3 text-sm">
                <StatusItem label="MCP Services" value="Online" color="bg-success" />
                <StatusItem label="Market" value="Open" color="bg-success" />
                <StatusItem label="Database" value="Connected" color="bg-success" />
            </div>
             <div className="p-2 text-center text-xs text-text-tertiary bg-background/50 border-t border-border rounded-b-lg">
                All systems operational.
            </div>
        </div>
    );
};

export default SystemStatusWidget;
