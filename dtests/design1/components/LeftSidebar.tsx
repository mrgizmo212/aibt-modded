'use client';

import { LayoutDashboard, Plus, Shield, Settings, LogOut, Brain } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { mockUser } from '@/lib/mockData';
import { useMockStore } from '@/lib/MockStoreContext';
import { useToast } from '@/components/ui/toast';
import { useState } from 'react';

interface LeftSidebarProps {
  selectedModelId: number | null;
  onSelectModel: (id: number) => void;
}

export default function LeftSidebar({ selectedModelId, onSelectModel }: LeftSidebarProps) {
  const [expandedModels, setExpandedModels] = useState(true);
  const { models, toggleModel } = useMockStore();
  const { showToast } = useToast();

  const handleToggleModel = (modelId: number) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    
    toggleModel(modelId);
    const newStatus = model.status === 'running' ? 'stopped' : 'running';
    showToast(
      `${model.name} ${newStatus === 'running' ? 'started' : 'stopped'}`,
      'success'
    );
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Branding & User Profile */}
      <div className="p-6 border-b" style={{ borderColor: '#262626' }}>
        <div className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>TTG</div>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
            <AvatarFallback style={{ background: '#3b82f6', color: '#ffffff' }}>
              {mockUser.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>
              {mockUser.name}
            </div>
            <div className="text-xs truncate" style={{ color: '#a3a3a3' }}>
              {mockUser.email}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Dashboard */}
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-all"
            style={{
              background: selectedModelId === null ? '#1a1a1a' : 'transparent',
              borderLeft: selectedModelId === null ? '3px solid #3b82f6' : '3px solid transparent',
              color: '#ffffff'
            }}
            onClick={() => onSelectModel(null as any)}
          >
            <LayoutDashboard size={20} />
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          {/* My Models Section */}
          <div className="mt-6">
            <button
              onClick={() => setExpandedModels(!expandedModels)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#737373' }}
            >
              <span>My Models</span>
              <span>{expandedModels ? '−' : '+'}</span>
            </button>

            {expandedModels && (
              <div className="mt-2 space-y-1">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => onSelectModel(model.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all group"
                    style={{
                      background: selectedModelId === model.id ? '#141414' : 'transparent',
                      borderLeft: selectedModelId === model.id ? '3px solid #3b82f6' : '3px solid transparent'
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: model.status === 'running' ? '#10b981' : '#525252',
                        animation: model.status === 'running' ? 'pulse 2s ease-in-out infinite' : 'none'
                      }}
                    />
                    <span className="flex-1 text-sm text-left truncate" style={{ color: '#ffffff' }}>
                      {model.name}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={model.status === 'running'}
                        onCheckedChange={() => handleToggleModel(model.id)}
                        className="scale-75"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create Model Button */}
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg mt-4 border border-dashed transition-all hover:bg-opacity-50"
            style={{
              borderColor: '#262626',
              color: '#a3a3a3',
              background: 'transparent'
            }}
          >
            <Plus size={20} />
            <span className="text-sm font-medium">Create Model</span>
          </button>

          {/* Admin (conditional) */}
          {mockUser.role === 'admin' && (
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg mt-4 transition-all"
              style={{ color: '#ffffff' }}
            >
              <Shield size={20} />
              <span className="text-sm font-medium">Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: '#262626' }}>
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition-all hover:bg-opacity-50"
          style={{ color: '#a3a3a3' }}
        >
          <Settings size={20} />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-opacity-50"
          style={{ color: '#a3a3a3' }}
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
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
      `}</style>
    </div>
  );
}
