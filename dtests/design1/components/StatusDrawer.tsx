'use client';

import { useState } from 'react';
import { Server, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useMockStore } from '@/lib/MockStoreContext';

export default function StatusDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { systemStatus } = useMockStore();

  const getStatusColor = () => {
    if (systemStatus.mcpServices === 'offline' || systemStatus.database === 'disconnected') {
      return '#ef4444'; // red
    }
    if (systemStatus.mcpServices === 'degraded') {
      return '#f59e0b'; // yellow
    }
    return '#10b981'; // green
  };

  const getStatusText = () => {
    if (systemStatus.mcpServices === 'offline' || systemStatus.database === 'disconnected') {
      return 'Down';
    }
    if (systemStatus.mcpServices === 'degraded') {
      return 'Degraded';
    }
    return 'Online';
  };

  const StatusContent = () => (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Server size={20} style={{ color: '#ffffff' }} />
        <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>System Status</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ 
                background: systemStatus.mcpServices === 'online' ? '#10b981' : systemStatus.mcpServices === 'degraded' ? '#f59e0b' : '#ef4444'
              }} 
            />
            <span className="text-sm" style={{ color: '#ffffff' }}>MCP Services</span>
          </div>
          <span className="text-sm capitalize" style={{ color: '#a3a3a3' }}>
            {systemStatus.mcpServices}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ background: systemStatus.market === 'open' ? '#10b981' : '#ef4444' }} 
            />
            <span className="text-sm" style={{ color: '#ffffff' }}>Market</span>
          </div>
          <span className="text-sm capitalize" style={{ color: '#a3a3a3' }}>
            {systemStatus.market}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ background: systemStatus.database === 'connected' ? '#10b981' : '#ef4444' }} 
            />
            <span className="text-sm" style={{ color: '#ffffff' }}>Database</span>
          </div>
          <span className="text-sm capitalize" style={{ color: '#a3a3a3' }}>
            {systemStatus.database}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button
              className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105"
              style={{ background: '#1a1a1a', border: '1px solid #262626' }}
              aria-label="Open system status"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ 
                  background: getStatusColor(),
                  animation: getStatusText() === 'Online' ? 'pulse 2s ease-in-out infinite' : 'none'
                }}
              />
              <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                {getStatusText()}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="h-[60vh]" 
            style={{ background: '#1a1a1a', border: 'none' }}
          >
            <StatusContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop/Tablet: Fixed Panel */}
      <div className="hidden md:block">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105"
            style={{ background: '#1a1a1a', border: '1px solid #262626' }}
            aria-label="Open system status"
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                background: getStatusColor(),
                animation: getStatusText() === 'Online' ? 'pulse 2s ease-in-out infinite' : 'none'
              }}
            />
            <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
              {getStatusText()}
            </span>
          </button>
        )}

        {isOpen && (
          <div
            className="fixed bottom-4 right-4 z-50 rounded-lg shadow-2xl transition-all"
            style={{ 
              background: '#1a1a1a', 
              border: '1px solid #262626',
              width: '360px',
              animation: 'slideUp 0.2s ease-out'
            }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#262626' }}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    background: getStatusColor(),
                    animation: getStatusText() === 'Online' ? 'pulse 2s ease-in-out infinite' : 'none'
                  }}
                />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  System {getStatusText()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
                style={{ color: '#a3a3a3' }}
                aria-label="Close system status"
              >
                <X size={16} />
              </Button>
            </div>
            <StatusContent />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
